'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AdminBadge,
  AdminCard,
  AdminLoading,
  AdminPageTransition,
  AdminShellHeader,
} from '@/components/admin/ui'

interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  read: boolean
  created_at: string
}

export default function MessageDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const messageId = params.id as string

  const [message, setMessage] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMessage()
  }, [messageId])

  const fetchMessage = async () => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`)
      const data = await response.json()
      if (response.ok && data.data) {
        setMessage(data.data)
      } else {
        setError(data.error || 'Message not found')
      }
    } catch {
      setError('Failed to load message')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    await fetch(`/api/admin/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    })
    if (message) setMessage({ ...message, read: true })
  }

  const markAsUnread = async () => {
    await fetch(`/api/admin/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: false }),
    })
    if (message) setMessage({ ...message, read: false })
  }

  const deleteMessage = async () => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return
    const response = await fetch(`/api/admin/messages/${messageId}`, { method: 'DELETE' })
    if (response.ok) {
      router.push('/admin/messages')
    } else {
      setError('Failed to delete message')
    }
  }

  if (loading) return <AdminLoading label="Loading message..." />
  if (!message) return <div className="text-red-400">{error || 'Message not found'}</div>

  return (
    <AdminPageTransition className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/admin/messages" className="admin-btn-secondary">Back to Messages</Link>
        <AdminBadge variant={message.read ? 'read' : 'unread'}>
          {message.read ? 'Read' : 'Unread'}
        </AdminBadge>
      </div>

      <AdminShellHeader
        title="Message Details"
        subtitle={`Received ${new Date(message.created_at).toLocaleString()}`}
      />

      {error && <div className="admin-card text-red-300">{error}</div>}

      <div className="grid grid-cols-1 gap-5">
        <AdminCard>
          <h2 className="text-lg font-medium text-white mb-4">Sender Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
            <p><span className="text-gray-500">Name:</span> {message.name}</p>
            <p><span className="text-gray-500">Email:</span> <a href={`mailto:${message.email}`} className="text-gold-primary">{message.email}</a></p>
            {message.phone && <p><span className="text-gray-500">Phone:</span> <a href={`tel:${message.phone}`} className="text-gold-primary">{message.phone}</a></p>}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-medium text-white mb-4">Message</h2>
          <div className="rounded-xl bg-black-primary/40 border border-gold-primary/10 p-4">
            <p className="text-gray-300 whitespace-pre-wrap">{message.message}</p>
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <h2 className="text-lg font-medium text-white mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href={`mailto:${message.email}`} className="admin-btn-primary">Reply via Email</a>
          {message.phone && <a href={`tel:${message.phone}`} className="admin-btn-secondary">Call Sender</a>}
          {message.read ? (
            <button onClick={markAsUnread} className="admin-btn-secondary">Mark as Unread</button>
          ) : (
            <button onClick={markAsRead} className="admin-btn-secondary">Mark as Read</button>
          )}
          <button onClick={deleteMessage} className="admin-btn-secondary text-red-300 border-red-500/30">
            Delete Message
          </button>
        </div>
      </AdminCard>
    </AdminPageTransition>
  )
}
