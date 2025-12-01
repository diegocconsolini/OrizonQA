import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'ORIZON - AI-Powered QA Analysis',
  description: 'Transform your codebase into comprehensive user stories, test cases, and acceptance criteria using Claude AI',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-bg-dark">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
