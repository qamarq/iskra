import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"
import { EmptyState } from "@/components/empty-state"
import { InnovationListItemCard } from "@/components/innovation-list-item"
import { IskierkiSearching } from "@/components/iskierka/searching"
import { SearchBox } from "@/components/search-box"
import { HeroMascot } from "@/components/iskierka/hero-mascot"
import { INNOVATION_AREAS, TARGET_GROUPS } from "@/lib/card"
import { AREA_LABEL, TARGET_GROUP_LABEL } from "@/lib/labels"
import { searchInnovations } from "@/server/queries"

const EXAMPLES = ["skrócenie kolejek w urzędzie", "nauka programowania w szkole podstawowej", "recykling plastiku w budownictwie", "wykrywanie dronów"]

const STEPS = [
  { letter: "I", title: "Identyfikacja", text: "Radar cyklicznie czyta strony uczelni, samorządów i szkół oraz bazy publikacji." },
  { letter: "S", title: "Selekcja", text: "Definicja innowacji z Oslo Manual; karta z cytatami, fakty oddzielone od szacunków." },
  { letter: "K", title: "Kojarzenie", text: "Podobne rozwiązania, publikacje i miejsca, w których można je zastosować." },
  { letter: "R", title: "Rozwój", text: "Poziom wdrożenia, TRL, innowacyjność, potencjał i wiarygodność w jednej karcie." },
  { letter: "A", title: "Adaptacja", text: "Wyszukiwanie po potrzebach i porównywanie skraca drogę do gotowego rozwiązania." },
]

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pt-14 pb-10 md:grid-cols-[1.4fr_1fr] md:items-center md:pt-20">
        <div className="space-y-6">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Radar polskich innowacji</p>
          <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight md:text-5xl">
            Zanim zaczniesz od zera, sprawdź, kto już to rozwiązał.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            ISKRA odnajduje istniejące innowacje technologiczne, edukacyjne i administracyjne w polskich uczelniach, szkołach i samorządach, sprawdza ich
            rzeczywisty poziom rozwoju i pokazuje, gdzie mogą się przydać.
          </p>
          <div data-guide="search" className="rounded-2xl">
            <SearchBox large />
          </div>
          <div data-guide="examples" className="flex flex-wrap items-center gap-2 rounded-2xl text-sm">
            <span className="text-muted-foreground">Na przykład:</span>
            {EXAMPLES.map((e) => (
              <Link key={e} href={"/innowacje?q=" + encodeURIComponent(e)} className="rounded-full border border-border bg-card px-3 py-1 hover:border-primary/50">
                {e}
              </Link>
            ))}
          </div>
        </div>
        <div className="relative hidden aspect-square md:block">
          <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle,var(--glow)_0%,transparent_65%)] opacity-40" />
          <div className="absolute inset-0 rounded-full border border-dashed border-primary/30" />
          <div className="absolute inset-16 rounded-full border border-dashed border-primary/25" />
          <div className="absolute inset-32 rounded-full border border-dashed border-primary/20" />
          <div className="absolute inset-0">
            <HeroMascot />
          </div>
          <span className="absolute top-[18%] left-[22%] size-3 rounded-full bg-primary" />
          <span className="absolute top-[30%] right-[14%] size-2.5 rounded-full bg-glow" />
          <span className="absolute bottom-[20%] left-[30%] size-2 rounded-full bg-chart-3" />
          <span className="absolute right-[26%] bottom-[14%] size-3 rounded-full bg-chart-4" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div data-guide="groups" className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Szukasz jako…</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {TARGET_GROUPS.map((g) => (
                <Link key={g} href={"/innowacje?dla=" + g} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/50 hover:text-primary">
                  {TARGET_GROUP_LABEL[g]}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Obszary</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {INNOVATION_AREAS.map((a) => (
                <Link key={a} href={"/innowacje?obszar=" + a} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/50 hover:text-primary">
                  {AREA_LABEL[a]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-guide="top" className="mx-auto w-full max-w-6xl rounded-3xl px-5 pb-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-semibold">Najwyżej ocenione</h2>
          <Link href="/innowacje" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Wszystkie <ArrowRight className="size-4" />
          </Link>
        </div>
        <Suspense fallback={<IskierkiSearching label="Iskierki wybierają najlepsze…" />}>
          <Top />
        </Suspense>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-24">
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
    </main>
  )
}

async function Top() {
  await connection()
  const { rows } = await searchInnovations({}, { limit: 6 })
  if (!rows.length) {
    return (
      <EmptyState title="Radar jeszcze nic nie znalazł" href="/weryfikacja" cta="Zobacz kolejkę radaru">
        Uruchom crawler albo zaimportuj dane startowe.
      </EmptyState>
    )
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((item, i) => (
        <InnovationListItemCard key={item.id} item={item} index={i} />
      ))}
    </div>
  )
}
