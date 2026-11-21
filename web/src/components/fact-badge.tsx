import type { FactStatus } from "@/lib/card"
import { FACT_STATUS_LABEL } from "@/lib/labels"
import { cn } from "@/lib/utils"

const TONE: Record<FactStatus, string> = {
  potwierdzone: "border-[#9FD8C4] bg-[#E3F4EE] text-[#1F7A5F]",
  szacunek: "border-[#F0D08A] bg-[#FFF6DF] text-[#7A5304]",
  brak: "border-border bg-muted text-muted-foreground",
}

export function FactBadge({ status, className }: { status: FactStatus; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", TONE[status], className)}>
      {FACT_STATUS_LABEL[status]}
    </span>
  )
}
