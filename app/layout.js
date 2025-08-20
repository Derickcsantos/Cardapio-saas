import './globals.css'
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: 'Menu SaaS 3D - Sistema de Cardápio Digital',
  description: 'Plataforma SaaS para criação e gestão de cardápios digitais com visualização 3D',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}