# Codebase QA Analyzer

Analyze codebases and generate user stories, test cases, and acceptance criteria using Claude AI. Execute generated tests directly in your browser.

## Features

- **User Authentication**: Secure signup, login, and password reset with email verification
- **Multiple Input Methods**: Paste code, fetch from public GitHub repos, or upload files (including .zip)
- **Configurable Analysis**: Choose what to generate - user stories, test cases, acceptance criteria
- **Framework Support**: Generic, Jest, Pytest, or JUnit formatted test cases
- **Output Formats**: Markdown, JSON, or Jira-ready format
- **Edge Cases & Security**: Optional inclusion of edge case and security test scenarios
- **Analysis History**: View, search, and filter all past analyses
- **Persistent Storage**: All analyses are saved and linked to your account
- **Browser-Based Test Execution**: Run Jest, Vitest, or Mocha tests directly in browser using WebContainers
- **Real-Time Results**: Live streaming of test output with pass/fail indicators

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Claude API key from [console.anthropic.com](https://console.anthropic.com)

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/codebase-qa-analyzer)

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Usage

1. **Input your code**: Paste directly, fetch from GitHub, or upload files
2. **Configure analysis**: Select what to generate and output format
3. **Enter API key**: Your Claude API key (never stored, used only for the request)
4. **Analyze**: Click the button and wait for results
5. **Export**: Copy to clipboard or download as Markdown/JSON
6. **Execute Tests**: Click "Execute Tests" to run generated tests in your browser

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework with App Router
- [NextAuth v5](https://next-auth.js.org/) - Authentication
- [PostgreSQL](https://www.postgresql.org/) - Database (Vercel Postgres)
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Icons
- [JSZip](https://stuk.github.io/jszip/) - ZIP file handling
- [Claude API](https://docs.anthropic.com/claude/reference/messages_post) - AI analysis
- [Resend](https://resend.com/) - Transactional emails
- [WebContainers](https://webcontainers.io/) - Browser-based test execution

## Privacy & Security

- API keys are encrypted with AES-256-GCM before storage
- User passwords are hashed with bcrypt
- All analyses are linked to your user account
- Email verification required for account activation
- Secure session management with NextAuth

## License

MIT
