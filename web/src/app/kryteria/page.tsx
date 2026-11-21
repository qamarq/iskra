import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { CRITERIA_INFO } from "@/lib/criteria"
import { AUTO_PROMOTE_THRESHOLD, DETECTION_THRESHOLD, DUPLICATE_THRESHOLD, SIMILAR_THRESHOLD } from "@/lib/domain"
import { RECOMMENDATION_LABEL } from "@/lib/labels"

export const metadata: Metadata = { title: "Metodologia · ISKRA" }

const RULES = [
  { r: "weryfikacja", rule: "Wiarygodność poniżej 40/100: zanim ktoś oprze na tym decyzję, trzeba potwierdzić informacje." },
  { r: "licencja", rule: "Rozwiązanie ma patent lub zgłoszenie (polskie IP) i jest co najmniej na etapie prototypu." },
  { r: "wdrozenie", rule: "Stosowane w praktyce, potencjał zastosowania co najmniej 3/5." },
  { r: "pilotaz", rule: "Etap testów albo wdrożenia pilotażowego." },
  { r: "rozwoj", rule: "Etap koncepcji albo prototypu." },
] as const

const CREDIBILITY = [
  { label: "Fakty potwierdzone cytatem", weight: 40, text: "Udział kluczowych informacji (problem, rozwiązanie, status wdrożenia, efekty, nowość, IP, TRL), których cytat program odnalazł w tekście źródła." },
  { label: "Rodzaj źródła", weight: 25, text: "Bazy patentowe i projektowe (UPRP, EPO, CORDIS, NCBR) > publikacje (OpenAlex) > oficjalne strony instytucji > pojedyncze linki." },
  { label: "Dokumentacja i potwierdzenia", weight: 20, text: "Patent, publikacja, projekt finansowany, raport, dane z wdrożenia (pełna waga), nagroda i media (połowa wagi)." },
  { label: "Niezależne źródła", weight: 15, text: "Każde kolejne źródło opisujące to samo rozwiązanie podnosi wiarygodność (do trzech)." },
]

export default function MethodologyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <PageHeader eyebrow="Metodologia" title="Jak ISKRA znajduje i ocenia innowacje">
        Wszystkie definicje, progi i reguły są jawne. Model językowy czyta teksty, ale fakty muszą mieć cytat odnaleziony w źródle, wiarygodność liczy program,
        a rekomendację wybierają reguły.
      </PageHeader>

      <Block title="1. Co jest innowacją">
        <p>
          Punkt odniesienia to podręcznik OECD/Eurostat <b>Oslo Manual 2018</b>: innowacja to nowe lub ulepszone rozwiązanie, które znacząco różni się od
          dotychczasowych i zostało udostępnione użytkownikom lub wdrożone w praktyce. Radar obejmuje trzy obszary: <b>technologiczny</b>, <b>edukacyjny</b> i{" "}
          <b>administracyjny</b>, oraz rozpoznaje charakter rozwiązania (produkt, usługa, proces, metoda, organizacja).
        </p>
      </Block>

      <Block title="2. Wyszukiwanie i aktualizacja">
        <p>
          Crawler cyklicznie czyta strony aktualności uczelni, samorządów i szkół (z poszanowaniem robots.txt), a publikacje naukowe pobiera z otwartego API
          OpenAlex. Model ocenia, czy tekst opisuje innowację: od {Math.round(AUTO_PROMOTE_THRESHOLD * 100)}% pewności karta powstaje automatycznie, od{" "}
          {Math.round(DETECTION_THRESHOLD * 100)}% tekst trafia do kolejki radaru, gdzie decyduje analityk. Co tydzień radar sprawdza, czy źródła znanych
          innowacji się zmieniły, i odświeża ocenę.
        </p>
      </Block>

      <Block title="3. Fakty i szacunki">
        <p>
          Każda informacja w karcie ma jeden z trzech statusów: <b>potwierdzone</b> (program odnalazł cytat w tekście źródła), <b>szacunek</b> (wniosek modelu
          bez potwierdzenia w tekście) albo <b>brak danych</b>. Pole „Gdzie można zastosować” jest zawsze szacunkiem.
        </p>
      </Block>

      <Block title="4. Potencjał (0–100)">
        <p>Średnia ważona czterech kryteriów w skali 1–5. Dla rozwiązań nietechnologicznych TRL nie jest liczony, a wagi pozostałych kryteriów rosną proporcjonalnie.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          {CRITERIA_INFO.map((c) => (
            <div key={c.id} className="grid gap-3 border-b border-border p-5 last:border-b-0 md:grid-cols-[210px_1fr]">
              <div>
                <p className="font-heading font-semibold">{c.label}</p>
                <p className="text-sm text-primary">
                  waga {Math.round(c.weight * 100)}% · {c.method === "karta" ? "z karty" : "ocena modelu"}
                </p>
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
      </Block>

      <Block title="5. Wiarygodność (0–100)">
        <p>Liczona przez program, bez udziału modelu:</p>
        <ul className="mt-3 space-y-2">
          {CREDIBILITY.map((c) => (
            <li key={c.label} className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">
                {c.label} <span className="text-primary">· {c.weight}%</span>
              </p>
              <p className="text-muted-foreground">{c.text}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="6. Podobne rozwiązania i duplikaty">
        <p>
          Opis problemu i rozwiązania zamieniamy na wektor znaczeniowy. Od {Math.round(SIMILAR_THRESHOLD * 100)}% podobieństwa pokazujemy rozwiązanie jako
          podobne; od {Math.round(DUPLICATE_THRESHOLD * 100)}% nowe źródło dołączamy do istniejącej karty zamiast tworzyć duplikat.
        </p>
      </Block>

      <Block title="7. Rekomendacja">
        <p>Reguły sprawdzane po kolei; pierwsza spełniona to rekomendacja główna.</p>
        <ul className="mt-3 space-y-2">
          {RULES.map((r) => (
            <li key={r.r} className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">{RECOMMENDATION_LABEL[r.r]}</p>
              <p className="text-muted-foreground">{r.rule}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Ograniczenia">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Radar widzi tylko to, co zostało opublikowane; ocena jest tak dobra, jak źródło.</li>
          <li>Model może się pomylić: dlatego fakty wymagają cytatu, a analityk może poprawić ocenę.</li>
          <li>Bazy patentowe (UPRP, EPO) i projektowe (NCBR, CORDIS) są w planie jako kolejne źródła.</li>
        </ul>
      </Block>
    </main>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 space-y-3 first-of-type:mt-0">
      <h2 className="font-heading text-2xl font-semibold">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </section>
  )
}
