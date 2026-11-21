export function SparkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="var(--accent)" />
      <path d="M16 4 L18.6 13.4 L28 16 L18.6 18.6 L16 28 L13.4 18.6 L4 16 L13.4 13.4 Z" fill="var(--primary)" />
      <circle cx="16" cy="16" r="2.6" fill="var(--glow)" />
    </svg>
  )
}
