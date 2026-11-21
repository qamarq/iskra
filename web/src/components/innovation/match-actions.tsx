"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { changeMatchStatus } from "@/app/actions"
import { Button } from "@/components/ui/button"
import type { MatchStatus } from "@/lib/domain"

export function MatchActions({ matchId, status, message }: { matchId: number; status: MatchStatus; message: string | null }) {
  const [pending, startTransition] = useTransition()
  const set = (next: MatchStatus, text: string) =>
    startTransition(async () => {
      await changeMatchStatus(matchId, next)
      toast.success(text)
    })

  return (
    <div className="flex flex-wrap gap-2">
      {message ? (
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(message)
            toast.success("Wiadomość skopiowana")
          }}
        >
          Kopiuj wiadomość
        </Button>
      ) : null}
      {status === "zaproponowane" ? (
        <Button size="sm" disabled={pending} onClick={() => set("wyslane", "Oznaczono jako wysłane")}>
          Wysłano
        </Button>
      ) : null}
      {status === "wyslane" ? (
        <>
          <Button size="sm" disabled={pending} onClick={() => set("zainteresowany", "Partner zainteresowany")}>
            Zainteresowany
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => set("odrzucone", "Partner odmówił")}>
            Odmówił
          </Button>
        </>
      ) : null}
    </div>
  )
}
