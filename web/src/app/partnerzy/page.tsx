import { ArrowUpRight } from "lucide-react"
import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"
import { EmptyState } from "@/components/empty-state"
import { ListSkeleton } from "@/components/list-skeleton"
import { PageHeader } from "@/components/page-header"
import { PARTNER_KIND_LABEL } from "@/lib/labels"
import { listPartners } from "@/server/queries"

export const metadata: Metadata = { title: "Odbiorcy · ISKRA" }

export default function PartnersPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <PageHeader eyebrow="Odbiorcy" title="Kto może skorzystać">
        Instytucje, firmy i centra transferu technologii, które radar wskazuje jako potencjalnych użytkowników znalezionych rozwiązań.
      </PageHeader>
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <Partners />
      </Suspense>
    </main>
  )
}

async function Partners() {
  await connection()
  const partners = await listPartners()
  if (!partners.length) return <EmptyState title="Brak odbiorców">Baza jest pusta. Uruchom import danych startowych.</EmptyState>
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {partners.map((p) => (
        <article key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-primary">{PARTNER_KIND_LABEL[p.kind]}</p>
          <h3 className="mt-1 font-heading text-base leading-snug font-semibold">{p.name}</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.description}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {p.tags.map((t) => (
              <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{p.matches ? "Dopasowania: " + p.matches : "Brak dopasowań"}</span>
            {p.url ? (
              <a href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-primary hover:underline">
                Strona <ArrowUpRight className="size-3.5" />
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}
