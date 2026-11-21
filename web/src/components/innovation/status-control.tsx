"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { changeStatus, reanalyze } from "@/app/actions"
import { Button } from "@/components/ui/button"
import type { InnovationStatus } from "@/lib/domain"

export function StatusControl({ innovationId, status }: { innovationId: number; status: InnovationStatus }) {
  const [pending, startTransition] = useTransition()
  const run = (fn: () => Promise<void>, ok: string) =>
    startTransition(async () => {
      try {
        await fn()
        toast.success(ok)
      } catch {
        toast.error("Nie udało się")
      }
    })
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "zweryfikowana" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => changeStatus(innovationId, "zweryfikowana"), "Oznaczono jako zweryfikowaną")}>
          Zweryfikowana
        </Button>
      ) : null}
      {status !== "odrzucona" ? (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => changeStatus(innovationId, "odrzucona"), "Odrzucono")}>
          Odrzuć
        </Button>
      ) : (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => changeStatus(innovationId, "nowa"), "Przywrócono")}>
          Przywróć
        </Button>
      )}
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => reanalyze(innovationId), "Analiza odświeżona")}>
        {pending ? "Pracuję…" : "Odśwież analizę"}
      </Button>
    </div>
  )
}
