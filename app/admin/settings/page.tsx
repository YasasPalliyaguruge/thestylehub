'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, Save } from 'lucide-react'
import {
  AdminFormSection,
  AdminLoading,
  AdminPageTransition,
  AdminShellHeader,
} from '@/components/admin/ui'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  last_login: string | null
  created_at: string
}

export default function SettingsPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        if (!response.ok || !data?.data) {
          throw new Error(data.error || 'Failed to load account settings')
        }
        setAdmin(data.data)
      } catch (err: any) {
        setError(err.message || 'Failed to load account settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch('/api/admin/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password')
      }

      setSuccess('Password updated successfully.')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setUpdating(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/admin/login' })
  }

  if (loading) return <AdminLoading label="Loading settings..." />

  return (
    <AdminPageTransition className="space-y-5 max-w-4xl">
      <AdminShellHeader
        title="Settings"
        subtitle="Manage your admin account and security preferences."
      />

      {error ? <div className="admin-card border-red-500/40 text-red-300">{error}</div> : null}
      {success ? <div className="admin-card border-green-500/40 text-green-300">{success}</div> : null}

      <AdminFormSection title="Account Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Name</p>
            <p className="text-white mt-1">{admin?.name || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="text-white mt-1">{admin?.email || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500">Role</p>
            <p className="text-white mt-1 capitalize">{admin?.role || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500">Last Login</p>
            <p className="text-white mt-1">
              {admin?.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Password"
        description="Use a strong unique password with at least 8 characters."
      >
        {!showPasswordForm ? (
          <button type="button" onClick={() => setShowPasswordForm(true)} className="admin-btn-secondary">
            Change Password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                className="px-4 py-3"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false)
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                }}
                className="admin-btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={updating} className="admin-btn-primary disabled:opacity-60">
                <Save className="w-4 h-4" />
                {updating ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </AdminFormSection>

      <section className="admin-card border-red-500/40">
        <h2 className="text-lg text-red-300 font-medium">Session</h2>
        <p className="text-sm text-gray-400 mt-2">
          Logging out will end this admin session on this device.
        </p>
        <button onClick={handleLogout} className="admin-btn-secondary text-red-300 border-red-500/40 mt-5">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </section>
    </AdminPageTransition>
  )
}
