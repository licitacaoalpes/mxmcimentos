import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MXM Cimentos',
  description: 'Gestão de transações — Parceria Ivo Menezes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
