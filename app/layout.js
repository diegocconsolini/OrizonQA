import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'ORIZON - AI-Powered QA Analysis',
  description: 'Transform your codebase into comprehensive user stories, test cases, and acceptance criteria using Claude AI',
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
