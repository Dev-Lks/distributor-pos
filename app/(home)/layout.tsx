import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "NitroBeer - Chopp Artesanal",
  description: "Chopp artesanal gelado na pressão. Venha nos visitar!",
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased dark">
        {children}
      </body>
    </html>
  )
}