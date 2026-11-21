import type { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"
import { EmptyState } from "@/components/empty-state"
import { InnovationListItemCard } from "@/components/innovation-list-item"
import { RadarSearch } from "@/components/iskierka/radar-search"
import { Iskierka } from "@/components/iskierka/iskierka"
import { SearchBox } from "@/components/search-box"
import { IMPLEMENTATION_LEVELS, INNOVATION_AREAS, TARGET_GROUPS, type ImplementationLevel, type InnovationArea, type TargetGroup } from "@/lib/card"
import { RECOMMENDATIONS, type Recommendation } from "@/lib/domain"
import { AREA_LABEL, RECOMMENDATION_SHORT, REGION_LABEL, STAGE_LABEL, TARGET_GROUP_SHORT } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { searchInnovations } from "@/server/queries"

export const metadata: Metadata = { title: "Szukaj innowacji · ISKRA" }

type Params = { q?: string; obszar?: string; etap?: string; dla?: string; rek?: string; region?: string }

export default function SearchPage({ searchParams }: PageProps<"/innowacje">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <Suspense fallback={<RadarSearch className="py-16" />}>{searchParams.then((sp) => <Results params={sp as Params} />)}</Suspense>
    </main>
  )
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

function pick<T extends string>(list: readonly T[], v: string | undefined): T | undefined {
  return v && (list as readonly string[]).includes(v) ? (v as T) : undefined
}

async function Results({ params }: { params: Params }) {
  await connection()
  const q = one(params.q)?.trim() || undefined
  const area = pick<InnovationArea>(INNOVATION_AREAS, one(params.obszar))
  const level = pick<ImplementationLevel>(IMPLEMENTATION_LEVELS, one(params.etap))
  const group = pick<TargetGroup>(TARGET_GROUPS, one(params.dla))
  const recommendation = pick<Recommendation>(RECOMMENDATIONS, one(params.rek))
  const region = one(params.region) || undefined
  const { rows, mode } = await searchInnovations({ q, area, level, group, recommendation, region }, { log: true })

  const current: Params = { q, obszar: area, etap: level, dla: group, rek: recommendation, region }
  const href = (next: Partial<Params>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...current, ...next })) if (v) p.set(k, v)
    const s = p.toString()
    return s ? "/innowacje?" + s : "/innowacje"
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Szukaj istniejących rozwiązań</h1>
        <p className="text-muted-foreground">Opisz problem własnymi słowami. Radar szuka po znaczeniu, nie tylko po słowach kluczowych.</p>
      </div>
      <SearchBox defaultValue={q} hidden={{ obszar: area, etap: level, dla: group, rek: recommendation, region }} />
      <div data-guide="filters" className="space-y-2 rounded-2xl">
        <Row label="Dla kogo">
          <Chip href={href({ dla: undefined })} active={!group}>
            Wszyscy
          </Chip>
          {TARGET_GROUPS.map((g) => (
            <Chip key={g} href={href({ dla: g })} active={group === g}>
              {TARGET_GROUP_SHORT[g]}
            </Chip>
          ))}
        </Row>
        <Row label="Obszar">
          <Chip href={href({ obszar: undefined })} active={!area}>
            Wszystkie
          </Chip>
          {INNOVATION_AREAS.map((a) => (
            <Chip key={a} href={href({ obszar: a })} active={area === a}>
              {AREA_LABEL[a]}
            </Chip>
          ))}
        </Row>
        <Row label="Etap">
          <Chip href={href({ etap: undefined })} active={!level}>
            Każdy
          </Chip>
          {IMPLEMENTATION_LEVELS.map((l) => (
            <Chip key={l} href={href({ etap: l })} active={level === l}>
              {STAGE_LABEL[l]}
            </Chip>
          ))}
        </Row>
        <Row label="Rekomendacja">
          <Chip href={href({ rek: undefined })} active={!recommendation}>
            Każda
          </Chip>
          {RECOMMENDATIONS.map((r) => (
            <Chip key={r} href={href({ rek: r })} active={recommendation === r}>
              {RECOMMENDATION_SHORT[r]}
            </Chip>
          ))}
        </Row>
        <Row label="Region">
          <Chip href={href({ region: undefined })} active={!region}>
            Cała Polska
          </Chip>
          {Object.entries(REGION_LABEL).map(([k, label]) => (
            <Chip key={k} href={href({ region: k })} active={region === k}>
              {label}
            </Chip>
          ))}
        </Row>
      </div>
      {rows.length ? (
        <div className="flex items-center gap-3">
          <Iskierka color={q ? "mint" : "ember"} pose={q ? "ok" : "idle"} size={56} />
          <p className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2 text-sm shadow-sm">
            {q ? "Znalazłam " : "Mam "}
            <b>
              {rows.length} {rows.length === 1 ? "rozwiązanie" : rows.length < 5 ? "rozwiązania" : "rozwiązań"}
            </b>
            {q ? (mode === "semantic" ? ", ułożone według dopasowania do Twojego opisu." : " (wyszukiwanie tekstowe).") : ", ułożone według potencjału."}
          </p>
        </div>
      ) : null}
      {rows.length ? (
        <div data-guide="results" className="grid gap-3 rounded-2xl md:grid-cols-2">
          {rows.map((item, i) => (
            <InnovationListItemCard key={item.id} item={item} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nic nie znaleziono" href="/analizuj" cta="Przeanalizuj źródło">
          Zmień filtry albo opisz problem inaczej. Jeśli znasz stronę z opisem rozwiązania, radar może ją przeanalizować.
        </EmptyState>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40",
      )}
    >
      {children}
    </Link>
  )
}
