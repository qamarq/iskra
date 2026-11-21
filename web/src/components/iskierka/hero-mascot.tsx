"use client"

import { useState } from "react"
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
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div key={line} className="guide-bubble absolute top-[6%] left-1/2 z-10 max-w-[260px] -translate-x-1/2 rounded-3xl border border-border bg-card px-4 py-3 text-center text-sm font-medium shadow-[0_20px_40px_-20px_rgba(120,40,10,.5)]">
        {LINES[line]}
      </div>
      <Iskierka color="ember" pose="wave" size={250} follow label="Iskierka: kliknij, żeby porozmawiać" onClick={() => setLine((l) => (l + 1) % LINES.length)} />
      <span className="absolute bottom-[14%] left-[12%]"><Iskierka color="mint" pose="lupa" size={74} /></span>
      <span className="absolute right-[8%] bottom-[22%]"><Iskierka color="lilac" pose="ok" size={64} /></span>
    </div>
  )
}
