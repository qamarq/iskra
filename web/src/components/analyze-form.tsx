"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STEPS = [
  "Pobieram stronę",
  "Sprawdzam, czy to innowacja (Oslo Manual)",
  "Tworzę kartę i weryfikuję cytaty w źródle",
  "Szukam podobnych rozwiązań i publikacji",
  "Oceniam potencjał i wiarygodność",
  "Wskazuję, gdzie można to zastosować",
]

export function AnalyzeForm() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [rejected, setRejected] = useState<string | null>(null)

  useEffect(() => {
    if (!pending) return
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 4500)
    return () => clearInterval(id)
  }, [pending])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setRejected(null)
    setPending(true)
    setStep(0)
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Nie udało się przeanalizować źródła")
      if (!body.ok) {
        setRejected(body.reason)
        setPending(false)
        return
      }
      router.push("/innowacje/" + body.slug)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się przeanalizować źródła")
      setPending(false)
    }
  }

  if (pending) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8">
        <p className="font-heading text-xl font-semibold">Analizuję źródło…</p>
        <p className="mt-1 text-sm text-muted-foreground">Zwykle 20–40 sekund.</p>
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
      <label className="block space-y-2">
        <span className="text-sm font-medium">Adres strony opisującej rozwiązanie</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="https://… (komunikat uczelni, opis projektu, artykuł o wdrożeniu w urzędzie)"
          className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-ring"
        />
      </label>
      {rejected ? (
        <div className="rounded-xl bg-[#FFF6DF] px-4 py-3 text-sm text-[#5E4003]">
          <p className="font-medium">To źródło nie opisuje innowacji według definicji Oslo Manual.</p>
          <p className="mt-1">{rejected}</p>
        </div>
      ) : null}
      {error ? <p className="rounded-xl bg-[#F6E3E4] px-4 py-3 text-sm text-[#8F1D24]">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" className="h-11 px-6">
          Przeanalizuj
        </Button>
        <Link href="/kryteria" className="text-sm text-primary hover:underline">
          Jak radar ocenia?
        </Link>
      </div>
    </form>
  )
}
