"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { overrideCriterion } from "@/app/actions"
import { Button } from "@/components/ui/button"
import type { Criterion } from "@/lib/domain"

export function CriterionOverride({ innovationId, criterion, current }: { innovationId: number; criterion: Criterion; current: number }) {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(current)
  const [rationale, setRationale] = useState("")
  const [pending, startTransition] = useTransition()

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-primary hover:underline">
        Popraw ocenę
      </button>
    )
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/50 p-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            className={
              "size-8 rounded-lg border text-sm font-semibold tabular-nums " +
              (n === score ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50")
            }
          >
            {n}
          </button>
        ))}
      </div>
      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        placeholder="Dlaczego zmieniasz ocenę?"
        rows={2}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await overrideCriterion(innovationId, criterion, score, rationale)
              toast.success("Ocena zapisana, wynik i ścieżka przeliczone")
              setOpen(false)
            })
          }
        >
          Zapisz
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Anuluj
        </Button>
      </div>
    </div>
  )
}
