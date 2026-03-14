'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AdminCard,
  AdminPageTransition,
  AdminShellHeader,
  AdminTableShell,
} from '@/components/admin/ui'

interface TeamMember {
  id: string
  name: string
  role: string
  active: boolean
}

interface AttendanceRecord {
  id: string
  employee_id: string
  employee_name: string
  attendance_date: string
  check_in_at: string | null
  check_out_at: string | null
  notes: string | null
}

interface PerformanceLog {
  id: string
  employee_id: string
  employee_name: string
  service_name: string
  amount: number
  source_type: string
  occurred_at: string
}

interface CompensationSetting {
  employee_id: string
  employee_name: string
  base_salary: number | null
  commission_rate: number | null
  bonus_rate: number | null
}

interface PaymentEntry {
  id: string
  employee_id: string
  employee_name: string
  entry_type: string
  amount: number
  paid_at: string | null
  payment_method: string | null
  period_start: string | null
  period_end: string | null
  notes: string | null
}

function toNumber(value: any) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toMonthInput(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default function StaffPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [logs, setLogs] = useState<PerformanceLog[]>([])
  const [settings, setSettings] = useState<CompensationSetting[]>([])
  const [payments, setPayments] = useState<PaymentEntry[]>([])

  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(toMonthInput(new Date()))

  const [attendanceForm, setAttendanceForm] = useState({
    employee_id: '',
    date: '',
    check_in: '',
    check_out: '',
    notes: '',
  })

  const [logForm, setLogForm] = useState({
    employee_id: '',
    service_name: '',
    amount: '',
    occurred_at: '',
    source_type: 'manual',
  })

  const [paymentForm, setPaymentForm] = useState({
    employee_id: '',
    entry_type: 'salary',
    amount: '',
    payment_method: 'cash',
    period_start: '',
    period_end: '',
    paid_at: '',
    notes: '',
  })

  const [compDrafts, setCompDrafts] = useState<Record<string, { base_salary: string; commission_rate: string; bonus_rate: string }>>({})

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [staffTablesMissing, setStaffTablesMissing] = useState(false)
  const [role, setRole] = useState<'admin' | 'employee'>('admin')

  const fetchAll = async () => {
    try {
      const [teamRes, attendanceRes, logsRes, settingsRes, paymentsRes] = await Promise.all([
        fetch('/api/admin/team'),
        fetch('/api/admin/staff/attendance'),
        fetch('/api/admin/staff/performance'),
        fetch('/api/admin/staff/compensation'),
        fetch('/api/admin/staff/payments'),
      ])
      const teamData = await teamRes.json()
      const attendanceData = await attendanceRes.json()
      const logsData = await logsRes.json()
      const settingsData = await settingsRes.json()
      const paymentsData = await paymentsRes.json()

      setTeam(teamData.data || [])
      setAttendance(attendanceData.data?.records || [])
      setLogs(logsData.data?.logs || [])
      setSettings(settingsData.data?.settings || [])
      setPayments(paymentsData.data?.payments || [])

      const missingTables = [attendanceData, logsData, settingsData, paymentsData].some((payload) =>
        typeof payload?.error === 'string' &&
        payload.error.includes('Staff tracking tables missing')
      )
      setStaffTablesMissing(missingTables)

      if (!teamRes.ok || !attendanceRes.ok || !logsRes.ok || !settingsRes.ok || !paymentsRes.ok) {
        const firstError =
          teamData?.error ||
          attendanceData?.error ||
          logsData?.error ||
          settingsData?.error ||
          paymentsData?.error ||
          'Failed to load staff data.'
        setError(firstError)
      } else {
        setError('')
      }

      const draft: Record<string, { base_salary: string; commission_rate: string; bonus_rate: string }> = {}
      ;(settingsData.data?.settings || []).forEach((row: CompensationSetting) => {
        draft[row.employee_id] = {
          base_salary: String(row.base_salary ?? 0),
          commission_rate: String(row.commission_rate ?? 0),
          bonus_rate: String(row.bonus_rate ?? 0),
        }
      })
      setCompDrafts(draft)
    } catch (err) {
      console.error('Failed to load staff data:', err)
      setError('Failed to load staff data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
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

  const monthStart = useMemo(() => new Date(`${month}-01T00:00:00`), [month])
  const monthEnd = useMemo(() => {
    const d = new Date(monthStart)
    d.setMonth(d.getMonth() + 1)
    d.setDate(0)
    d.setHours(23, 59, 59, 999)
    return d
  }, [monthStart])

  const performanceSummary = useMemo(() => {
    const filtered = logs.filter((log) => {
      const t = new Date(log.occurred_at).getTime()
      return t >= monthStart.getTime() && t <= monthEnd.getTime()
    })

    return team.map((member) => {
      const total = filtered
        .filter((log) => log.employee_id === member.id)
        .reduce((sum, log) => sum + toNumber(log.amount), 0)

      const setting = settings.find((s) => s.employee_id === member.id)
      const commissionRate = toNumber(setting?.commission_rate ?? 0)
      const commissionDue = (total * commissionRate) / 100

      return {
        employee_id: member.id,
        employee_name: member.name,
        total,
        commissionRate,
        commissionDue,
      }
    })
  }, [logs, monthStart, monthEnd, team, settings])

  const saveAttendance = async () => {
    setError('')
    setSuccess('')
    if (!attendanceForm.employee_id || !attendanceForm.date) {
      setError('Select employee and date.')
      return
    }

    const toIso = (date: string, time: string) => {
      if (!date || !time) return null
      return new Date(`${date}T${time}:00`).toISOString()
    }

    const payload = {
      employee_id: attendanceForm.employee_id,
      attendance_date: attendanceForm.date,
      check_in_at: toIso(attendanceForm.date, attendanceForm.check_in),
      check_out_at: toIso(attendanceForm.date, attendanceForm.check_out),
      notes: attendanceForm.notes.trim(),
    }

    const response = await fetch('/api/admin/staff/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    if (!response.ok) {
      if (data.error?.includes('Staff tracking tables missing')) {
        setStaffTablesMissing(true)
      }
      setError(data.error || 'Failed to save attendance')
      return
    }

    setSuccess('Attendance saved.')
    setAttendanceForm({ employee_id: '', date: '', check_in: '', check_out: '', notes: '' })
    setAttendance((prev) => [data.data, ...prev].slice(0, 200))
  }

  const addPerformanceLog = async () => {
    setError('')
    setSuccess('')
    if (!logForm.employee_id || !logForm.service_name || !logForm.amount) {
      setError('Complete employee, service, and amount.')
      return
    }

    const payload = {
      employee_id: logForm.employee_id,
      service_name: logForm.service_name.trim(),
      amount: toNumber(logForm.amount),
      occurred_at: logForm.occurred_at ? new Date(logForm.occurred_at).toISOString() : undefined,
      source_type: logForm.source_type,
    }

    const response = await fetch('/api/admin/staff/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) {
      if (data.error?.includes('Staff tracking tables missing')) {
        setStaffTablesMissing(true)
      }
      setError(data.error || 'Failed to add service log')
      return
    }

    setSuccess('Service log added.')
    setLogForm({ employee_id: '', service_name: '', amount: '', occurred_at: '', source_type: 'manual' })
    setLogs((prev) => [data.data, ...prev].slice(0, 300))
  }

  const saveCompensation = async (employeeId: string) => {
    setError('')
    setSuccess('')
    const draft = compDrafts[employeeId] || { base_salary: '0', commission_rate: '0', bonus_rate: '0' }

    const payload = {
      employee_id: employeeId,
      base_salary: toNumber(draft.base_salary),
      commission_rate: toNumber(draft.commission_rate),
      bonus_rate: toNumber(draft.bonus_rate),
    }

    const response = await fetch('/api/admin/staff/compensation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) {
      if (data.error?.includes('Staff tracking tables missing')) {
        setStaffTablesMissing(true)
      }
      setError(data.error || 'Failed to save compensation')
      return
    }

    setSuccess('Compensation settings saved.')
    fetchAll()
  }

  const recordPayment = async () => {
    setError('')
    setSuccess('')
    if (!paymentForm.employee_id || !paymentForm.amount) {
      setError('Select employee and amount.')
      return
    }

    const payload = {
      employee_id: paymentForm.employee_id,
      entry_type: paymentForm.entry_type,
      amount: toNumber(paymentForm.amount),
      payment_method: paymentForm.payment_method,
      period_start: paymentForm.period_start || undefined,
      period_end: paymentForm.period_end || undefined,
      paid_at: paymentForm.paid_at ? new Date(paymentForm.paid_at).toISOString() : undefined,
      notes: paymentForm.notes.trim(),
    }

    const response = await fetch('/api/admin/staff/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) {
      if (data.error?.includes('Staff tracking tables missing')) {
        setStaffTablesMissing(true)
      }
      setError(data.error || 'Failed to record payment')
      return
    }

    setSuccess('Payment recorded.')
    setPaymentForm({
      employee_id: '',
      entry_type: 'salary',
      amount: '',
      payment_method: 'cash',
      period_start: '',
      period_end: '',
      paid_at: '',
      notes: '',
    })
    setPayments((prev) => [data.data, ...prev].slice(0, 200))
  }

  const deleteAttendance = async (id: string) => {
    if (role !== 'admin') return
    if (!confirm('Are you sure you want to delete this attendance record?')) return

    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/admin/staff/attendance/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete attendance record')
      }
      setSuccess('Attendance record deleted.')
      setAttendance((prev) => prev.filter((record) => record.id !== id))
    } catch (err) {
      console.error('Failed to delete attendance:', err)
      setError('Failed to delete attendance record')
    }
  }

  const deletePerformanceLog = async (id: string) => {
    if (role !== 'admin') return
    if (!confirm('Are you sure you want to delete this performance log?')) return

    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/admin/staff/performance/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete performance log')
      }
      setSuccess('Performance log deleted.')
      setLogs((prev) => prev.filter((log) => log.id !== id))
    } catch (err) {
      console.error('Failed to delete performance log:', err)
      setError('Failed to delete performance log')
    }
  }

  const deletePaymentRecord = async (id: string) => {
    if (role !== 'admin') return
    if (!confirm('Are you sure you want to delete this payment record?')) return

    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/admin/staff/payments/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete payment record')
      }
      setSuccess('Payment record deleted.')
      setPayments((prev) => prev.filter((payment) => payment.id !== id))
    } catch (err) {
      console.error('Failed to delete payment record:', err)
      setError('Failed to delete payment record')
    }
  }

  if (loading) {
    return (
      <AdminPageTransition className="space-y-5">
        <AdminShellHeader title="Staff" subtitle="Loading staff tracking..." />
      </AdminPageTransition>
    )
  }

  return (
    <AdminPageTransition className="space-y-6">
      <AdminShellHeader
        title="Staff Performance & Payroll"
        subtitle="Track attendance, services, income, and compensation."
      />

      {staffTablesMissing && (
        <div className="admin-card border-yellow-500/40 text-yellow-200">
          Staff tracking tables are missing. Run migrations (006_employee_tracking.sql) and reload.
        </div>
      )}
      {error && <div className="admin-card border-red-500/40 text-red-300">{error}</div>}
      {success && <div className="admin-card border-green-500/40 text-green-300">{success}</div>}

      <AdminCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg text-white font-semibold">Monthly Performance Summary</h2>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="px-3 py-2"
          />
        </div>
        <AdminTableShell>
          <table className="w-full min-w-[720px]">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Employee</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Income</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Commission %</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Commission Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-primary/10">
              {performanceSummary.map((row) => (
                <tr key={row.employee_id}>
                  <td className="px-6 py-4 text-sm text-gray-300">{row.employee_name}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-300">LKR {row.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-300">{row.commissionRate}%</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-300">LKR {row.commissionDue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      </AdminCard>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-6">
        <AdminCard className="space-y-5">
          <h2 className="text-lg text-white font-semibold">Attendance</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</label>
              <select
                value={attendanceForm.employee_id}
                onChange={(event) => setAttendanceForm((prev) => ({ ...prev, employee_id: event.target.value }))}
                className="px-3 py-2.5"
              >
                <option value="">Select employee</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={attendanceForm.date}
                onChange={(event) => setAttendanceForm((prev) => ({ ...prev, date: event.target.value }))}
                className="px-3 py-2.5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Check In Time</label>
              <input
                type="time"
                value={attendanceForm.check_in}
                onChange={(event) => setAttendanceForm((prev) => ({ ...prev, check_in: event.target.value }))}
                className="px-3 py-2.5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Check Out Time</label>
              <input
                type="time"
                value={attendanceForm.check_out}
                onChange={(event) => setAttendanceForm((prev) => ({ ...prev, check_out: event.target.value }))}
                className="px-3 py-2.5"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</label>
              <input
                type="text"
                placeholder="Optional notes..."
                value={attendanceForm.notes}
                onChange={(event) => setAttendanceForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="px-3 py-2.5"
              />
            </div>
          </div>
          <button className="admin-btn-primary" onClick={saveAttendance}>
            Save Attendance
          </button>

          <AdminTableShell>
            <table className="w-full min-w-[760px]">
              <thead>
                <tr>
                   <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Employee</th>
                   <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Date</th>
                   <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Check In</th>
                   <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Check Out</th>
                   <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Notes</th>
                   {role === 'admin' && <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Actions</th>}
                 </tr>
              </thead>
              <tbody className="divide-y divide-gold-primary/10">
                {attendance.slice(0, 20).map((row) => (
                   <tr key={row.id}>
                     <td className="px-6 py-4 text-sm text-gray-300">{row.employee_name}</td>
                     <td className="px-6 py-4 text-sm text-gray-300">{row.attendance_date}</td>
                     <td className="px-6 py-4 text-sm text-gray-300">{row.check_in_at ? new Date(row.check_in_at).toLocaleTimeString() : '-'}</td>
                     <td className="px-6 py-4 text-sm text-gray-300">{row.check_out_at ? new Date(row.check_out_at).toLocaleTimeString() : '-'}</td>
                     <td className="px-6 py-4 text-sm text-gray-400">{row.notes || '-'}</td>
                     {role === 'admin' && (
                       <td className="px-6 py-4 text-sm">
                         <button
                           onClick={() => deleteAttendance(row.id)}
                           className="admin-btn-secondary text-red-300 border-red-500/30"
                         >
                           Delete
                         </button>
                       </td>
                     )}
                   </tr>
                 ))}
              </tbody>
            </table>
          </AdminTableShell>
        </AdminCard>

        <AdminCard className="space-y-5">
          <h2 className="text-lg text-white font-semibold">Record Service (Performance)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</label>
              <select
                value={logForm.employee_id}
                onChange={(event) => setLogForm((prev) => ({ ...prev, employee_id: event.target.value }))}
                className="px-3 py-2.5"
              >
                <option value="">Select employee</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Service Name</label>
              <input
                type="text"
                placeholder="E.g., Ladies' Haircut"
                value={logForm.service_name}
                onChange={(event) => setLogForm((prev) => ({ ...prev, service_name: event.target.value }))}
                className="px-3 py-2.5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Amount (LKR)</label>
              <input
                type="number"
                placeholder="E.g., 5000"
                value={logForm.amount}
                onChange={(event) => setLogForm((prev) => ({ ...prev, amount: event.target.value }))}
                className="px-3 py-2.5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Date & Time Occurred</label>
              <input
                type="datetime-local"
                value={logForm.occurred_at}
                onChange={(event) => setLogForm((prev) => ({ ...prev, occurred_at: event.target.value }))}
                className="px-3 py-2.5"
              />
            </div>
          </div>
          <button className="admin-btn-primary" onClick={addPerformanceLog}>
            Add Service Log
          </button>

          <AdminTableShell>
            <table className="w-full min-w-[520px]">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Employee</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Service</th>
                  <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Amount</th>
                  {role === 'admin' && <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-primary/10">
                {logs.slice(0, 15).map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 text-sm text-gray-300">{row.employee_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{row.service_name}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300">LKR {toNumber(row.amount).toLocaleString()}</td>
                    {role === 'admin' && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deletePerformanceLog(row.id)}
                          className="admin-btn-secondary text-red-300 border-red-500/30"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>
        </AdminCard>
      </div>

      <AdminCard className="space-y-4">
        <h2 className="text-lg text-white font-semibold">Compensation Settings (Customizable)</h2>
        <AdminTableShell>
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Employee</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Base Salary</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Commission %</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Bonus %</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-primary/10">
              {team.map((member) => {
                const draft = compDrafts[member.id] || { base_salary: '0', commission_rate: '0', bonus_rate: '0' }
                return (
                  <tr key={member.id}>
                    <td className="px-6 py-4 text-sm text-gray-300">{member.name}</td>
                    <td className="px-6 py-4 text-right">
                      <input
                        type="number"
                        value={draft.base_salary}
                        onChange={(event) =>
                          setCompDrafts((prev) => ({
                            ...prev,
                            [member.id]: { ...draft, base_salary: event.target.value },
                          }))
                        }
                        className="px-3 py-2 w-32 text-right"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input
                        type="number"
                        value={draft.commission_rate}
                        onChange={(event) =>
                          setCompDrafts((prev) => ({
                            ...prev,
                            [member.id]: { ...draft, commission_rate: event.target.value },
                          }))
                        }
                        className="px-3 py-2 w-24 text-right"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input
                        type="number"
                        value={draft.bonus_rate}
                        onChange={(event) =>
                          setCompDrafts((prev) => ({
                            ...prev,
                            [member.id]: { ...draft, bonus_rate: event.target.value },
                          }))
                        }
                        className="px-3 py-2 w-24 text-right"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="admin-btn-secondary" onClick={() => saveCompensation(member.id)}>
                        Save
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </AdminTableShell>
      </AdminCard>

      <AdminCard className="space-y-5">
        <h2 className="text-lg text-white font-semibold">Record Payment</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</label>
            <select
              value={paymentForm.employee_id}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, employee_id: event.target.value }))}
              className="px-3 py-2.5"
            >
              <option value="">Select employee</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Type</label>
            <select
              value={paymentForm.entry_type}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, entry_type: event.target.value }))}
              className="px-3 py-2.5"
            >
              <option value="salary">Salary</option>
              <option value="bonus">Bonus</option>
              <option value="commission">Commission</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Amount (LKR)</label>
            <input
              type="number"
              placeholder="E.g., 50000"
              value={paymentForm.amount}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
              className="px-3 py-2.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Method</label>
            <select
              value={paymentForm.payment_method}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, payment_method: event.target.value }))}
              className="px-3 py-2.5"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Period Start (Optional)</label>
            <input
              type="date"
              value={paymentForm.period_start}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, period_start: event.target.value }))}
              className="px-3 py-2.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Period End (Optional)</label>
            <input
              type="date"
              value={paymentForm.period_end}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, period_end: event.target.value }))}
              className="px-3 py-2.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Date Paid</label>
            <input
              type="date"
              value={paymentForm.paid_at}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, paid_at: event.target.value }))}
              className="px-3 py-2.5"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</label>
            <input
              type="text"
              placeholder="Optional notes..."
              value={paymentForm.notes}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="px-3 py-2.5 w-full"
            />
          </div>
        </div>
        <button className="admin-btn-primary" onClick={recordPayment}>
          Record Payment
        </button>

        <AdminTableShell>
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Employee</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Type</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Amount</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Paid At</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Method</th>
                {role === 'admin' && <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-primary/10">
              {payments.slice(0, 15).map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 text-sm text-gray-300">{row.employee_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 capitalize">{row.entry_type}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-300">LKR {toNumber(row.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{row.paid_at ? new Date(row.paid_at).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{row.payment_method || '-'}</td>
                  {role === 'admin' && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deletePaymentRecord(row.id)}
                        className="admin-btn-secondary text-red-300 border-red-500/30"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      </AdminCard>
    </AdminPageTransition>
  )
}
