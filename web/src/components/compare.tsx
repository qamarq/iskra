"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"

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
      <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground shadow-xl">
        <span>
          Do porównania: <b>{slugs.length}</b>
        </span>
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
