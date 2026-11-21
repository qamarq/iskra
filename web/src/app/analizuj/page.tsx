import type { Metadata } from "next"
import { AnalyzeForm } from "@/components/analyze-form"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = { title: "Przeanalizuj źródło · ISKRA" }

export default function AnalyzePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <PageHeader eyebrow="Analiza" title="Przeanalizuj źródło">
        Radar sam przeszukuje strony uczelni, samorządów i baz projektów. Jeśli znasz konkretną stronę z opisem istniejącego rozwiązania, wklej link: ISKRA
        sprawdzi, czy to innowacja, zbuduje kartę z cytatami i oceni jej potencjał. Jeśli rozwiązanie już jest w bazie, źródło zostanie do niego dołączone.
      </PageHeader>
      <AnalyzeForm />
    </main>
  )
}
