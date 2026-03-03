import type { LucideIcon } from 'lucide-react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminEmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Sparkles,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div className={cn('admin-card text-center py-12', className)}>
      <div className="mx-auto w-12 h-12 rounded-full admin-icon-pill flex items-center justify-center">
        <Icon className="w-5 h-5 text-gold-primary" />
      </div>
      <h3 className="mt-4 text-lg text-white font-medium">{title}</h3>
      {description ? <p className="text-gray-400 mt-2 max-w-xl mx-auto">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
