# Scenariusz demo (film ≤ 3 min)

Scenariusz z treści zadania: a) wykrycie, b) uporządkowanie informacji, c) ocena według kryteriów, d) odbiorcy i zastosowanie, e) uzasadnienie i mierniki. Dwa przypadki użycia, oba prawdziwe. `pnpm db:seed` pomija je celowo (`"demo": true` w `web/seed/seed.json`).

## 0. Problem (15 s)
Ktoś w gminie szuka sposobu na problem, który ktoś inny już rozwiązał, ale informacja leży w aktualnościach uczelni albo urzędu. Radar ma skrócić drogę do gotowego rozwiązania.

## 1. Wyszukiwanie po potrzebie (30 s)
Strona główna → „Szukasz jako: Instytucje publiczne i samorządy” albo wpisanie potrzeby własnymi słowami (np. „jak skrócić kolejki w urzędzie”). Wyniki z dopasowaniem, filtry obszar/etap/rekomendacja, dodanie dwóch wyników do porównania i ekran `/porownaj`.

## 2. Przypadek 1: technologia z uczelni (60 s)

**Antybakteryjna powłoka TiO₂:Ag,N na szkło ekranów dotykowych** (Uniwersytet Rzeszowski i PCI, patent 2026).

1. `/analizuj` → wklejenie adresu źródła z `seed.json` → kroki analizy.
2. Karta: technologiczna, produkt, TRL, patent; przy każdym fakcie „potwierdzone” z cytatem; to, czego źródło nie mówi, oznaczone jako szacunek albo brak danych.
3. Ocena: potencjał z czterech kryteriów, wiarygodność wyliczona z cytatów, rodzaju źródła i dowodów (patent).
4. Rekomendacja: do licencjonowania (polskie IP); gdzie zastosować: producenci ekranów, szpitale, transport publiczny; przykładowi odbiorcy z bazy.
5. Publikacje z OpenAlex jako kontekst innowacyjności.

## 3. Przypadek 2: innowacja administracyjna z samorządu (40 s)

**Rzeszowski Panel Klimatyczny** (Gmina Miasto Rzeszów).

1. `/analizuj` z linkiem do źródła.
2. Karta: administracyjna, organizacja, stosowane w praktyce, efekty (51 rekomendacji, stan realizacji).
3. Rekomendacja: gotowe do zastosowania w innych samorządach; podobne rozwiązania z bazy.

## 4. Automatyczne wykrywanie i aktualizacja (20 s)

- `/weryfikacja`: radar przeczytał strony aktualności uczelni i miast (np. Wrocław), pewne trafienia dodał sam, niepewne czekają na decyzję.
- Pary podobnych rozwiązań w danych startowych: akustyczne wykrywanie dronów (Politechnika Rzeszowska ↔ Politechnika Łódzka), „Mobilny Urzędnik” (Rzeszów ↔ Działoszyce), bramka SMS dla mieszkańców (Tyczyn ↔ Kobiór).

## 5. Mierniki (15 s)

`/mierniki`: zawartość bazy według obszaru, etapu i TRL, praca crawlera, źródła z datą ostatniego przejścia, najczęstsze wyszukiwania (zapytania bez wyników pokazują luki).
