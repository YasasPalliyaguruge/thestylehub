import type { Metadata } from 'next'
import { Syne, Inter } from 'next/font/google'
import './globals.css'
import '@/styles/public-theme.css'
import SmoothScroll from '@/components/layout/SmoothScroll'
import PublicBackdrop from '@/components/layout/PublicBackdrop'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Style Hub | Premium Unisex Salon Experience',
  description: 'Luxury salon experience with precision styling, bespoke color, premium services, and an atmosphere of elegance.',
  keywords: ['salon', 'hair salon', 'beauty salon', 'unisex salon', 'luxury salon'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable}`}>
      <body className="font-body antialiased" suppressHydrationWarning>
        {/* Smooth Scroll */}
        <SmoothScroll />

        {/* Public particle background */}
        <PublicBackdrop />

        {/* Grain texture overlay */}
        <div className="grain-overlay" />

        {/* Main content */}
        {children}
      </body>
    </html>
  )
}
