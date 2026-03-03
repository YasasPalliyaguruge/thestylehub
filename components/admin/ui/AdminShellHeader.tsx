import { cn } from '@/lib/utils'

interface AdminShellHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function AdminShellHeader({ title, subtitle, actions, className }: AdminShellHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div>
        <h1 className="font-display text-3xl text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {actions ? <div className="flex items-center gap-3 flex-wrap">{actions}</div> : null}
    </header>
  )
}
