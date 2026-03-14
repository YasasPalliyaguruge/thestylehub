'use client'

import { useEffect, useState } from 'react'
import {
  AdminCard,
  AdminFilterBar,
  AdminPageTransition,
  AdminShellHeader,
  AdminTableShell,
} from '@/components/admin/ui'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
  active: boolean
  created_at: string
  last_login?: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      setUsers(data.data || [])
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const createUser = async () => {
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      }
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to create user')
        return
      }
      setUsers((prev) => [data.data, ...prev])
      setSuccess('User created successfully.')
      setForm({ name: '', email: '', password: '', role: 'employee' })
    } catch (err) {
      console.error('Failed to create user:', err)
      setError('Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (userId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to update user')
        return
      }
      setUsers((prev) => prev.map((user) => (user.id === userId ? data.data : user)))
    } catch (err) {
      console.error('Failed to update user:', err)
      setError('Failed to update user')
    }
  }

  const resetPassword = async (userId: string) => {
    const nextPassword = window.prompt('Enter a new temporary password (min 8 chars, upper/lower/number):')
    if (!nextPassword) return
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: nextPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }
      setSuccess('Password reset successfully.')
      setUsers((prev) => prev.map((user) => (user.id === userId ? data.data : user)))
    } catch (err) {
      console.error('Failed to reset password:', err)
      setError('Failed to reset password')
    }
  }

  return (
    <AdminPageTransition className="space-y-6">
      <AdminShellHeader
        title="Users"
        subtitle="Create and manage admin or employee logins."
      />

      <AdminCard className="space-y-4">
        <h2 className="text-lg text-white font-semibold">Create Employee</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="px-4 py-2.5"
          />
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="px-4 py-2.5"
          />
          <input
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="px-4 py-2.5"
          />
          <select
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            className="px-3 py-2"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <div className="admin-card border-red-500/40 text-red-300">{error}</div>}
        {success && <div className="admin-card border-green-500/40 text-green-300">{success}</div>}
        <button className="admin-btn-primary" onClick={createUser} disabled={creating}>
          {creating ? 'Creating...' : 'Create User'}
        </button>
      </AdminCard>

      <AdminFilterBar>
        <div className="text-sm text-gray-400">
          {loading ? 'Loading users...' : `${users.length} total users`}
        </div>
      </AdminFilterBar>

      <AdminTableShell>
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Name</th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Email</th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Role</th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Status</th>
              <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-primary/10">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 text-white">{user.name}</td>
                <td className="px-6 py-4 text-gray-300">{user.email}</td>
                <td className="px-6 py-4 text-gray-300 capitalize">{user.role}</td>
                <td className="px-6 py-4 text-gray-300">{user.active ? 'Active' : 'Disabled'}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="admin-btn-secondary"
                      onClick={() => resetPassword(user.id)}
                    >
                      Reset Password
                    </button>
                    <button
                      className="admin-btn-secondary"
                      onClick={() => toggleActive(user.id, !user.active)}
                    >
                      {user.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminPageTransition>
  )
}
