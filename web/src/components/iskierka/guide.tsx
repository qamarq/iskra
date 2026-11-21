"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Iskierka } from "./iskierka"

type Tip = { text: string; target?: string }

function tipsFor(pathname: string): Tip[] {
  if (pathname === "/") {
    return [
      { text: "Cześć! Jestem Iskierka. Opisz problem własnymi słowami, a znajdę rozwiązania, które już ktoś wdrożył.", target: '[data-guide="search"]' },
      { text: "Nie wiesz, od czego zacząć? Kliknij jeden z przykładów.", target: '[data-guide="examples"]' },
      { text: "Szukasz jako inwestor, samorząd albo szkoła? Wybierz swoją grupę, pokażę to, co dla Ciebie.", target: '[data-guide="groups"]' },
      { text: "Tu są rozwiązania, które oceniłam najwyżej.", target: '[data-guide="top"]' },
    ]
  }
  if (pathname === "/innowacje") {
    return [
      { text: "Wyniki układam według tego, jak pasują do Twojego opisu. Szukam po znaczeniu, nie po słowach.", target: '[data-guide="results"]' },
      { text: "Zawęź wyniki: dla kogo, obszar, etap wdrożenia albo moja rekomendacja.", target: '[data-guide="filters"]' },
      { text: "Kliknij „+ Porównaj” przy dwóch wynikach, a zestawię je obok siebie." },
    ]
  }
  if (pathname.startsWith("/innowacje/")) {
    return [
      { text: "Dwie liczby na start: potencjał rozwiązania i to, na ile można wierzyć źródłom.", target: '[data-guide="gauges"]' },
      { text: "Zielone plakietki to fakty z cytatem, który sama odnalazłam w źródle. Żółte to moje szacunki.", target: '[data-guide="facts"]' },
      { text: "Każdą ocenę uzasadniam. Jeśli się mylę, popraw mnie przyciskiem „Popraw ocenę”.", target: '[data-guide="score"]' },
      { text: "Tu podpowiadam, co dalej z tym rozwiązaniem.", target: '[data-guide="rec"]' },
      { text: "A tu, kto jeszcze mógłby z niego skorzystać.", target: '[data-guide="apply"]' },
    ]
  }
  if (pathname === "/porownaj") return [{ text: "Porównuję karty pole po polu. Zwróć uwagę, co jest potwierdzone, a co jest szacunkiem.", target: '[data-guide="compare"]' }]
  if (pathname === "/weryfikacja") return [{ text: "Tu trafiają teksty, przy których nie jestem pewna. Ty decydujesz jednym kliknięciem.", target: '[data-guide="queue"]' }]
  if (pathname === "/mierniki") return [{ text: "Zapytania z małą liczbą wyników pokazują, czego jeszcze brakuje w radarze.", target: '[data-guide="searches"]' }]
  if (pathname === "/analizuj") return [{ text: "Wklej link do komunikatu uczelni albo urzędu. Sprawdzę, czy to innowacja, i zrobię kartę.", target: '[data-guide="analyze"]' }]
  if (pathname === "/kryteria") return [{ text: "Tu jest cała moja metodologia. Żadnych czarnych skrzynek!" }]
  return [{ text: "Hej! Kliknij mnie, jeśli potrzebujesz podpowiedzi." }]
}

export function IskierkaGuide() {
  const pathname = usePathname()
  const tips = tipsFor(pathname)
  const [state, setState] = useState({ path: pathname, open: false, index: 0 })
  const open = state.path === pathname && state.open
  const index = state.path === pathname ? state.index : 0
  const setOpen = useCallback((value: boolean) => setState({ path: pathname, open: value, index: value ? index : 0 }), [pathname, index])
  const setIndex = useCallback(
    (next: number | ((i: number) => number)) => setState({ path: pathname, open: true, index: typeof next === "function" ? next(index) : next }),
    [pathname, index],
  )

  const clearHighlight = useCallback(() => {
    document.querySelectorAll(".guide-highlight").forEach((el) => el.classList.remove("guide-highlight"))
  }, [])

  useEffect(() => {
    clearHighlight()
    const key = "iskra-guide:" + (pathname.startsWith("/innowacje/") ? "/innowacje/*" : pathname)
    if (sessionStorage.getItem(key)) return
    const t = setTimeout(() => {
      sessionStorage.setItem(key, "1")
      setState({ path: pathname, open: true, index: 0 })
    }, 1200)
    return () => clearTimeout(t)
  }, [pathname, clearHighlight])

  useEffect(() => {
    clearHighlight()
    if (!open) return
    const target = tips[index]?.target
    if (!target) return
    const el = document.querySelector(target)
    if (!el) return
    el.classList.add("guide-highlight")
    const rect = el.getBoundingClientRect()
    const visible = rect.top >= 72 && rect.top < window.innerHeight * 0.75
    if (!visible) el.scrollIntoView({ behavior: "smooth", block: rect.height > window.innerHeight * 0.6 ? "start" : "center" })
    return () => el.classList.remove("guide-highlight")
  }, [open, index, tips, clearHighlight])

  const tip = tips[index] ?? tips[0]
  const last = index >= tips.length - 1

  return (
    <div className="no-print fixed bottom-4 left-4 z-50 flex items-end gap-2">
      <Iskierka
        color="ember"
        pose={open ? "wave" : "idle"}
        size={76}
        follow
        label="Iskierka, przewodniczka po radarze"
        onClick={() => {
          if (open && !last) setIndex((i) => i + 1)
          else setOpen(!open)
        }}
      />
      {open ? (
        <div key={pathname + index} className="guide-bubble mb-14 w-[300px] rounded-3xl border border-border bg-card p-4 text-sm shadow-[0_24px_50px_-20px_rgba(120,40,10,.5)]">
          <p className="leading-relaxed">{tip.text}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground tabular-nums">
              {index + 1} / {tips.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Zamknij
              </button>
              {!last ? (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i + 1)}
                  className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-[inset_0_-3px_0_rgba(0,0,0,.15),inset_0_2px_0_rgba(255,255,255,.35)]"
                >
                  Pokaż dalej ›
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
