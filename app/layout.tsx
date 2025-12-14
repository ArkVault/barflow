import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { SubscriptionGuard } from '@/components/subscription-guard'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

const geist = Geist({
  subsets: ["latin"],
  variable: '--font-geist'
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: '--font-geist-mono'
});

export const metadata: Metadata = {
  title: 'Barflow - Sistema de Inventario para Bares',
  description: 'Sistema inteligente de gestión de inventario y proyecciones para bares y restaurantes',
  icons: {
    icon: [
      {
        url: '/icon-dark-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>
          <AuthProvider>
            <SubscriptionGuard>
              {children}
            </SubscriptionGuard>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
