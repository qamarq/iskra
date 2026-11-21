import Link from "next/link"
import { ViewTransition } from "react"
import { AREA_LABEL, RECOMMENDATION_SHORT, STAGE_LABEL, credibilityLabel } from "@/lib/labels"
import type { InnovationListItem } from "@/server/queries"
import { CompareToggle } from "./compare"
import { Iskierka } from "./iskierka/iskierka"
import { ScoreRing } from "./score-ring"

const PEEK = ["ember", "mint", "lilac", "glow", "sky", "pink"] as const

export function InnovationListItemCard({ item, index = 0, morph }: { item: InnovationListItem; index?: number; morph?: boolean }) {
  const card = (
    <Link
      href={"/innowacje/" + item.slug}
      style={{ animationDelay: Math.min(index, 10) * 60 + "ms" }}
      className="card-drop group relative mt-6 flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(228,87,46,0.45)]"
    >
      <span className="pointer-events-none absolute -top-[42px] right-8 h-[42px] w-[64px] overflow-hidden" aria-hidden="true">
        <span className="block translate-y-[46px] transition-transform duration-300 ease-[cubic-bezier(.3,1.6,.5,1)] group-hover:translate-y-[2px]">
          <Iskierka color={PEEK[item.id % PEEK.length]} pose="wave" size={58} />
        </span>
      </span>
      <div className="flex flex-col items-center gap-1">
        <ScoreRing score={item.potential} size={56} />
        <span className="text-[11px] text-muted-foreground">potencjał</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{item.institution ?? "Nieznana instytucja"}</span>
          {item.match != null ? <span className="font-semibold text-primary">· dopasowanie {Math.round(item.match * 100)}%</span> : null}
        </div>
        <h3 className="font-heading text-base leading-snug font-semibold group-hover:text-primary">{item.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Tag strong>{AREA_LABEL[item.area]}</Tag>
          <Tag>{STAGE_LABEL[item.level]}</Tag>
          {item.trl ? <Tag>TRL {item.trl}</Tag> : null}
          {item.recommendation ? <Tag accent>{RECOMMENDATION_SHORT[item.recommendation.primary]}</Tag> : null}
          <Tag>wiarygodność {credibilityLabel(item.credibility)}</Tag>
          <CompareToggle slug={item.slug} className="ml-auto" />
        </div>
      </div>
    </Link>
  )
  return morph ? (
    <ViewTransition name={"inno-" + item.id} share="morph" default="none">
      {card}
    </ViewTransition>
  ) : (
    card
  )
}

function Tag({ children, accent, strong }: { children: React.ReactNode; accent?: boolean; strong?: boolean }) {
  return (
    <span
      className={
        "rounded-full border px-2 py-0.5 text-xs " +
        (strong ? "border-secondary/20 bg-secondary/5 font-medium text-foreground" : accent ? "border-primary/30 text-primary" : "border-border text-muted-foreground")
      }
    >
      {children}
    </span>
  )
}
