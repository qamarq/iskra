import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { SubmitForm } from "@/components/submit-form"

export const metadata: Metadata = { title: "Zgłoś innowację · ISKRA" }

export default function SubmitPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <PageHeader eyebrow="Zgłoszenie" title="Zgłoś innowację">
        Wklej opis albo link. ISKRA ułoży z niego kartę innowacji, sprawdzi, czy ktoś już rozwiązał ten problem, oceni potencjał według jawnych
        kryteriów i wskaże ścieżkę rozwoju oraz partnerów.
      </PageHeader>
      <SubmitForm />
    </main>
  )
}
