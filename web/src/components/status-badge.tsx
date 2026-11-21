import type { InnovationStatus } from "@/lib/domain"
import { cn } from "@/lib/utils"

const LABEL: Record<InnovationStatus, string> = { nowa: "Niezweryfikowana", zweryfikowana: "Zweryfikowana", odrzucona: "Odrzucona" }
const TONE: Record<InnovationStatus, string> = {
  nowa: "bg-muted text-muted-foreground",
  zweryfikowana: "bg-[#E3F4EE] text-[#1F7A5F]",
  odrzucona: "bg-[#F6E3E4] text-[#8F1D24]",
}

export function StatusBadge({ status, className }: { status: InnovationStatus; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TONE[status], className)}>{LABEL[status]}</span>
}
