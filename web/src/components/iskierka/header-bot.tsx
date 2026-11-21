"use client"

import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { Iskierka } from "./iskierka"

function Tugging() {
  const pathname = usePathname()
  return (
    <span key={pathname} className="isk-tug relative inline-flex">
      <Iskierka color="ember" pose="idle" size={34} />
      <span className="isk-rope pointer-events-none absolute top-[70%] left-1/2 h-0 w-px bg-primary/60" />
    </span>
  )
}

export function HeaderBot() {
  return (
    <Suspense fallback={<Iskierka color="ember" pose="idle" size={34} />}>
      <Tugging />
    </Suspense>
  )
}
