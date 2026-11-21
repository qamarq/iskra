import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { after, connection } from "next/server"
import { Suspense } from "react"
import { InnovationView } from "@/components/innovation/innovation-view"
import { Skeleton } from "@/components/ui/skeleton"
import { getInnovation, recordView } from "@/server/queries"

export const metadata: Metadata = { title: "Karta innowacji · ISKRA" }

export default function InnovationPage({ params }: PageProps<"/innowacje/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <Suspense fallback={<DetailSkeleton />}>{params.then(({ slug }) => <InnovationDetail slug={slug} />)}</Suspense>
    </main>
  )
}

async function InnovationDetail({ slug }: { slug: string }) {
  await connection()
  const data = await getInnovation(decodeURIComponent(slug))
  if (!data) notFound()
  after(() => recordView(data.id))
  return <InnovationView data={data} />
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-56 rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-[600px] rounded-3xl" />
        <Skeleton className="h-[600px] rounded-3xl" />
      </div>
    </div>
  )
}
