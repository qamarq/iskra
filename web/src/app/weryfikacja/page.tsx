import { ArrowUpRight } from "lucide-react"
import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"
import { CandidateActions } from "@/components/candidate-actions"
import { EmptyState } from "@/components/empty-state"
import { ListSkeleton } from "@/components/list-skeleton"
import { PageHeader } from "@/components/page-header"
import { SOURCE_LABEL, percent } from "@/lib/labels"
import { listCandidates } from "@/server/queries"

export const metadata: Metadata = { title: "Do weryfikacji · ISKRA" }

export default function ReviewPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <PageHeader eyebrow="Radar" title="Kandydaci do weryfikacji">
        Teksty ze stron instytucji, które model uznał za opis innowacji. Opiekun potwierdza albo odrzuca; dopiero potwierdzone trafiają do katalogu i są
        oceniane.
      </PageHeader>
      <Suspense fallback={<ListSkeleton />}>
        <Candidates />
      </Suspense>
    </main>
  )
}

async function Candidates() {
  await connection()
  const candidates = await listCandidates()
  if (!candidates.length) {
    return <EmptyState title="Brak kandydatów">Radar nie znalazł nowych tekstów do sprawdzenia.</EmptyState>
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
