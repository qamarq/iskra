"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { RadarSearch } from "./iskierka/radar-search"

export function SearchBox({ defaultValue, hidden, large }: { defaultValue?: string; hidden?: Record<string, string | undefined>; large?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState(defaultValue ?? "")
  const [searching, setSearching] = useState("")

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    for (const [k, v] of Object.entries(hidden ?? {})) if (v) params.set(k, v)
    setSearching(query.trim())
    const started = Date.now()
    startTransition(async () => {
      router.push("/innowacje" + (params.toString() ? "?" + params.toString() : ""))
      const wait = 1100 - (Date.now() - started)
      if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    })
  }

  return (
    <>
      <form action="/innowacje" onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className={"pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground " + (large ? "size-5" : "size-4")} />
          <input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Opisz, czego szukasz, np. „jak skrócić kolejki w urzędzie” albo „czujniki jakości powietrza dla szkół”"
            className={
              "w-full rounded-2xl border border-input bg-card pr-4 outline-none focus:border-ring " + (large ? "h-14 pl-12 text-base shadow-sm" : "h-11 pl-10 text-sm")
            }
          />
        </div>
        {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
        <button className={"rounded-2xl bg-secondary px-5 font-medium text-secondary-foreground " + (large ? "h-14" : "h-11 text-sm")}>Szukaj</button>
      </form>
      {pending ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="radar-pop rounded-[2.5rem] border border-border bg-card px-10 py-8 shadow-[0_40px_80px_-40px_rgba(120,40,10,.55)]">
            <RadarSearch query={searching} />
          </div>
        </div>
      ) : null}
    </>
  )
}
