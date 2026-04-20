import type { Metadata } from 'next'
import './globals.css'
import { RoleProvider } from '@/lib/role-context'

export const metadata: Metadata = {
  title: 'Project Brain',
  description: 'AI Knowledge Management for SolidBytes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  )
}
