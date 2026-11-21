import type { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"
import { EmptyState } from "@/components/empty-state"
import { FactBadge } from "@/components/fact-badge"
import { PageHeader } from "@/components/page-header"
import { ScoreRing } from "@/components/score-ring"
import { Skeleton } from "@/components/ui/skeleton"
import { AREA_LABEL, CHARACTER_LABEL, RECOMMENDATION_LABEL, STAGE_LABEL, TARGET_GROUP_SHORT, credibilityLabel } from "@/lib/labels"
import { getInnovationsBySlugs } from "@/server/queries"

export const metadata: Metadata = { title: "Porównanie · ISKRA" }

export default function ComparePage({ searchParams }: PageProps<"/porownaj">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <PageHeader eyebrow="Porównanie" title="Porównaj rozwiązania">
        Zestawienie kart obok siebie: etap, gotowość, potencjał, wiarygodność i to, co jest potwierdzone w źródłach.
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>{searchParams.then((sp) => <Compare raw={sp.k} />)}</Suspense>
    </main>
  )
}

async function Compare({ raw }: { raw: string | string[] | undefined }) {
  await connection()
  const slugs = (Array.isArray(raw) ? raw[0] : (raw ?? "")).split(",").filter(Boolean).slice(0, 4)
  const items = await getInnovationsBySlugs(slugs)
  if (items.length < 2) {
    return (
      <EmptyState title="Wybierz co najmniej dwa rozwiązania" href="/innowacje" cta="Przejdź do wyszukiwarki">
        Przy każdym wyniku wyszukiwania jest przycisk „+ Porównaj”.
      </EmptyState>
    )
  }

  const rows: { label: string; render: (i: (typeof items)[number]) => React.ReactNode }[] = [
    { label: "Instytucja", render: (i) => i.institution ?? "–" },
    { label: "Obszar i charakter", render: (i) => AREA_LABEL[i.area] + " · " + CHARACTER_LABEL[i.character] },
    { label: "Problem", render: (i) => <Fact value={i.card.problem.value} status={i.card.verification.problem} /> },
    { label: "Rozwiązanie", render: (i) => <Fact value={i.card.solution.value} status={i.card.verification.solution} /> },
    { label: "Status wdrożenia", render: (i) => <Fact value={STAGE_LABEL[i.level]} status={i.card.verification.implementation} /> },
    {
      label: "TRL",
      render: (i) => (i.area !== "technologiczna" ? "nie dotyczy" : <Fact value={i.trl ? "TRL " + i.trl : null} status={i.card.verification.trl} />),
    },
    { label: "Efekty", render: (i) => <Fact value={i.card.results.value} status={i.card.verification.results} /> },
    { label: "Własność intelektualna", render: (i) => <Fact value={i.card.ip.value} status={i.card.verification.ip} /> },
    { label: "Dla kogo", render: (i) => i.card.targetGroups.map((g) => TARGET_GROUP_SHORT[g]).join(", ") || "–" },
    { label: "Rekomendacja", render: (i) => (i.recommendation ? RECOMMENDATION_LABEL[i.recommendation.primary] : "–") },
    { label: "Czego brakuje", render: (i) => i.card.missing.join("; ") || "–" },
  ]

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border align-top">
            <th className="w-44 p-4" />
            {items.map((i) => (
              <th key={i.id} className="p-4 text-left font-normal">
                <Link href={"/innowacje/" + i.slug} className="font-heading text-base leading-snug font-semibold hover:text-primary">
                  {i.title}
                </Link>
                <div className="mt-3 flex gap-4">
                  <div className="flex items-center gap-2">
                    <ScoreRing score={i.potential} size={44} />
                    <span className="text-xs text-muted-foreground">potencjał</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreRing score={i.credibility} size={44} />
                    <span className="text-xs text-muted-foreground">wiarygodność {credibilityLabel(i.credibility)}</span>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-border align-top last:border-b-0">
              <th className="p-4 text-left text-xs font-medium text-muted-foreground">{r.label}</th>
              {items.map((i) => (
                <td key={i.id} className="p-4">
                  {r.render(i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Fact({ value, status }: { value: string | null; status: "potwierdzone" | "szacunek" | "brak" }) {
  return (
    <div className="space-y-1">
      <FactBadge status={status} />
      {value ? <p>{value}</p> : null}
    </div>
  )
}
