import type { Metadata } from "next"
import { Figtree, Sora } from "next/font/google"
import { Suspense } from "react"
import { CompareBar } from "@/components/compare"
import { IskierkaGuide } from "@/components/iskierka/guide"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin", "latin-ext"] })
const sora = Sora({ variable: "--font-sora", subsets: ["latin", "latin-ext"] })

export const metadata: Metadata = {
  title: "ISKRA: radar polskich innowacji",
  description: "Wyszukiwanie, ocena i porównywanie istniejących polskich innowacji technologicznych, edukacyjnych i administracyjnych.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${figtree.variable} ${sora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <SiteHeader />
          {children}
          <CompareBar />
          <Suspense fallback={null}>
            <IskierkaGuide />
          </Suspense>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  )
}
