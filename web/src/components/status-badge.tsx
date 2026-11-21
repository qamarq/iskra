import type { InnovationStatus } from "@/lib/domain"
import { STATUS_LABEL } from "@/lib/labels"
import { cn } from "@/lib/utils"

const TONE: Record<InnovationStatus, string> = {
  wykryta: "bg-muted text-muted-foreground",
  zweryfikowana: "bg-muted text-foreground",
  oceniona: "bg-[#E8EFF8] text-[#2C5687]",
  rekomendowana: "bg-accent text-accent-foreground",
  w_kontakcie: "bg-[#FFF2D9] text-[#8A5A07]",
  pilotaz: "bg-[#E3F4EE] text-[#1F7A5F]",
  wdrozona: "bg-[#2E9E7E] text-white",
  odrzucona: "bg-[#F6E3E4] text-[#8F1D24]",
}

export function StatusBadge({ status, className }: { status: InnovationStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TONE[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  )
}
