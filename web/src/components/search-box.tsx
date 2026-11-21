"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition, ViewTransition } from "react"
import { cn } from "@/lib/utils"
import { Iskierka } from "./iskierka/iskierka"

const MIN_SEARCH_MS = 1000

export function SearchBox({
  defaultValue,
  hidden,
  large,
  examples,
}: {
  defaultValue?: string
  hidden?: Record<string, string | undefined>
  large?: boolean
  examples?: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState(defaultValue ?? "")
  const [typing, setTyping] = useState(false)
  const busy = pending || typing

  function search(value: string) {
    const params = new URLSearchParams()
    if (value.trim()) params.set("q", value.trim())
    for (const [k, v] of Object.entries(hidden ?? {})) if (v) params.set(k, v)
    window.dispatchEvent(new CustomEvent("iskra:search", { detail: value.trim() }))
    startTransition(async () => {
      router.push("/innowacje" + (params.toString() ? "?" + params.toString() : ""))
      await new Promise((r) => setTimeout(r, MIN_SEARCH_MS))
    })
  }

  async function typeIn(text: string) {
    if (busy) return
    setTyping(true)
    for (let i = 1; i <= text.length; i++) {
      setQuery(text.slice(0, i))
      await new Promise((r) => setTimeout(r, 18 + Math.random() * 22))
    }
    setTyping(false)
    search(text)
  }

  return (
    <div className="space-y-3">
      <ViewTransition name="search-box" share="morph" default="none">
        <form
          action="/innowacje"
          onSubmit={(e) => {
            e.preventDefault()
            if (!busy) search(query)
          }}
          className={cn("relative flex gap-2", pending && "is-searching")}
        >
          {pending ? (
            <span className="search-runner pointer-events-none absolute -top-[50px] z-10" aria-hidden="true">
              <Iskierka color="mint" pose="lupa" size={54} />
            </span>
          ) : null}
          <div className={cn("search-field relative flex-1 overflow-hidden rounded-2xl", pending && "search-field-active")}>
            <Search className={"pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-muted-foreground " + (large ? "size-5" : "size-4")} />
            <input
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              readOnly={busy}
              placeholder="Opisz, czego szukasz, np. „jak skrócić kolejki w urzędzie” albo „czujniki jakości powietrza dla szkół”"
              className={
                "relative w-full rounded-2xl border border-input bg-card pr-4 outline-none focus:border-ring " +
                (large ? "h-14 pl-12 text-base shadow-sm" : "h-11 pl-10 text-sm")
              }
            />
            {pending ? <span className="search-scan pointer-events-none absolute inset-y-0 left-0 w-1/3" aria-hidden="true" /> : null}
          </div>
          {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
          <button
            disabled={busy}
            className={cn(
              "inline-flex min-w-[112px] items-center justify-center gap-2 rounded-2xl bg-secondary px-5 font-medium text-secondary-foreground transition-colors",
              large ? "h-14" : "h-11 text-sm",
              pending && "bg-primary text-primary-foreground",
            )}
          >
            {pending ? (
              <>
                <span className="search-dot" />
                Szukam
              </>
            ) : (
              "Szukaj"
            )}
          </button>
        </form>
      </ViewTransition>
      {examples?.length ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Na przykład:</span>
          {examples.map((e) => (
            <button
              key={e}
              type="button"
              disabled={busy}
              onClick={() => typeIn(e)}
              className="rounded-full border border-border bg-card px-3 py-1 transition-colors hover:border-primary/50 disabled:opacity-60"
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
