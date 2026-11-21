import type { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"
import { EmptyState } from "@/components/empty-state"
import { InnovationListItemCard } from "@/components/innovation-list-item"
import { ListSkeleton } from "@/components/list-skeleton"
import { PageHeader } from "@/components/page-header"
import { INNOVATION_TYPES, type InnovationType } from "@/lib/card"
import { PATHWAYS, type Pathway } from "@/lib/domain"
import { PATHWAY_SHORT, TYPE_LABEL } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { listInnovations } from "@/server/queries"

export const metadata: Metadata = { title: "Innowacje · ISKRA" }

type Search = { q?: string; typ?: string; sciezka?: string }

export default function InnovationsPage({ searchParams }: PageProps<"/innowacje">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <PageHeader eyebrow="Katalog" title="Innowacje z instytucji publicznych">
        Rozwiązania wykryte przez radar i zgłoszone przez instytucje, uporządkowane według potencjału.
      </PageHeader>
      <Suspense fallback={<ListSkeleton rows={6} />}>
        {searchParams.then((sp) => (
          <InnovationResults search={sp as Search} />
        ))}
      </Suspense>
    </main>
  )
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

async function InnovationResults({ search }: { search: Search }) {
  await connection()
  const q = first(search.q)?.trim() || undefined
  const type = INNOVATION_TYPES.includes(first(search.typ) as InnovationType) ? (first(search.typ) as InnovationType) : undefined
  const pathway = PATHWAYS.includes(first(search.sciezka) as Pathway) ? (first(search.sciezka) as Pathway) : undefined
  const items = await listInnovations({ q, type, pathway })

  const href = (next: Partial<Search>) => {
    const params = new URLSearchParams()
    const merged = { q, typ: type, sciezka: pathway, ...next }
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v)
    const s = params.toString()
    return s ? "/innowacje?" + s : "/innowacje"
  }

  return (
    <div className="space-y-6">
      <form action="/innowacje" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Szukaj po nazwie, opisie lub instytucji"
          className="h-10 flex-1 rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-ring"
        />
        {type ? <input type="hidden" name="typ" value={type} /> : null}
        {pathway ? <input type="hidden" name="sciezka" value={pathway} /> : null}
        <button className="h-10 rounded-xl bg-secondary px-4 text-sm font-medium text-secondary-foreground">Szukaj</button>
      </form>
      <div className="space-y-2">
        <ChipRow>
          <Chip href={href({ typ: undefined })} active={!type}>
            Wszystkie typy
          </Chip>
          {INNOVATION_TYPES.map((t) => (
            <Chip key={t} href={href({ typ: t })} active={type === t}>
              {TYPE_LABEL[t]}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow>
          <Chip href={href({ sciezka: undefined })} active={!pathway}>
            Każda ścieżka
          </Chip>
          {PATHWAYS.map((p) => (
            <Chip key={p} href={href({ sciezka: p })} active={pathway === p}>
              {PATHWAY_SHORT[p]}
            </Chip>
          ))}
        </ChipRow>
      </div>
      {items.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <InnovationListItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState title="Brak innowacji" href="/zglos" cta="Zgłoś innowację">
          Nic nie pasuje do wybranych filtrów albo baza jest jeszcze pusta.
        </EmptyState>
      )}
    </div>
  )
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>
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
