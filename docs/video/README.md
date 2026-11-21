# Film demo ISKRA

Poziomy film 1920×1080 (~51 s) pokazujący działanie aplikacji na produkcji.

- `record.mjs`: nagrywa sceny w przeglądarce (Playwright, Chrome) z https://iskra.kamilmarczak.pl.
- `assets.mjs` + `assets.html`: karta intro, outro i napisy w stylu Iskierki.
- `music.py`: podkład muzyczny generowany syntezą w numpy (118 BPM, własna kompozycja, bez cudzych sampli, wolny od praw autorskich).
- Montaż: ffmpeg (przycięcie, przyspieszenie, napisy, przejścia xfade, wyciszenie muzyki na końcu).

Plik wynikowy `ISKRA-demo.mp4` nie jest w repozytorium (rozmiar).
