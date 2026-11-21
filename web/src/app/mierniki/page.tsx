import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import type { InstitutionType } from "@/lib/card"
import { INNOVATION_STATUSES, type SourceKind } from "@/lib/domain"
import { INSTITUTION_TYPE_LABEL, SOURCE_LABEL, STATUS_LABEL, TYPE_LABEL } from "@/lib/labels"
import { funnelStats } from "@/server/queries"

export const metadata: Metadata = { title: "Mierniki · ISKRA" }

export default function MetricsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <PageHeader eyebrow="Skuteczność" title="Mierniki">
        Ile innowacji radar znajduje, jak daleko przechodzą przez lejek i ile z nich trafia do partnerów. Liczone na bieżąco z historii zmian.
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-[480px] rounded-3xl" />}>
        <Metrics />
      </Suspense>
    </main>
  )
}

async function Metrics() {
  await connection()
  const s = await funnelStats()
  const funnel = INNOVATION_STATUSES.filter((st) => st !== "odrzucona")
  const reached = (index: number) => funnel.slice(index).reduce((sum, st) => sum + (s.byStatus[st] ?? 0), 0)
  const total = reached(0)
  const contacted = (s.matchesByStatus.wyslane ?? 0) + (s.matchesByStatus.zainteresowany ?? 0) + (s.matchesByStatus.odrzucone ?? 0)

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Innowacje w bazie" value={total} />
        <Stat label="Średni potencjał" value={s.avgScore != null ? Math.round(s.avgScore) + "/100" : "–"} />
        <Stat label="Wykryte duplikaty" value={s.duplicates} hint="prace, których nie trzeba powtarzać" />
        <Stat
          label="Czas do rekomendacji"
          value={s.avgHoursToRecommendation != null ? formatHours(s.avgHoursToRecommendation) : "–"}
          hint="od wykrycia do wskazania ścieżki"
        />
      </div>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-heading text-xl font-semibold">Lejek</h2>
        <p className="mt-1 text-sm text-muted-foreground">Liczba innowacji, które dotarły co najmniej do danego etapu.</p>
        <div className="mt-5 space-y-2.5">
          {funnel.map((st, i) => {
            const n = reached(i)
            const width = total ? Math.max(2, (n / total) * 100) : 0
            return (
              <div key={st} className="grid grid-cols-[140px_1fr_60px] items-center gap-3 text-sm">
                <span className="text-muted-foreground">{STATUS_LABEL[st]}</span>
                <div className="h-7 rounded-lg bg-muted">
                  <div className="h-full rounded-lg bg-primary" style={{ width: width + "%", opacity: 1 - i * 0.09 }} />
                </div>
                <span className="text-right font-semibold tabular-nums">{n}</span>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Odrzucone: {s.byStatus.odrzucona ?? 0}</p>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <Breakdown title="Typ innowacji" rows={s.byType.map((r) => ({ label: TYPE_LABEL[r.type], n: r.n }))} />
        <Breakdown
          title="Typ instytucji"
          rows={s.byInstitutionType.map((r) => ({ label: INSTITUTION_TYPE_LABEL[r.type as InstitutionType], n: r.n }))}
        />
        <Breakdown title="Źródło" rows={s.bySource.map((r) => ({ label: SOURCE_LABEL[r.kind as SourceKind] ?? r.kind, n: r.n }))} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Dokumenty przeczytane przez radar" value={Object.values(s.documents).reduce((a, b) => a + b, 0)} />
        <Stat label="Kandydaci czekający na weryfikację" value={s.documents.kandydat ?? 0} />
        <Stat label="Kontakty z partnerami" value={contacted} hint={(s.matchesByStatus.zainteresowany ?? 0) + " partnerów zainteresowanych"} />
      </div>
    </div>
  )
}

function formatHours(hours: number) {
  if (hours < 1) return Math.max(1, Math.round(hours * 60)) + " min"
  if (hours < 48) return Math.round(hours) + " h"
  return Math.round(hours / 24) + " dni"
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {rows.length ? (
          rows
            .sort((a, b) => b.n - a.n)
            .map((r) => (
              <li key={r.label} className="text-sm">
                <div className="flex justify-between">
                  <span>{r.label}</span>
                  <span className="font-semibold tabular-nums">{r.n}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-glow" style={{ width: (r.n / max) * 100 + "%" }} />
                </div>
              </li>
            ))
        ) : (
          <li className="text-sm text-muted-foreground">Brak danych</li>
        )}
      </ul>
    </section>
  )
}
