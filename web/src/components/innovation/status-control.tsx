"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { changeStatus, reanalyze } from "@/app/actions"
import { Button } from "@/components/ui/button"
import type { InnovationStatus } from "@/lib/domain"
import { STATUS_LABEL } from "@/lib/labels"

const NEXT: Partial<Record<InnovationStatus, InnovationStatus[]>> = {
  rekomendowana: ["w_kontakcie", "odrzucona"],
  w_kontakcie: ["pilotaz", "wdrozona", "odrzucona"],
  pilotaz: ["wdrozona", "odrzucona"],
}

export function StatusControl({ innovationId, status }: { innovationId: number; status: InnovationStatus }) {
  const [pending, startTransition] = useTransition()
  const options = NEXT[status] ?? []
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === "odrzucona" ? "ghost" : "outline"}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await changeStatus(innovationId, next)
              toast.success("Status: " + STATUS_LABEL[next])
            })
          }
        >
          {next === "odrzucona" ? "Odrzuć" : "→ " + STATUS_LABEL[next]}
        </Button>
      ))}
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await reanalyze(innovationId)
              toast.success("Analiza odświeżona")
            } catch {
              toast.error("Nie udało się odświeżyć analizy")
            }
          })
        }
      >
        {pending ? "Analizuję…" : "Odśwież analizę"}
      </Button>
    </div>
  )
}
