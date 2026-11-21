import { ArrowUpRight } from "lucide-react"
import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"
import { CandidateActions } from "@/components/candidate-actions"
import { EmptyState } from "@/components/empty-state"
import { ListSkeleton } from "@/components/list-skeleton"
import { PageHeader } from "@/components/page-header"
import { SOURCE_LABEL, percent } from "@/lib/labels"
import { listCandidates, listPendingDocuments } from "@/server/queries"

export const metadata: Metadata = { title: "Kolejka radaru · ISKRA" }

export default function ReviewPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <PageHeader eyebrow="Radar" title="Kolejka radaru">
        Pewne trafienia radar dodaje sam. Tu trafiają teksty, przy których model nie jest pewny, czy opisują innowację: analityk decyduje jednym kliknięciem.
      </PageHeader>
      <Suspense fallback={<ListSkeleton />}>
        <Candidates />
        <PendingDocuments />
      </Suspense>
    </main>
  )
}

async function PendingDocuments() {
  await connection()
  const { rows, total } = await listPendingDocuments()
  if (!total) return null
  const bySource = Map.groupBy(rows, (r) => r.sourceName ?? "Bez źródła")
  return (
    <section className="mt-8">
      <h2 className="font-heading text-xl font-semibold">Pobrane, czekają na wykrywanie ({total})</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Crawler pobrał te strony, ale model jeszcze nie sprawdził, czy opisują innowacje. Po podłączeniu modelu: <code>pnpm crawl --screen-pending</code>.
      </p>
      <div className="mt-5 space-y-6">
        {[...bySource.entries()].map(([name, docs]) => (
          <div key={name}>
            <p className="text-sm font-medium">
              {name} <span className="text-muted-foreground">· {docs.length}</span>
            </p>
            <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noreferrer" className="min-w-0 truncate hover:text-primary">
                      {d.title ?? d.url}
                    </a>
                  ) : (
                    <span className="min-w-0 truncate">{d.title ?? "Bez tytułu"}</span>
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{Math.round(d.length / 1000)} tys. znaków</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

async function Candidates() {
  await connection()
  const candidates = await listCandidates()
  if (!candidates.length) {
    const { total } = await listPendingDocuments(1)
    if (total) {
      return (
        <p className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          Brak niepewnych trafień. Poniżej {total} pobranych stron czeka na wykrywanie przez model.
        </p>
      )
    }
    return <EmptyState title="Brak kandydatów">Radar nie ma niepewnych trafień do sprawdzenia.</EmptyState>
  }
  return (
    <ul className="space-y-4">
      {candidates.map((c) => (
        <li key={c.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">pewność {percent(c.detection?.score)}</span>
            <span>{c.sourceName ?? (c.sourceKind ? SOURCE_LABEL[c.sourceKind] : "Źródło nieznane")}</span>
          </div>
          <h3 className="mt-2 font-heading text-base font-semibold">{c.title ?? "Bez tytułu"}</h3>
          {c.detection?.reason ? <p className="mt-1 text-sm text-foreground/80">{c.detection.reason}</p> : null}
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.text}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {c.url ? (
              <a href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                Otwórz źródło <ArrowUpRight className="size-4" />
              </a>
            ) : (
              <span />
            )}
            <CandidateActions documentId={c.id} />
          </div>
        </li>
      ))}
    </ul>
  )
}
