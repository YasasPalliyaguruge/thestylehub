import { cn } from '@/lib/utils'

interface AdminFormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function AdminFormSection({
  title,
  description,
  children,
  className,
}: AdminFormSectionProps) {
  return (
    <section className={cn('admin-card space-y-5', className)}>
      {(title || description) && (
        <header>
          {title ? <h2 className="text-lg text-white font-medium">{title}</h2> : null}
          {description ? <p className="text-sm text-gray-400 mt-1">{description}</p> : null}
        </header>
      )}
      {children}
    </section>
  )
}
