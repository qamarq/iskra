export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-2 pb-8">
      {eyebrow ? <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{eyebrow}</p> : null}
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {children ? <div className="max-w-3xl text-base text-muted-foreground">{children}</div> : null}
    </div>
  )
}
