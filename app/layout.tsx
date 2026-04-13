import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WeekOrganizator',
  description: 'Planifica tu semana con claridad.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${geist.className} bg-zinc-950 text-zinc-100 antialiased`}>
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  )
}
