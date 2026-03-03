export function AdminLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="admin-card flex items-center justify-center gap-3 py-10">
      <span className="inline-block w-5 h-5 border-2 border-gold-primary/50 border-t-gold-primary rounded-full animate-spin" />
      <span className="text-gold-light">{label}</span>
    </div>
  )
}
