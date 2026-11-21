import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Iskierka } from "./iskierka/iskierka"

export function EmptyState({ title, children, href, cta }: { title: string; children?: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <Iskierka color="glow" pose="confused" size={110} />
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {children ? <p className="max-w-md text-sm text-muted-foreground">{children}</p> : null}
      {href && cta ? (
        <Link href={href} className={buttonVariants({ size: "lg", className: "mt-2 px-4" })}>
          {cta}
        </Link>
      ) : null}
    </div>
  )
}
