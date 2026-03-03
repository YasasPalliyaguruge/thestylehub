import { cn } from '@/lib/utils'

interface AdminFilterBarProps {
  children: React.ReactNode
  className?: string
}

export function AdminFilterBar({ children, className }: AdminFilterBarProps) {
  return <div className={cn('admin-filter-bar', className)}>{children}</div>
}
