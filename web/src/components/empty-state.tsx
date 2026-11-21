import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { SparkMark } from "./spark-mark"

export function EmptyState({ title, children, href, cta }: { title: string; children?: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <SparkMark className="size-10 opacity-80" />
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
