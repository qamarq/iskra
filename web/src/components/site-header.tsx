import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { NavLinks } from "./nav-links"
import { SparkMark } from "./spark-mark"

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="flex items-center gap-2">
          <SparkMark className="size-7" />
          <span className="font-heading text-lg font-semibold tracking-tight">ISKRA</span>
        </Link>
        <NavLinks />
        <Link href="/analizuj" className={buttonVariants({ size: "lg", className: "ml-auto px-4" })}>
          Przeanalizuj źródło
        </Link>
      </div>
    </header>
  )
}
