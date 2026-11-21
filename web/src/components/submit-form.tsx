"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STEPS = [
  "Czytam źródło",
  "Tworzę kartę innowacji z cytatami",
  "Szukam podobnych rozwiązań",
  "Oceniam według 6 kryteriów",
  "Wybieram ścieżkę rozwoju",
  "Dobieram partnerów",
]

export function SubmitForm() {
  const router = useRouter()
  const [mode, setMode] = useState<"text" | "url">("text")
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pending) return
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 4500)
    return () => clearInterval(id)
  }, [pending])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)
    setStep(0)
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "url" ? { url } : { text }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Nie udało się przetworzyć zgłoszenia")
      router.push("/innowacje/" + body.slug)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się przetworzyć zgłoszenia")
      setPending(false)
    }
  }

  if (pending) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8">
        <p className="font-heading text-xl font-semibold">Analizuję zgłoszenie…</p>
        <p className="mt-1 text-sm text-muted-foreground">To zwykle trwa 20–40 sekund.</p>
        <ol className="mt-6 space-y-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  i < step ? "bg-primary text-primary-foreground" : i === step ? "animate-pulse bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="inline-flex rounded-xl bg-muted p-1">
        {(["text", "url"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn("rounded-lg px-4 py-1.5 text-sm font-medium", mode === m ? "bg-card shadow-sm" : "text-muted-foreground")}
          >
            {m === "text" ? "Opis" : "Link do strony"}
          </button>
        ))}
      </div>
      {mode === "text" ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium">Opisz rozwiązanie</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            required
            minLength={80}
            placeholder="Jaki problem rozwiązuje, kto i gdzie je stworzył, na jakim jest etapie, jakie są efekty i ile kosztowało wdrożenie. Możesz wkleić tekst ogłoszenia, sprawozdania albo artykułu."
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:border-ring"
          />
        </label>
      ) : (
        <label className="block space-y-2">
          <span className="text-sm font-medium">Adres strony z opisem innowacji</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://www.gmina.pl/aktualnosci/…"
            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-ring"
          />
        </label>
      )}
      {error ? <p className="rounded-xl bg-[#F6E3E4] px-4 py-3 text-sm text-[#8F1D24]">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" className="h-11 px-6">
          Analizuj i oceń
        </Button>
        <p className="text-xs text-muted-foreground">Nie podawaj danych osobowych poza imieniem i rolą twórców.</p>
      </div>
    </form>
  )
}
