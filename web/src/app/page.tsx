import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"
import { EmptyState } from "@/components/empty-state"
import { InnovationListItemCard } from "@/components/innovation-list-item"
import { ListSkeleton } from "@/components/list-skeleton"
import { SparkMark } from "@/components/spark-mark"
import { buttonVariants } from "@/components/ui/button"
import { listInnovations } from "@/server/queries"

const STEPS = [
  { letter: "I", title: "Identyfikacja", text: "Radar czyta strony szkół, uczelni i samorządów, a instytucje mogą zgłaszać pomysły same." },
  { letter: "S", title: "Selekcja", text: "Karta innowacji z cytatami ze źródła i ocena według sześciu jawnych kryteriów." },
  { letter: "K", title: "Kojarzenie", text: "Podobne rozwiązania w innych instytucjach i partnerzy dobrani do ścieżki rozwoju." },
  { letter: "R", title: "Rozwój", text: "Konkretna ścieżka: transfer, pilotaż, prototyp w ProtoLab, finansowanie albo komercjalizacja." },
  { letter: "A", title: "Adaptacja", text: "Każdy krok jest zapisywany, więc widać, które pomysły naprawdę trafiły gdzie indziej." },
]

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pt-16 pb-12 md:grid-cols-[1.2fr_1fr] md:items-center md:pt-24">
        <div className="space-y-6">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Radar innowacji · Podkarpacie</p>
          <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl">
            Dobre pomysły nie powinny gasnąć tam, gdzie powstały.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            ISKRA wyłapuje innowacje ze szkół, uczelni i samorządów, ocenia ich potencjał według jawnych kryteriów i łączy twórców z tymi, którzy mogą je
            przejąć, rozwinąć albo sfinansować.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/zglos" className={buttonVariants({ size: "lg", className: "h-11 px-5" })}>
              Zgłoś innowację
            </Link>
            <Link href="/innowacje" className={buttonVariants({ size: "lg", variant: "outline", className: "h-11 px-5" })}>
              Przeglądaj katalog
            </Link>
          </div>
        </div>
        <div className="relative hidden aspect-square md:block">
          <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle,var(--glow)_0%,transparent_65%)] opacity-40" />
          <div className="absolute inset-0 rounded-full border border-dashed border-primary/30" />
          <div className="absolute inset-16 rounded-full border border-dashed border-primary/25" />
          <div className="absolute inset-32 rounded-full border border-dashed border-primary/20" />
          <SparkMark className="absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2" />
          <span className="absolute top-[18%] left-[22%] size-3 rounded-full bg-primary" />
          <span className="absolute top-[30%] right-[14%] size-2.5 rounded-full bg-glow" />
          <span className="absolute bottom-[20%] left-[30%] size-2 rounded-full bg-chart-3" />
          <span className="absolute right-[26%] bottom-[14%] size-3 rounded-full bg-chart-4" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16">
        <ol className="grid gap-3 md:grid-cols-5">
          {STEPS.map((s) => (
            <li key={s.letter} className="rounded-2xl border border-border bg-card p-5">
              <span className="font-heading text-3xl font-semibold text-primary">{s.letter}</span>
              <p className="mt-2 font-heading font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-24">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-semibold">Najwyżej ocenione</h2>
          <Link href="/innowacje" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Wszystkie <ArrowRight className="size-4" />
          </Link>
        </div>
        <Suspense fallback={<ListSkeleton rows={4} />}>
          <TopInnovations />
        </Suspense>
      </section>
    </main>
  )
}

async function TopInnovations() {
  await connection()
  const items = (await listInnovations()).slice(0, 6)
  if (!items.length) {
    return (
      <EmptyState title="Baza jest jeszcze pusta" href="/zglos" cta="Zgłoś pierwszą innowację">
        Zgłoś innowację albo zaimportuj dane startowe.
      </EmptyState>
    )
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <InnovationListItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
