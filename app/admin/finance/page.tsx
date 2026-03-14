'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AdminCard,
  AdminFilterBar,
  AdminPageTransition,
  AdminShellHeader,
  AdminTableShell,
} from '@/components/admin/ui'

interface FinanceEntry {
  id: string
  entry_type: 'expense' | 'income'
  source_type: string
  category: string | null
  description: string | null
  amount: number
  payment_method: string | null
  occurred_at: string
}

export default function FinancePage() {
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [role, setRole] = useState<'admin' | 'employee'>('admin')

  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    payment_method: 'cash',
    occurred_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      const response = await fetch(`/api/admin/finance/entries?${params.toString()}`)
      const data = await response.json()
      setEntries(data.data?.entries || [])
    } catch (err) {
      console.error('Failed to fetch finance entries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
    // Fetch user role
    const fetchRole = async () => {
      try {
        const response = await fetch('/api/admin/users/me')
        const data = await response.json()
        if (response.ok && data.data?.role) {
          setRole(data.data.role)
        }
      } catch (error) {
        console.error('Error fetching role:', error)
      }
    }
    fetchRole()
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [typeFilter, fromDate, toDate])

  const incomeTotal = useMemo(
    () => entries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0),
    [entries]
  )
  const expenseTotal = useMemo(
    () => entries.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0),
    [entries]
  )
  const netTotal = incomeTotal - expenseTotal

  const addExpense = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        entry_type: 'expense',
        category: form.category.trim(),
        description: form.description.trim(),
        amount: Number(form.amount),
        payment_method: form.payment_method,
        occurred_at: form.occurred_at,
      }
      const response = await fetch('/api/admin/finance/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to add expense')
        return
      }
      setSuccess('Expense added.')
      setForm({ category: '', description: '', amount: '', payment_method: 'cash', occurred_at: '' })
      setEntries((prev) => [data.data, ...prev])
    } catch (err) {
      console.error('Failed to add expense:', err)
      setError('Failed to add expense')
    } finally {
      setSaving(false)
    }
  }

  const deleteFinanceEntry = async (id: string) => {
    if (role !== 'admin') return
    if (!confirm('Are you sure you want to delete this finance entry?')) return

    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/admin/finance/entries/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete finance entry')
      }
      setSuccess('Finance entry deleted.')
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
    } catch (err) {
      console.error('Failed to delete finance entry:', err)
      setError('Failed to delete finance entry')
    }
  }

  return (
    <AdminPageTransition className="space-y-6">
      <AdminShellHeader
        title="Finance"
        subtitle="Track expenses, booking income, and POS revenue."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminCard className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Total Income</p>
          <p className="text-2xl text-gold-primary font-semibold">LKR {incomeTotal.toLocaleString()}</p>
        </AdminCard>
        <AdminCard className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Total Expenses</p>
          <p className="text-2xl text-red-300 font-semibold">LKR {expenseTotal.toLocaleString()}</p>
        </AdminCard>
        <AdminCard className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Net</p>
          <p className="text-2xl text-white font-semibold">LKR {netTotal.toLocaleString()}</p>
        </AdminCard>
      </div>

      <AdminCard className="space-y-5">
        <h2 className="text-lg text-white font-semibold">Add Expense</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Category</label>
            <input
              type="text"
              placeholder="E.g., Supplies"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="px-3 py-2.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Description</label>
            <input
              type="text"
              placeholder="E.g., Hair products"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="px-3 py-2.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Amount (LKR)</label>
            <input
              type="number"
              placeholder="E.g., 2500"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              className="px-3 py-2.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Method</label>
            <select
              value={form.payment_method}
              onChange={(event) => setForm((prev) => ({ ...prev, payment_method: event.target.value }))}
              className="px-3 py-2.5"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={form.occurred_at}
              onChange={(event) => setForm((prev) => ({ ...prev, occurred_at: event.target.value }))}
              className="px-3 py-2.5"
            />
          </div>
        </div>
        {error && <div className="admin-card border-red-500/40 text-red-300">{error}</div>}
        {success && <div className="admin-card border-green-500/40 text-green-300">{success}</div>}
        <button className="admin-btn-primary" onClick={addExpense} disabled={saving}>
          {saving ? 'Saving...' : 'Add Expense'}
        </button>
      </AdminCard>

      <AdminFilterBar>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="block text-[0.65rem] font-medium text-gray-500 uppercase tracking-wider">Type Filter</label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="px-3 py-2 min-w-[120px]"
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[0.65rem] font-medium text-gray-500 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[0.65rem] font-medium text-gray-500 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="px-3 py-2"
            />
          </div>
        </div>
      </AdminFilterBar>

      <AdminTableShell>
        <table className="w-full min-w-[900px]">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Date</th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Type</th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Category</th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Description</th>
              <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Amount</th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Method</th>
              {role === 'admin' && <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-primary/10">
            {loading ? (
              <tr>
                <td className="px-6 py-6 text-gray-400" colSpan={6}>
                  Loading finance entries...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-gray-400" colSpan={6}>
                  No finance entries found.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {new Date(entry.occurred_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 capitalize">{entry.entry_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{entry.category || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{entry.description || '-'}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-300">
                    LKR {Math.abs(entry.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{entry.payment_method || '-'}</td>
                  {role === 'admin' && (
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => deleteFinanceEntry(entry.id)}
                        className="admin-btn-secondary text-red-300 border-red-500/30"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminPageTransition>
  )
}
