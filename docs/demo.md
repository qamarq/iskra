# Scenariusz demo (film ≤ 3 min)

Scenariusz z treści zadania: a) wprowadzenie lub wykrycie, b) uporządkowanie informacji, c) ocena według kryteriów, d) odbiorcy i ścieżka, e) uzasadnienie i mierniki. Dwa przypadki użycia, oba prawdziwe. `pnpm db:seed` pomija je celowo, żeby zgłosić je na żywo.

## Przypadek 1: technologia z uczelni (zgłoszenie z linku)

**Antybakteryjna nanokompozytowa powłoka TiO₂:Ag,N na szkło ekranów dotykowych – kolejny patent UR i PCI**
Uniwersytet Rzeszowski (wspólnie z Podkarpackim Centrum Innowacji)
Źródło: https://www.ur.edu.pl/en/university/news/another-patent-for-an-innovative-antibacterial-coating-awarded-to-the-university-of-rzeszow-and-the-podkarpackie-innovation-centre

1. `/zglos` → „Link do strony” → wklej adres źródła → „Analizuj i oceń”.
2. Karta: problem, rozwiązanie, TRL, efekty (redukcja S. aureus > 90%) z cytatami; lista braków.
3. Ocena: wysoka nowość (patent), dojrzałość prototypu; korekta jednego kryterium przez opiekuna i przeliczenie wyniku.
4. Ścieżka: komercjalizacja (licencja, partner przemysłowy) i dopasowani partnerzy: firmy, CTT, inwestorzy.
5. Szkic wiadomości do partnera → „Wysłano” → status „W kontakcie” w historii.

## Przypadek 2: innowacja organizacyjna z samorządu (zgłoszenie z opisu)

**Rzeszowski Panel Klimatyczny – 51 wiążących rekomendacji mieszkańców i monitoring ich realizacji**
Gmina Miasto Rzeszów (Urząd Miasta Rzeszowa)
Źródło: https://panel-obywatelski.erzeszow.pl/pl/13-aktualnosci/29-aktualnosci/74-raport-z-panelu.html

1. `/zglos` → „Opis” → wklej tekst z `web/seed/seed.json` (pozycja z `"demo": true`).
2. Karta: typ organizacyjny/społeczny, mierzalne efekty (51 rekomendacji, stan realizacji).
3. Ścieżka: transfer do innych samorządów; partnerzy: gminy i programy finansowania.
4. Podobne rozwiązania: inne inicjatywy klimatyczne i energetyczne samorządów z bazy.

## Wykrywanie automatyczne i dublowanie prac

- `/weryfikacja`: kandydaci z crawlera (`pnpm crawl`) ze stron aktualności uczelni i gmin, zatwierdzenie jednym kliknięciem.
- Pary podobnych rozwiązań w danych startowych: akustyczne wykrywanie dronów (Politechnika Rzeszowska ↔ Politechnika Łódzka), „Mobilny Urzędnik” (Rzeszów ↔ Działoszyce), bramka SMS dla mieszkańców (Tyczyn ↔ Kobiór).

## Mierniki

`/mierniki`: lejek od wykrycia do wdrożenia, czas do rekomendacji, wykryte duplikaty, kontakty z partnerami.
