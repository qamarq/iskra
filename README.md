# ISKRA: radar innowacji

**I**dentyfikacja · **S**elekcja · **K**ojarzenie · **R**ozwój · **A**daptacja

ISKRA wyłapuje innowacje powstające w szkołach, uczelniach, samorządach i innych instytucjach publicznych, ocenia ich potencjał według jawnych kryteriów i łączy twórców z tymi, którzy mogą je przejąć, rozwinąć albo sfinansować.

Zadanie: Podkarpackie Centrum Innowacji, „Radar innowacji”, HackNation 2026.

---

## 1. Jak to działa

```
źródła ─► wykrycie ─► karta innowacji ─► podobne rozwiązania ─► ocena ─► ścieżka ─► partnerzy ─► mierniki
```

1. **Wykrycie.** Dwie drogi: zgłoszenie (opis albo link) i crawler stron instytucji. Model ocenia, czy tekst opisuje konkretne rozwiązanie. Kandydaci z crawlera trafiają do kolejki „Do weryfikacji”, gdzie decyduje opiekun.
2. **Karta innowacji.** Problem, rozwiązanie, odbiorcy, dojrzałość (etap i TRL), efekty, koszty, twórcy, słowa kluczowe. Każde pole ma dosłowny cytat ze źródła; czego źródło nie mówi, jest oznaczone jako „brak danych”.
3. **Podobne rozwiązania.** Wektor znaczeniowy opisu (pgvector) porównany z bazą: od 75% podobieństwa to podobne rozwiązanie w innej instytucji, od 88% prawdopodobny duplikat.
4. **Ocena.** Sześć jawnych kryteriów 0–5 z wagami (waga problemu 20%, nowość 15%, dojrzałość 15%, potwierdzone efekty 15%, przenaszalność 20%, koszt wdrożenia 15%). Każda ocena ma uzasadnienie, cytat i pewność. Opiekun może ją poprawić; wynik i ścieżka przeliczają się od razu.
5. **Ścieżka rozwoju.** Silnik reguł (nie model) wybiera ścieżkę: transfer, komercjalizacja, prototypowanie (PCI ProtoLab), finansowanie, pilotaż albo uzupełnienie informacji, z powodami i następnymi krokami.
6. **Partnerzy.** Dopasowanie = 55% podobieństwa profilu + 25% zgodności typu partnera ze ścieżką + 15% wspólnych tematów + 5% regionu. Do każdego partnera jest uzasadnienie i szkic wiadomości.
7. **Mierniki.** Każda zmiana etapu jest zdarzeniem z datą: lejek, czas do rekomendacji, liczba duplikatów, kontakty z partnerami, podział na typy i źródła.

Pełna metodologia jest w aplikacji pod `/kryteria`, szczegóły techniczne w [docs/architektura.md](docs/architektura.md).

## 2. Uruchomienie

### Wymagania
- Node.js 22+ i pnpm 11
- Docker (baza PostgreSQL 17 z pgvector)
- Klucz do API zgodnego z OpenAI (OpenAI, OpenRouter albo lokalny vLLM/Ollama)

### Lokalnie
```bash
docker compose up -d              # baza na porcie 5433
cd web
cp .env.example .env.local        # uzupełnij klucz i modele
pnpm install
pnpm db:migrate
pnpm db:seed seed/seed.json       # dane startowe (opcjonalnie)
pnpm dev                          # http://localhost:3000
```

### Zmienne środowiskowe
| Zmienna | Opis |
|---|---|
| `DATABASE_URL` | PostgreSQL z rozszerzeniem pgvector |
| `OPENAI_API_KEY` | Klucz API |
| `OPENAI_BASE_URL` | Adres API zgodnego z OpenAI, np. `https://openrouter.ai/api/v1` albo lokalny serwer; puste = OpenAI |
| `OPENAI_MODEL` | Model do karty, oceny i dopasowania |
| `OPENAI_DETECT_MODEL` | Tańszy model do wykrywania na dużej liczbie stron |
| `OPENAI_EMBEDDING_MODEL` | Model embeddingów (1536 wymiarów) |

### Crawler
```bash
pnpm crawl --limit=15             # przechodzi po źródłach z tabeli iskra_source
```
Źródła (strony aktualności instytucji) dodaje się w pliku danych startowych w sekcji `sources`. Crawler respektuje opóźnienie między zapytaniami i zapisuje tylko wyciągnięty tekst, adres i datę pobrania.

### Produkcyjnie
```bash
docker build -t iskra-web ./web
docker run -p 3000:3000 --env-file web/.env.local iskra-web
```

## 3. Architektura

```
przeglądarka ──► Next.js 16 (App Router, React 19)
                 ├─ strony: / · /zglos · /innowacje · /innowacje/[slug] · /weryfikacja · /partnerzy · /mierniki · /kryteria
                 ├─ API: POST /api/submissions, akcje serwerowe (weryfikacja, korekta ocen, statusy, partnerzy)
                 └─ web/src/server
                     ├─ ai/        klient API zgodnego z OpenAI (structured outputs, embeddingi)
                     ├─ pipeline/  wykrycie, karta, podobne, ocena, ścieżka, dopasowanie, statusy
                     ├─ sources/   pobieranie stron, crawler
                     └─ db/        Drizzle ORM ──► PostgreSQL + pgvector
```

## 4. Dane i założenia

- **Źródła:** zgłoszenia, strony aktualności instytucji publicznych, dane startowe z publicznie dostępnych stron (każda pozycja z adresem źródła).
- **Model językowy** czyta teksty i proponuje oceny, ale każdą ocenę uzasadnia cytatem; ścieżkę wybierają jawne reguły.
- **Dane osobowe:** zapisujemy tylko to, co instytucja sama opublikowała, oraz rolę twórców. Dane kontaktowe nie są wysyłane do modelu.
- **Model lokalny:** dzięki `OPENAI_BASE_URL` całość może działać na modelu uruchomionym w infrastrukturze instytucji, bez wysyłania danych na zewnątrz.

## 5. Ograniczenia

- Jakość oceny zależy od źródła: krótkie ogłoszenia dają niską pewność, co aplikacja pokazuje wprost.
- Podobne rozwiązania szukamy w bazie ISKRA; porównanie z bazami patentowymi (UPRP, EPO) i publikacjami (PBN) jest przygotowane w schemacie, ale jeszcze nie podłączone.
- Crawler obsługuje strony HTML; PDF-y są pomijane.

## 6. Licencja

[EUPL-1.2](LICENSE)
