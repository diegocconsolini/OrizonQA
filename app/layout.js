import './globals.css'

export const metadata = {
  title: 'Codebase QA Analyzer',
  description: 'Analyze codebases and generate user stories, test cases, and acceptance criteria using Claude AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
