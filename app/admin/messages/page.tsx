'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AdminBadge,
  AdminEmptyState,
  AdminFilterBar,
  AdminLoading,
  AdminPageTransition,
  AdminShellHeader,
  AdminTableShell,
} from '@/components/admin/ui'
import { Mail } from 'lucide-react'

interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  read: boolean
  created_at: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/admin/messages')
      const data = await response.json()
      setMessages(data.data?.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    })
    fetchMessages()
  }

  const markAsUnread = async (id: string) => {
    await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: false }),
    })
    fetchMessages()
  }

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return
    await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
    fetchMessages()
  }

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'unread') return !msg.read
    if (filter === 'read') return msg.read
    return true
  })

  const unreadCount = messages.filter((m) => !m.read).length

  if (loading) return <AdminLoading label="Loading messages..." />

  return (
    <AdminPageTransition className="space-y-5">
      <AdminShellHeader
        title="Messages"
        subtitle={unreadCount > 0 ? `${unreadCount} unread message(s)` : 'Inbox is up to date'}
      />

      <AdminFilterBar>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'unread', 'read'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={filter === option ? 'admin-btn-primary capitalize' : 'admin-btn-secondary capitalize'}
            >
              {option}
            </button>
          ))}
        </div>
      </AdminFilterBar>

      {filteredMessages.length === 0 ? (
        <AdminEmptyState
          icon={Mail}
          title="No messages found"
          description="When clients contact you, messages will appear here."
        />
      ) : (
        <AdminTableShell>
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Sender</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Message</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-primary/10">
              {filteredMessages.map((msg) => (
                <tr key={msg.id}>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{msg.name}</p>
                    <p className="text-sm text-gray-400">{msg.email}</p>
                    <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <p className="line-clamp-2">{msg.message}</p>
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge variant={msg.read ? 'read' : 'unread'}>
                      {msg.read ? 'Read' : 'Unread'}
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {!msg.read ? (
                        <button onClick={() => markAsRead(msg.id)} className="admin-btn-secondary">
                          Mark Read
                        </button>
                      ) : (
                        <button onClick={() => markAsUnread(msg.id)} className="admin-btn-secondary">
                          Mark Unread
                        </button>
                      )}
                      <Link href={`/admin/messages/${msg.id}`} className="admin-btn-secondary">View</Link>
                      <button onClick={() => deleteMessage(msg.id)} className="admin-btn-secondary text-red-300 border-red-500/30">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      )}
    </AdminPageTransition>
  )
}
