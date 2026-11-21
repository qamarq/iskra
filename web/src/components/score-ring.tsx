import { cn } from "@/lib/utils"

export function ScoreRing({ score, size = 64, className }: { score: number | null; size?: number; className?: string }) {
  const r = 26
  const circumference = 2 * Math.PI * r
  const value = score == null ? 0 : Math.max(0, Math.min(100, score))
  const color = value >= 70 ? "var(--chart-4)" : value >= 45 ? "var(--chart-2)" : "var(--primary)"
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--muted)" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-sm font-semibold tabular-nums">
        {score == null ? "–" : Math.round(score)}
      </span>
    </div>
  )
}
