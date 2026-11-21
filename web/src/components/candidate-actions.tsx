"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { approveCandidate, rejectCandidate } from "@/app/actions"
import { Button } from "@/components/ui/button"

export function CandidateActions({ documentId }: { documentId: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              const { slug } = await approveCandidate(documentId)
              router.push("/innowacje/" + slug)
            } catch {
              toast.error("Nie udało się przeanalizować kandydata")
            }
          })
        }
      >
        {pending ? "Analizuję…" : "To innowacja"}
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(() => rejectCandidate(documentId))}>
        Odrzuć
      </Button>
    </div>
  )
}
