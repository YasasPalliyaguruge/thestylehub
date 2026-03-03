import { cn } from '@/lib/utils'

type AdminBadgeVariant =
  | 'default'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'active'
  | 'inactive'
  | 'featured'
  | 'unread'
  | 'read'
  | 'men'
  | 'women'

interface AdminBadgeProps {
  children: React.ReactNode
  variant?: AdminBadgeVariant
  className?: string
}

const variants: Record<AdminBadgeVariant, string> = {
  default: 'bg-gold-primary/10 text-gold-primary border-gold-primary/30',
  pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  confirmed: 'bg-green-500/15 text-green-300 border-green-500/30',
  completed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
  active: 'bg-green-500/15 text-green-300 border-green-500/30',
  inactive: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  featured: 'bg-gold-primary/15 text-gold-light border-gold-primary/40',
  unread: 'bg-gold-primary/15 text-gold-light border-gold-primary/40',
  read: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  men: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  women: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
}

export function AdminBadge({ children, variant = 'default', className }: AdminBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
