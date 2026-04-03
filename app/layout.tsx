import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://industrialparts.example.com'),
  title: {
    default: 'Industrial Parts Co. - Industrial Automation Components',
    template: '%s | Industrial Parts Co.',
  },
  description: 'Your trusted source for industrial automation components including PLCs, HMIs, sensors, drives, and more.',
  keywords: ['industrial automation', 'PLC', 'HMI', 'sensors', 'drives', 'Siemens', 'automation control', 'industrial parts', 'SCADA'],
  authors: [{ name: 'Industrial Parts Co.' }],
  creator: 'Industrial Parts Co.',
  publisher: 'Industrial Parts Co.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'pAAU6DiToSkhLlRmIjvGRT_NtlL-xnduOF02QaN3h7o',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['zh_CN', 'es_ES', 'fr_FR', 'ar_SA', 'ru_RU'],
    siteName: 'Industrial Parts Co.',
    title: 'Industrial Parts Co. - Industrial Automation Components',
    description: 'Your trusted source for industrial automation components including PLCs, HMIs, sensors, drives, and more.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Industrial Parts Co.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Industrial Parts Co. - Industrial Automation Components',
    description: 'Your trusted source for industrial automation components including PLCs, HMIs, sensors, drives, and more.',
    images: ['/og-image.svg'],
    creator: '@IndustrialPartsCo',
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'zh-CN': '/',
      'es-ES': '/',
      'fr-FR': '/',
      'ar-SA': '/',
      'ru-RU': '/',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background">
        {children}
      </body>
    </html>
  )
}
