import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { after } from "next/server"
import { InnovationView } from "@/components/innovation/innovation-view"
import { getInnovation, recordView } from "@/server/queries"

export const metadata: Metadata = { title: "Karta innowacji · ISKRA" }
export const instant = false

export default async function InnovationPage({ params }: PageProps<"/innowacje/[slug]">) {
  const { slug } = await params
  const data = await getInnovation(decodeURIComponent(slug))
  if (!data) notFound()
  after(() => recordView(data.id))
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <InnovationView data={data} />
    </main>
  )
}
