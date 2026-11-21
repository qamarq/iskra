"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { approveCandidate, rejectCandidate } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Iskierka } from "./iskierka/iskierka"

export function CandidateActions({ documentId }: { documentId: number }) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<"idle" | "carry" | "bin">("idle")

  const animateCard = (frames: Keyframe[], duration: number) =>
    ref.current?.closest("li")?.animate(frames, { duration, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).finished

  return (
    <div ref={ref} className="flex items-center gap-2">
      {mode !== "idle" ? (
        <span className="isk-hop inline-flex">
          <Iskierka color={mode === "carry" ? "mint" : "glow"} pose={mode === "carry" ? "lupa" : "confused"} size={52} />
        </span>
      ) : null}
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          setMode("carry")
          startTransition(async () => {
            try {
              const { slug } = await approveCandidate(documentId)
              await animateCard(
                [
                  { transform: "none", opacity: 1 },
                  { transform: "translateY(-30px) scale(.96) rotate(-1deg)", opacity: 1, offset: 0.3 },
                  { transform: "translate(60vw, -40vh) scale(.3) rotate(8deg)", opacity: 0 },
                ],
                700,
              )
              router.push("/innowacje/" + slug)
            } catch {
              setMode("idle")
              toast.error("Nie udało się przeanalizować kandydata")
            }
          })
        }}
      >
        {pending && mode === "carry" ? "Iskierka robi kartę…" : "To innowacja"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          setMode("bin")
          startTransition(async () => {
            await animateCard(
              [
                { transform: "none", opacity: 1 },
                { transform: "rotate(-3deg) scale(.95)", opacity: 1, offset: 0.25 },
                { transform: "translateY(60px) rotate(12deg) scale(.2)", opacity: 0 },
              ],
              600,
            )
            await rejectCandidate(documentId)
          })
        }}
      >
        Odrzuć
      </Button>
    </div>
  )
}
