"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/innowacje", label: "Innowacje" },
  { href: "/weryfikacja", label: "Do weryfikacji" },
  { href: "/partnerzy", label: "Partnerzy" },
  { href: "/mierniki", label: "Mierniki" },
  { href: "/kryteria", label: "Kryteria" },
]

export function NavLinks() {
  return (
    <Suspense fallback={<Links pathname={null} />}>
      <ActiveLinks />
    </Suspense>
  )
}

function ActiveLinks() {
  return <Links pathname={usePathname()} />
}

function Links({ pathname }: { pathname: string | null }) {
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {LINKS.map((link) => {
        const active = pathname != null && (pathname === link.href || pathname.startsWith(link.href + "/"))
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-accent text-accent-foreground",
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
