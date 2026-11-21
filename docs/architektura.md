# ISKRA: architektura

Radar polskich innowacji dla zadania PCI „Radar innowacji” (HackNation 2026), zgodnie z [FAQ](Radar%20Innowacji%20FAQ.pdf): wyszukiwanie i ocena istniejących innowacji technologicznych, edukacyjnych i administracyjnych w całej Polsce.

## Przepływ

```
źródło (crawler / link / import)
  └─► document (tekst, hash, status: nowy → kandydat | odrzucony → wyodrebniony)
        └─► detect (Oslo Manual, pewność)
              ├─ ≥ 0,75: automatycznie do karty
              ├─ 0,5–0,75: kolejka radaru (decyzja analityka)
              └─ < 0,5: odrzucony
        └─► extract (structured output) ─► verify (cytaty szukane w tekście źródła: potwierdzone / szacunek / brak)
              └─► embed ─► podobne (pgvector)
                    ├─ ≥ 0,90: dokument dołączony do istniejącej innowacji (nowe źródło); ≥ 0,62: podobne rozwiązanie
                    └─ nowa innowacja
                          └─► analyze: publikacje (OpenAlex), ocena modelu (innowacyjność, potencjał),
                              kryteria z karty (poziom wdrożenia, TRL), potencjał, wiarygodność, rekomendacja,
                              gdzie zastosować (odbiorcy z bazy), zdarzenia
```

## Model danych (PostgreSQL + pgvector)

| Tabela | Zawartość |
|---|---|
| `iskra_source` | Źródło: rodzaj (www, analiza, import, docelowo cordis, ncbr, uprp…), adres listy, wzorzec adresu artykułu, ostatnie przejście |
| `iskra_document` | Pobrany tekst z hashem treści, wynik wykrywania, powiązanie z innowacją (wiele dokumentów na innowację) |
| `iskra_innovation` | Karta (JSON), obszar, charakter, poziom wdrożenia, TRL, region, potencjał, wiarygodność z rozbiciem, rekomendacja, embedding, data ostatniego sprawdzenia |
| `iskra_evaluation` | Historia ocen kryteriów (karta, model, analityk) |
| `iskra_prior_art` | Podobne innowacje z bazy i publikacje z OpenAlex |
| `iskra_partner`, `iskra_match` | Potencjalni odbiorcy i dopasowania z uzasadnieniem |
| `iskra_event` | Historia: dodana, ocena, nowe źródło, weryfikacja, korekta, aktualizacja |
| `iskra_search_log`, `iskra_view_log` | Anonimowa analityka: zapytania, filtry, liczba wyników, odsłony |

## Ocena

- **Potencjał** = średnia ważona: poziom wdrożenia 25% i TRL 15% (z karty), innowacyjność 30% i potencjał zastosowania 30% (model, korekta analityka). Bez TRL wagi skalowane proporcjonalnie.
- **Wiarygodność** = 40% faktów potwierdzonych cytatem + 25% rodzaj źródła + 20% dokumentacja i potwierdzenia + 15% liczba niezależnych źródeł. Liczona bez udziału modelu.
- **Rekomendacja** (reguły, w kolejności): wymaga potwierdzenia (wiarygodność < 40), licencja (IP i co najmniej prototyp), gotowe do zastosowania (stosowane, potencjał ≥ 3), pilotaż (testy, pilotaż), rozwój (koncepcja, prototyp).

## Cykliczność

`POST /api/cron/radar` (Bearer `CRON_SECRET`): crawl wszystkich źródeł, wykrywanie zaległych dokumentów, ponowne pobranie źródeł innowacji sprawdzonych ponad 7 dni temu; zmieniona treść daje nowy dokument i ponowną ocenę.

## Technologia

Next.js 16 (App Router, React 19, Cache Components), Tailwind v4, shadcn/ui na base-ui, Drizzle ORM, PostgreSQL 17 + pgvector, API zgodne z OpenAI (`OPENAI_BASE_URL`: OpenAI, OpenRouter, vLLM, Ollama), OpenAlex. Docker, wdrożenie przez Coolify.

## Dalszy rozwój

- Adaptery API: CORDIS (projekty UE), NCBR i PARP (projekty), UPRP i EPO (patenty) jako źródła i jako stan techniki przy ocenie innowacyjności.
- PDF i strony renderowane przez JavaScript.
- Konta analityków i uprawnienia do korekty ocen.
