import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Text RPG Game',
  description: 'A text-based RPG with creatures, dungeons, and PvP',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <Navigation />
          <main className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
