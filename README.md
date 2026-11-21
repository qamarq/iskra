# ISKRA: radar polskich innowacji

**I**dentyfikacja · **S**elekcja · **K**ojarzenie · **R**ozwój · **A**daptacja

ISKRA odnajduje istniejące innowacje technologiczne, edukacyjne i administracyjne powstające w polskich uczelniach, szkołach i samorządach, sprawdza ich rzeczywisty poziom rozwoju i wiarygodność oraz pokazuje, gdzie mogą znaleźć zastosowanie. Jedno miejsce, w którym można wyszukać rozwiązanie po potrzebie, porównać kandydatów i od razu zobaczyć, co jest potwierdzone w źródłach, a co jest szacunkiem.

Zadanie: Podkarpackie Centrum Innowacji, „Radar innowacji”, HackNation 2026 (z doprecyzowaniem z [FAQ](docs/Radar%20Innowacji%20FAQ.pdf)).

ISKRA nie jest platformą zgłoszeń, portalem społecznościowym ani narzędziem do pozyskiwania finansowania: służy do odkrywania i oceny rozwiązań, które już istnieją.

---

## 1. Jak to działa

```
źródła ─► wykrycie (Oslo Manual) ─► karta z cytatami ─► podobne + publikacje ─► potencjał + wiarygodność ─► rekomendacja ─► gdzie zastosować
   ▲                                                                                                                              │
   └────────────────────────── cykliczne odświeżanie (nowe artykuły, zmiany w źródłach znanych innowacji) ◄──────────────────────┘
```

1. **Wyszukiwanie w źródłach.** Crawler cyklicznie czyta strony aktualności uczelni, samorządów i szkół (z poszanowaniem robots.txt, z wzorcem adresu artykułu dla każdego źródła). Publikacje naukowe do porównań pobiera z otwartego API OpenAlex. Użytkownik może też wskazać konkretny link do analizy.
2. **Wykrycie.** Model sprawdza tekst względem definicji innowacji z Oslo Manual 2018. Od 75% pewności karta powstaje automatycznie, od 50% tekst trafia do kolejki radaru, gdzie decyduje analityk.
3. **Karta innowacji.** Obszar (technologiczny, edukacyjny, administracyjny), charakter (produkt, usługa, proces, metoda, organizacja), problem, rozwiązanie, użytkownicy, status wdrożenia, TRL, nowość, efekty, własność intelektualna, dowody. **Każdy fakt ma cytat, który program sam odnajduje w tekście źródła**: jeśli cytat się znajdzie, informacja jest „potwierdzona”, jeśli nie, jest „szacunkiem”.
4. **Podobne rozwiązania i duplikaty.** Wektor znaczeniowy opisu (pgvector): od 75% podobieństwa pokazujemy rozwiązanie jako podobne, od 90% nowe źródło dołączamy do istniejącej karty (to samo rozwiązanie opisane w kilku miejscach podnosi wiarygodność).
5. **Potencjał (0–100).** Poziom wdrożenia (25%) i TRL (15%) wprost z karty, innowacyjność (30%) i potencjał zastosowania (30%) ocenia model z uzasadnieniem; analityk może poprawić ocenę.
6. **Wiarygodność (0–100).** Liczona przez program: udział faktów potwierdzonych cytatem, rodzaj źródła, dokumentacja (patent, publikacja, projekt, raport), liczba niezależnych źródeł.
7. **Rekomendacja.** Reguły: wymaga potwierdzenia, do licencjonowania (polskie IP), gotowe do zastosowania, warte pilotażu, do dalszego rozwoju.
8. **Gdzie zastosować.** Szacunek modelu oraz przykładowi odbiorcy z bazy (samorządy, szkoły, firmy, centra transferu technologii).

Pełna metodologia: `/kryteria` w aplikacji, szczegóły techniczne: [docs/architektura.md](docs/architektura.md).

## 2. Ekrany

| Ścieżka | Co robi |
|---|---|
| `/` | Wyszukiwarka według potrzeb, wejścia dla grup odbiorców i obszarów, najwyżej ocenione |
| `/innowacje` | Wyszukiwanie semantyczne z filtrami: dla kogo, obszar, etap, rekomendacja, region |
| `/innowacje/[slug]` | Karta innowacji: fakty z cytatami, ocena, wiarygodność, rekomendacja, gdzie zastosować, podobne, publikacje, źródła, historia |
| `/porownaj` | Porównanie 2–4 kart obok siebie |
| `/analizuj` | Analiza wskazanego linku |
| `/weryfikacja` | Kolejka radaru: niepewne trafienia i pobrane strony czekające na wykrywanie |
| `/mierniki` | Statystyki: zawartość bazy, praca crawlera, źródła, anonimowe wyszukiwania i odsłony |
| `/kryteria` | Metodologia |

## 3. Uruchomienie

### Wymagania
- Node.js 22+ i pnpm 11
- Docker (PostgreSQL 17 z pgvector)
- Klucz do API zgodnego z OpenAI (OpenAI, OpenRouter albo lokalny vLLM/Ollama)

### Lokalnie
```bash
docker compose up -d                       # baza na porcie 5433
cd web
cp .env.example .env.local                 # klucz i modele
pnpm install
pnpm db:migrate
pnpm db:seed seed/seed.json                # dane startowe: innowacje, odbiorcy, źródła (Podkarpacie)
pnpm db:seed seed/wroclaw.json             # dodatkowe źródła (Wrocław)
pnpm crawl --limit=15                      # przejście radaru po źródłach
pnpm dev                                   # http://localhost:3000
```

### Zmienne środowiskowe
| Zmienna | Opis |
|---|---|
| `DATABASE_URL` | PostgreSQL z rozszerzeniem pgvector |
| `OPENAI_API_KEY` | Klucz API |
| `OPENAI_BASE_URL` | Adres API zgodnego z OpenAI, np. `https://openrouter.ai/api/v1` albo lokalny serwer; puste = OpenAI |
| `OPENAI_MODEL` | Model do kart, ocen i dopasowań |
| `OPENAI_DETECT_MODEL` | Tańszy model do wykrywania na dużej liczbie stron |
| `OPENAI_EMBEDDING_MODEL` | Model embeddingów (1536 wymiarów) |
| `CRON_SECRET` | Sekret dla `POST /api/cron/radar` (cykliczne uruchamianie radaru) |

### Radar z linii poleceń
```bash
pnpm crawl --match=wrocław --limit=12      # wybrane źródła
pnpm crawl --no-screen                     # tylko pobieranie, bez modelu
pnpm crawl --screen-pending                # wykrywanie na pobranych wcześniej stronach
pnpm crawl --recheck --days=7              # odświeżenie znanych innowacji, których źródła się zmieniły
```

### Cykliczna aktualizacja
`POST /api/cron/radar` z nagłówkiem `Authorization: Bearer $CRON_SECRET` uruchamia w tle: crawl wszystkich źródeł, wykrywanie na zaległych stronach i ponowne sprawdzenie innowacji starszych niż 7 dni. W Coolify wystarczy zadanie harmonogramu z `curl` raz dziennie.

### Produkcyjnie
```bash
docker build -t iskra-web ./web
docker run -p 3000:3000 --env-file web/.env.local iskra-web
```

## 4. Architektura

```
przeglądarka ──► Next.js 16 (App Router, React 19)
                 ├─ strony: / · /innowacje · /innowacje/[slug] · /porownaj · /analizuj · /weryfikacja · /mierniki · /kryteria
                 ├─ API: POST /api/analyze · POST /api/cron/radar · akcje serwerowe (weryfikacja, korekta ocen)
                 └─ web/src/server
                     ├─ ai/        klient API zgodnego z OpenAI (structured outputs, embeddingi)
                     ├─ pipeline/  wykrycie, karta, weryfikacja cytatów, podobne, ocena, wiarygodność, rekomendacja, dopasowanie
                     ├─ sources/   pobieranie stron, robots.txt, crawler, OpenAlex, cykliczne uruchomienie
                     └─ db/        Drizzle ORM ──► PostgreSQL + pgvector
```

## 5. Dane, założenia i bezpieczeństwo

- **Źródła:** publiczne strony uczelni, samorządów i szkół; OpenAlex (publikacje, otwarte API); dane startowe z publicznych stron (każda pozycja z adresem). Zapisujemy wyciągnięty tekst, adres i datę pobrania, bez surowego HTML.
- **AI:** model czyta teksty i proponuje oceny innowacyjności i potencjału. Fakty muszą mieć cytat odnaleziony w źródle przez program; wiarygodność i rekomendację liczą jawne reguły.
- **Dane osobowe:** zapisujemy tylko to, co instytucja opublikowała, i rolę twórców. Analityka użytkowników jest anonimowa: treść zapytań, filtry, liczba wyników i odsłony kart, bez identyfikatorów, adresów IP ani ciasteczek.
- **Model lokalny:** dzięki `OPENAI_BASE_URL` całość może działać na modelu w infrastrukturze instytucji.
- **Skalowanie:** nowe źródło to wpis z adresem listy aktualności i wzorcem adresu artykułu; nowy typ źródła to adapter w `server/sources`.

## 6. Ograniczenia

- Radar widzi tylko to, co zostało opublikowane; krótkie komunikaty dają niską wiarygodność, co karta pokazuje wprost.
- Bazy patentowe (UPRP, EPO) i projektowe (NCBR, CORDIS) są przygotowane w schemacie jako rodzaje źródeł, ale jeszcze nie podłączone.
- Crawler obsługuje strony HTML; dokumenty PDF są pomijane. Strony renderowane wyłącznie przez JavaScript wymagają osobnego adaptera.

## 7. Licencja

[EUPL-1.2](LICENSE)
