import { cn } from '@/lib/utils'

interface AdminCardProps {
  children: React.ReactNode
  className?: string
}

export function AdminCard({ children, className }: AdminCardProps) {
  return <section className={cn('admin-card', className)}>{children}</section>
}
