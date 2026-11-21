# ISKRA: architektura (szkic)

**I**dentyfikacja · **S**elekcja · **K**ojarzenie · **R**ozwój · **A**daptacja

Zadanie: Podkarpackie Centrum Innowacji, „Radar innowacji”, HackNation 2026.

## Problem w jednym zdaniu

Szkoły, uczelnie i samorządy tworzą wartościowe rozwiązania (technologiczne, organizacyjne, edukacyjne, społeczne, procesowe), ale wiedza o nich zostaje w miejscu powstania. Nikt ich systematycznie nie wyszukuje, nie ocenia i nie kieruje do tych, którzy mogliby je przejąć, rozwinąć albo sfinansować.

## Lejek

```
źródła ──► wykrycie ──► karta innowacji ──► podobne / stan techniki ──► ocena ──► ścieżka ──► partnerzy ──► mierniki
(zgłoszenie,   (LLM:      (LLM, każde pole   (pgvector + UPRP/EPO/PBN)   (jawne    (reguły)    (dopasowanie   (lejek
 crawler)       kandydat?)  z cytatem źródła)                              kryteria)              z uzasadnieniem) statusów)
```

Każdy krok zostawia ślad: skąd pochodzi informacja, kto lub co ją ustaliło i z jaką pewnością.

## Moduły

### 1. Źródła
Każde źródło to adapter zwracający dokumenty `{ url, tytuł, tekst, data publikacji, instytucja }`. Przechowujemy wyciągnięty tekst i hash, bez surowego HTML/PDF.

- **Zgłoszenie**: formularz, wklejony link albo plik (PDF/DOCX). Zgłaszać może twórca, instytucja albo opiekun.
- **Crawler stron instytucji**: aktualności i BIP gmin, strony uczelni i szkół z listy startowej (Podkarpacie), z poszanowaniem robots.txt i limitem zapytań.
- **Bazy projektów**: wyszukiwarka sukcesów beneficjentów NCBR, lista projektów Interreg.
- **Stan techniki (do porównań, nie do wykrywania)**: UPRP, EPO, PBN, PPM.

### 2. Wykrywanie
LLM klasyfikuje dokument: czy opisuje konkretne rozwiązanie wdrożone lub testowane w instytucji (a nie np. ogłoszenie o przetargu). Wynik: pewność 0–1 i krótkie uzasadnienie. Kandydaci powyżej progu trafiają do kolejki „Do weryfikacji”, gdzie opiekun zatwierdza albo odrzuca.

### 3. Karta innowacji
Ustrukturyzowany opis (structured output z walidacją schematu):
- tytuł, instytucja, typ instytucji, lokalizacja,
- problem, rozwiązanie, odbiorcy, typ innowacji (technologiczna, organizacyjna, edukacyjna, społeczna, procesowa),
- dojrzałość (TRL dla technologii; dla pozostałych: pomysł → pilotaż → działa → efekty zmierzone),
- efekty i liczby, koszty i zasoby, twórcy (rola, bez danych kontaktowych z crawlera),
- słowa kluczowe, dziedzina.

Każde pole ma cytat ze źródła. Pole bez dowodu jest oznaczone „brak danych” i obniża pewność oceny, a nie samą ocenę.

### 4. Podobne rozwiązania i stan techniki
- Embedding opisu problemu i rozwiązania, wyszukiwanie najbliższych sąsiadów w pgvector.
- Podobieństwo ≥ 0,88: prawdopodobny duplikat (propozycja scalenia). 0,75–0,88: podobne rozwiązanie w innej instytucji, czyli potencjalny partner albo ryzyko dublowania prac.
- Dla innowacji technologicznych: zapytanie do UPRP/EPO/PBN po słowach kluczowych z karty i lista najbliższych patentów i publikacji.

### 5. Ocena (jawne kryteria)
Każde kryterium 0–5, z uzasadnieniem, dowodem i pewnością. Wagi konfigurowalne (domyślne poniżej), metodologia opublikowana na stronie `/kryteria`.

| Kryterium | Pytanie | Waga |
|---|---|---|
| Waga problemu | Jak dotkliwy i jak częsty jest problem? | 20% |
| Nowość | Czy istnieje już podobne rozwiązanie (baza ISKRA, patenty, publikacje)? | 15% |
| Dojrzałość | Na jakim etapie jest rozwiązanie (TRL / etap wdrożenia)? | 15% |
| Potwierdzone efekty | Czy są liczby i dowody działania? | 15% |
| Przenaszalność | Ile innych instytucji ma ten problem i czy rozwiązanie zadziała poza miejscem powstania? | 20% |
| Koszt wdrożenia | Ile kosztuje i czego wymaga przeniesienie? | 15% |

LLM proponuje ocenę, opiekun ją zatwierdza albo zmienia (zmiany zapisywane z autorem i powodem). Wynik: 0–100 i pewność (wysoka, średnia, niska) liczona z kompletności dowodów.

### 6. Ścieżka rozwoju
Silnik regułowy na podstawie karty i ocen, więc rekomendacja jest powtarzalna i wytłumaczalna. LLM pisze tylko konkretne następne kroki.

- **Transfer / replikacja**: nietechniczna, wysoka przenaszalność → instytucje z podobnym problemem.
- **Komercjalizacja**: technologiczna, nowość ≥ 4, TRL ≥ 4 → licencja lub spin-off, centrum transferu technologii uczelni, ochrona patentowa.
- **Prototypowanie / akceleracja**: TRL 2–4 → PCI ProtoLab, program akceleracyjny (twórcy 16–30 lat).
- **Finansowanie**: dopasowanie do programów (FEPK, NCBR, Interreg, granty).
- **Pilotaż u partnera**: dojrzałość „działa”, brak zmierzonych efektów.
- **Uzupełnienie danych**: niska pewność → lista pytań do twórcy.

### 7. Dopasowanie partnerów
Baza partnerów: samorządy, szkoły, uczelnie, firmy, inwestorzy, programy finansowania, centra transferu technologii. Każdy ma profil tekstowy, embedding i tagi (sektor, region, typ ścieżki). Wynik dopasowania = podobieństwo profilu + reguły (region, ścieżka, typ partnera), z uzasadnieniem w jednym zdaniu i szkicem wiadomości do partnera.

### 8. Mierniki
Statusy: wykryta → zweryfikowana → oceniona → rekomendowana → w kontakcie → pilotaż → wdrożona (albo odrzucona). Każda zmiana to zdarzenie z datą, więc panel pokazuje:
- liczbę wykrytych innowacji według źródła, instytucji i typu,
- konwersję między etapami i czas przejścia,
- liczbę połączeń z partnerami i transferów,
- liczbę wykrytych duplikatów (prace, których udało się nie powtarzać).

## Role
- **Zgłaszający / twórca**: zgłasza i uzupełnia kartę, widzi ocenę i ścieżkę.
- **Opiekun** (PCI, koordynator innowacji w JST lub uczelni): weryfikuje, ocenia, łączy z partnerami.
- **Partner**: przegląda katalog innowacji i zgłasza zainteresowanie.

## Technologia
- **Next.js 16** (App Router, React 19), Tailwind v4, shadcn/ui na base-ui: jedna aplikacja, frontend i API.
- **PostgreSQL 17 + pgvector**, Drizzle ORM.
- **OpenAI API** (structured outputs, embeddingi). Model, model embeddingów i `OPENAI_BASE_URL` są w zmiennych środowiskowych, więc można przejść na model lokalny z API zgodnym z OpenAI (vLLM, Ollama) bez zmian w kodzie.
- **Docker**, wdrożenie przez Coolify.

## Bezpieczeństwo i dane osobowe
- Z crawlera zapisujemy tylko informacje publicznie opublikowane przez instytucję i link do źródła.
- Dane kontaktowe twórców tylko ze zgłoszenia i za zgodą; nie są wysyłane do modelu.
- Każda instytucja widzi swoje zgłoszenia przed publikacją; publiczny katalog zawiera tylko zatwierdzone karty.
- Licencja projektu: EUPL-1.2 (wymóg regulaminu).

## Skalowanie i integracje
- Wiele organizacji i regionów: lista źródeł i partnerów konfigurowana per region.
- REST API i eksport (CSV, JSON) kart i ocen; nowe źródło to nowy adapter.

## Kolejność prac (MVP)
1. Schemat bazy i dane startowe: dwa przypadki demo (technologiczny z uczelni, organizacyjny z gminy lub szkoły), ~30 innowacji, ~40 partnerów.
2. Zgłoszenie → karta innowacji (OpenAI).
3. Podobne, ocena, ścieżka, dopasowanie partnerów.
4. Widok karty innowacji i katalog.
5. Crawler 2–3 źródeł i kolejka „Do weryfikacji”.
6. Panel mierników, strona kryteriów.
7. Wdrożenie, film (≤ 3 min), prezentacja (≤ 10 slajdów).

## Otwarte pytania
- [ ] Które źródła da się realnie pobierać (robots.txt, API, limity): NCBR, Interreg, PBN, UPRP, EPO.
- [ ] Lista startowa instytucji z Podkarpacia (gminy, uczelnie, szkoły) do crawlera.
- [ ] Skąd prawdziwe przypadki do demo i bazy partnerów.
