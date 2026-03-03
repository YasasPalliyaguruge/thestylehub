import { cn } from '@/lib/utils'

interface AdminTableShellProps {
  children: React.ReactNode
  className?: string
}

export function AdminTableShell({ children, className }: AdminTableShellProps) {
  return (
    <div className={cn('admin-card p-0 overflow-hidden', className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}
