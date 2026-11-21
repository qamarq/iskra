import Link from "next/link"
import type { MaturityStage } from "@/lib/card"
import { INSTITUTION_TYPE_LABEL, PATHWAY_SHORT, STAGE_LABEL, TYPE_LABEL } from "@/lib/labels"
import type { InnovationListItem } from "@/server/queries"
import { ScoreRing } from "./score-ring"
import { StatusBadge } from "./status-badge"

export function InnovationListItemCard({ item }: { item: InnovationListItem }) {
  return (
    <Link
      href={"/innowacje/" + item.slug}
      className="group flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(228,87,46,0.45)]"
    >
      <ScoreRing score={item.score} size={56} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{item.institution ?? "Nieznana instytucja"}</span>
          {item.institutionType ? <span>· {INSTITUTION_TYPE_LABEL[item.institutionType]}</span> : null}
        </div>
        <h3 className="font-heading text-base leading-snug font-semibold group-hover:text-primary">{item.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <StatusBadge status={item.status} />
          <Tag>{TYPE_LABEL[item.type]}</Tag>
          {item.stage ? <Tag>{STAGE_LABEL[item.stage as MaturityStage] ?? item.stage}</Tag> : null}
          {item.pathway ? <Tag accent>{PATHWAY_SHORT[item.pathway.primary]}</Tag> : null}
          {item.duplicateOfId ? <Tag warn>Możliwy duplikat</Tag> : null}
        </div>
      </div>
    </Link>
  )
}

function Tag({ children, accent, warn }: { children: React.ReactNode; accent?: boolean; warn?: boolean }) {
  return (
    <span
      className={
        "rounded-full border px-2 py-0.5 text-xs " +
        (warn ? "border-[#E9B949] bg-[#FFF6DF] text-[#7A5304]" : accent ? "border-primary/30 text-primary" : "border-border text-muted-foreground")
      }
    >
      {children}
    </span>
  )
}
