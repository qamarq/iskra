import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { CRITERIA_INFO } from "@/lib/criteria"
import { DETECTION_THRESHOLD, DUPLICATE_THRESHOLD, SIMILAR_THRESHOLD } from "@/lib/domain"
import { PATHWAY_LABEL } from "@/lib/labels"

export const metadata: Metadata = { title: "Jak oceniamy · ISKRA" }

const PATHWAY_RULES = [
  { pathway: "komercjalizacja", rule: "Innowacja technologiczna, nowość ≥ 4/5 i TRL ≥ 4 albo rozwiązanie już działające." },
  { pathway: "prototypowanie", rule: "Etap pomysłu lub prototypu albo technologia na TRL 1–4." },
  { pathway: "transfer", rule: "Rozwiązanie działa na co dzień, a przenaszalność ≥ 4/5." },
  { pathway: "pilotaz", rule: "Etap pilotażu albo wdrożenie bez zmierzonych efektów (efekty ≤ 2/5)." },
  { pathway: "finansowanie", rule: "Wysoki koszt wdrożenia (koszt ≤ 2/5) albo ważny problem (≥ 4/5) na wczesnym etapie." },
  { pathway: "uzupelnienie", rule: "Pewność oceny poniżej 45%: najpierw trzeba uzupełnić informacje." },
] as const

export default function CriteriaPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <PageHeader eyebrow="Metodologia" title="Jak ISKRA wykrywa, ocenia i rekomenduje">
        Wszystkie kryteria, progi i reguły są jawne. Model językowy pomaga czytać teksty i proponuje oceny, ale każdą ocenę uzasadnia cytatem, a opiekun może
        ją poprawić. Ścieżka rozwoju wynika z reguł, nie z „czarnej skrzynki”.
      </PageHeader>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold">1. Wykrywanie</h2>
        <p className="text-muted-foreground">
          Radar czyta teksty publikowane przez szkoły, uczelnie i samorządy oraz zgłoszenia. Model ocenia, czy tekst opisuje konkretne rozwiązanie wdrożone
          lub testowane w instytucji. Teksty z pewnością co najmniej {Math.round(DETECTION_THRESHOLD * 100)}% trafiają do kolejki „Do weryfikacji”, gdzie
          decyduje człowiek.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-2xl font-semibold">2. Karta innowacji</h2>
        <p className="text-muted-foreground">
          Z tekstu powstaje karta: problem, rozwiązanie, odbiorcy, dojrzałość, efekty, koszty i twórcy. Każde pole ma dosłowny cytat ze źródła. Jeśli źródło o
          czymś nie mówi, pole jest oznaczone jako „brak danych”, co obniża pewność oceny, ale nie samą ocenę.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-2xl font-semibold">3. Podobne rozwiązania</h2>
        <p className="text-muted-foreground">
          Opis problemu i rozwiązania zamieniamy na wektor znaczeniowy i porównujemy z bazą. Podobieństwo od {Math.round(SIMILAR_THRESHOLD * 100)}% oznacza
          podobne rozwiązanie w innej instytucji (szansa na współpracę), a od {Math.round(DUPLICATE_THRESHOLD * 100)}% prawdopodobny duplikat.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-2xl font-semibold">4. Ocena potencjału</h2>
        <p className="text-muted-foreground">
          Sześć kryteriów w skali 0–5. Wynik 0–100 to średnia ważona. Pewność łączy pewność modelu i kompletność karty (ile pól ma cytat ze źródła).
        </p>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {CRITERIA_INFO.map((c) => (
            <div key={c.id} className="grid gap-3 border-b border-border p-5 last:border-b-0 md:grid-cols-[200px_1fr]">
              <div>
                <p className="font-heading font-semibold">{c.label}</p>
                <p className="text-sm text-primary">waga {Math.round(c.weight * 100)}%</p>
              </div>
              <div className="space-y-2 text-sm">
                <p>{c.question}</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    <b className="text-foreground">1</b> · {c.levels[1]}
                  </li>
                  <li>
                    <b className="text-foreground">3</b> · {c.levels[3]}
                  </li>
                  <li>
                    <b className="text-foreground">5</b> · {c.levels[5]}
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-2xl font-semibold">5. Ścieżka rozwoju</h2>
        <p className="text-muted-foreground">Reguły sprawdzane po kolei; pierwsza spełniona to ścieżka główna, kolejne to ścieżki dodatkowe.</p>
        <ul className="space-y-2">
          {PATHWAY_RULES.map((r) => (
            <li key={r.pathway} className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">{PATHWAY_LABEL[r.pathway]}</p>
              <p className="text-muted-foreground">{r.rule}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-2xl font-semibold">6. Dopasowanie partnerów</h2>
        <p className="text-muted-foreground">
          Wynik dopasowania = 55% podobieństwa profilu partnera do innowacji + 25% zgodności typu partnera ze ścieżką (np. inwestor przy komercjalizacji,
          samorząd przy transferze) + 15% wspólnych tematów + 5% za region. Do każdego partnera model pisze jedno zdanie uzasadnienia i szkic wiadomości.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-2xl font-semibold">Ograniczenia</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
          <li>Ocena jest tak dobra, jak źródło: krótkie ogłoszenia dają niską pewność.</li>
          <li>Model może się pomylić, dlatego każda ocena ma cytat i może zostać poprawiona przez opiekuna.</li>
          <li>Wyszukiwanie podobnych obejmuje bazę ISKRA; porównanie z patentami i publikacjami jest rozwijane.</li>
        </ul>
      </section>
    </main>
  )
}
