"use client"

import { useEffect, useState, ViewTransition } from "react"
import { Iskierka } from "./iskierka"

const LINES = [
  "Cześć! Jestem Iskierka 👋",
  "Czytam strony uczelni, gmin i szkół, żebyś Ty nie musiał.",
  "Każdy fakt sprawdzam cytatem ze źródła.",
  "Kliknij mnie jeszcze raz!",
  "Hihi, łaskocze! ✨",
]

export function HeroMascot() {
  const [line, setLine] = useState(0)
  const [searching, setSearching] = useState<string | null>(null)

  useEffect(() => {
    const onSearch = (e: Event) => setSearching((e as CustomEvent<string>).detail || "")
    window.addEventListener("iskra:search", onSearch)
    return () => window.removeEventListener("iskra:search", onSearch)
  }, [])

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        key={searching ?? line}
        className="guide-bubble absolute top-[6%] left-1/2 z-10 max-w-[260px] -translate-x-1/2 rounded-3xl border border-border bg-card px-4 py-3 text-center text-sm font-medium shadow-[0_20px_40px_-20px_rgba(120,40,10,.5)]"
      >
        {searching !== null ? "Już szukam! Sprawdzam radar…" : LINES[line]}
      </div>
      <ViewTransition name="iskierka-main" share="morph" default="none">
        <span className={searching !== null ? "hero-searching inline-flex" : "inline-flex"}>
          <Iskierka
            color="ember"
            pose={searching !== null ? "lupa" : "wave"}
            size={250}
            follow
            label="Iskierka: kliknij, żeby porozmawiać"
            onClick={() => setLine((l) => (l + 1) % LINES.length)}
          />
        </span>
      </ViewTransition>
      <span className="absolute bottom-[14%] left-[12%]"><Iskierka color="mint" pose="lupa" size={74} /></span>
      <span className="absolute right-[8%] bottom-[22%]"><Iskierka color="lilac" pose="ok" size={64} /></span>
    </div>
  )
}
