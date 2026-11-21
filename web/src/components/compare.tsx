"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import { createRoot } from "react-dom/client"
import { cn } from "@/lib/utils"
import { Iskierka } from "./iskierka/iskierka"

function flyToBar(from: DOMRect) {
  const host = document.createElement("div")
  host.className = "pointer-events-none fixed z-[60]"
  host.style.left = from.left + from.width / 2 - 28 + "px"
  host.style.top = from.top - 30 + "px"
  document.body.appendChild(host)
  const root = createRoot(host)
  root.render(<Iskierka color="mint" pose="cheer" size={56} />)
  const dx = window.innerWidth / 2 - (from.left + from.width / 2)
  const dy = window.innerHeight - 60 - from.top
  const anim = host.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.2 - 120}px) scale(1.15) rotate(-12deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.5) rotate(10deg)`, opacity: 0.2 },
    ],
    { duration: 900, easing: "cubic-bezier(.4,.0,.2,1)" },
  )
  anim.onfinish = () => {
    root.unmount()
    host.remove()
  }
}

const KEY = "iskra-compare"
const MAX = 4
const listeners = new Set<() => void>()

function read(): string {
  if (typeof window === "undefined") return "[]"
  return window.localStorage.getItem(KEY) ?? "[]"
}

function write(slugs: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(slugs.slice(-MAX)))
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

export function useCompare() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]")
  const slugs = JSON.parse(raw) as string[]
  return {
    slugs,
    has: (slug: string) => slugs.includes(slug),
    toggle: (slug: string) => write(slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug]),
    clear: () => write([]),
  }
}

export function CompareToggle({ slug, className }: { slug: string; className?: string }) {
  const { has, toggle } = useCompare()
  const active = has(slug)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!active && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) flyToBar(e.currentTarget.getBoundingClientRect())
        toggle(slug)
      }}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        active ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/50",
        className,
      )}
    >
      {active ? "✓ W porównaniu" : "+ Porównaj"}
    </button>
  )
}

export function CompareBar() {
  const { slugs, clear } = useCompare()
  if (slugs.length === 0) return null
  return (
    <div className="no-print fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl bg-secondary py-2 pr-4 pl-2 text-sm text-secondary-foreground shadow-xl">
        <span key={slugs.length} className="bar-bounce relative -mt-8 inline-flex">
          <Iskierka color="mint" pose="ok" size={54} />
          <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">{slugs.length}</span>
        </span>
        <span>{slugs.length === 1 ? "Dodaj jeszcze jedno rozwiązanie" : "Rozwiązań do porównania: " + slugs.length}</span>
        <Link href={"/porownaj?k=" + slugs.join(",")} className="rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground">
          Porównaj
        </Link>
        <button type="button" onClick={clear} className="text-white/70 hover:text-white">
          Wyczyść
        </button>
      </div>
    </div>
  )
}
