import { format } from "date-fns"
import { pl } from "date-fns/locale"
import type { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import type { ImplementationLevel, InnovationArea } from "@/lib/card"
import type { Recommendation, SourceKind } from "@/lib/domain"
import { AREA_LABEL, RECOMMENDATION_SHORT, REGION_LABEL, SOURCE_LABEL, STAGE_LABEL } from "@/lib/labels"
import { radarStats } from "@/server/queries"

export const metadata: Metadata = { title: "Statystyki radaru · ISKRA" }

export default function StatsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <PageHeader eyebrow="Statystyki" title="Co widzi radar">
        Zawartość bazy, praca crawlera i anonimowe dane o tym, czego szukają użytkownicy (bez danych osobowych).
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-[480px] rounded-3xl" />}>
        <Stats />
      </Suspense>
    </main>
  )
}

async function Stats() {
  await connection()
  const s = await radarStats()
  const docsTotal = Object.values(s.documents).reduce((a, b) => a + b, 0)
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Innowacje w bazie" value={s.total} hint={s.recent + " nowych w ostatnim tygodniu"} />
        <Stat label="Średni potencjał" value={s.avgPotential != null ? Math.round(s.avgPotential) + "/100" : "–"} />
        <Stat label="Średnia wiarygodność" value={s.avgCredibility != null ? Math.round(s.avgCredibility) + "/100" : "–"} />
        <Stat label="Scalone duplikaty" value={s.merged} hint="te same rozwiązania z kilku źródeł" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Breakdown title="Obszar" rows={s.byArea.map((r) => ({ label: AREA_LABEL[r.key as InnovationArea] ?? r.key, n: r.n }))} />
        <Breakdown title="Poziom wdrożenia" sorted rows={s.byLevel.map((r) => ({ label: STAGE_LABEL[r.key as ImplementationLevel] ?? r.key, n: r.n }))} />
        <Breakdown title="Rekomendacja" rows={s.byRecommendation.map((r) => ({ label: RECOMMENDATION_SHORT[r.key as Recommendation] ?? r.key ?? "brak", n: r.n }))} />
        <Breakdown title="Gotowość technologii" sorted rows={s.byTrl.map((r) => ({ label: "TRL " + r.key, n: r.n }))} />
        <Breakdown title="Region" rows={s.byRegion.map((r) => ({ label: REGION_LABEL[r.key] ?? r.key, n: r.n }))} />
        <section className="rounded-3xl border border-border bg-card p-6">
          <h3 className="font-heading text-lg font-semibold">Praca crawlera</h3>
          <ul className="mt-4 space-y-1.5 text-sm">
            <li className="flex justify-between">
              <span>Przeczytane strony</span>
              <b className="tabular-nums">{docsTotal}</b>
            </li>
            <li className="flex justify-between">
              <span>Czekają na wykrywanie</span>
              <b className="tabular-nums">{s.documents.nowy ?? 0}</b>
            </li>
            <li className="flex justify-between">
              <span>Kandydaci do decyzji</span>
              <b className="tabular-nums">{s.documents.kandydat ?? 0}</b>
            </li>
            <li className="flex justify-between">
              <span>Odrzucone (nie innowacje)</span>
              <b className="tabular-nums">{s.documents.odrzucony ?? 0}</b>
            </li>
            <li className="flex justify-between">
              <span>Zamienione na karty</span>
              <b className="tabular-nums">{s.documents.wyodrebniony ?? 0}</b>
            </li>
          </ul>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6">
          <h3 className="font-heading text-lg font-semibold">Najczęstsze wyszukiwania (30 dni)</h3>
          {s.topSearches.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {s.topSearches.map((q) => (
                <li key={q.query} className="flex justify-between gap-3">
                  <Link href={"/innowacje?q=" + encodeURIComponent(q.query)} className="truncate hover:text-primary">
                    {q.query}
                  </Link>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {q.n}× · śr. {Math.round(q.avgResults)} wyników
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Brak wyszukiwań.</p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Zapytania z małą liczbą wyników wskazują luki: tematy, których radar powinien szukać.</p>
        </section>
        <section className="rounded-3xl border border-border bg-card p-6">
          <h3 className="font-heading text-lg font-semibold">Najczęściej oglądane karty (30 dni)</h3>
          {s.topViewed.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {s.topViewed.map((v) => (
                <li key={v.slug} className="flex justify-between gap-3">
                  <Link href={"/innowacje/" + v.slug} className="truncate hover:text-primary">
                    {v.title}
                  </Link>
                  <span className="shrink-0 text-muted-foreground tabular-nums">{v.n}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Brak odsłon.</p>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h3 className="font-heading text-lg font-semibold">Źródła i cykliczna aktualizacja</h3>
        <p className="mt-1 text-sm text-muted-foreground">Radar odwiedza źródła cyklicznie i co tydzień sprawdza, czy opisy znanych innowacji się zmieniły.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Źródło</th>
                <th className="py-2 pr-4 font-medium">Rodzaj</th>
                <th className="py-2 pr-4 font-medium">Dokumenty</th>
                <th className="py-2 font-medium">Ostatnio</th>
              </tr>
            </thead>
            <tbody>
              {s.sources.map((src) => (
                <tr key={src.id} className="border-t border-border">
                  <td className="py-2 pr-4">{src.url ? <a href={src.url} target="_blank" rel="noreferrer" className="hover:text-primary">{src.name}</a> : src.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{SOURCE_LABEL[src.kind as SourceKind] ?? src.kind}</td>
                  <td className="py-2 pr-4 tabular-nums">{src.documents}</td>
                  <td className="py-2 text-muted-foreground">{src.lastRunAt ? format(src.lastRunAt, "d MMM yyyy, HH:mm", { locale: pl }) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
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

function Breakdown({ title, rows, sorted }: { title: string; rows: { label: string; n: number }[]; sorted?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  const list = sorted ? rows : [...rows].sort((a, b) => b.n - a.n)
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {list.length ? (
          list.map((r) => (
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
