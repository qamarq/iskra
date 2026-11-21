import type { Metadata } from "next"
import { Figtree, Sora } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin", "latin-ext"] })
const sora = Sora({ variable: "--font-sora", subsets: ["latin", "latin-ext"] })

export const metadata: Metadata = {
  title: "ISKRA: radar innowacji",
  description: "Identyfikacja · Selekcja · Kojarzenie · Rozwój · Adaptacja. Wykrywanie, ocena i transfer innowacji z instytucji publicznych.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${figtree.variable} ${sora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  )
}
