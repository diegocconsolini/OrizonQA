# Codebase QA Analyzer

Analyze codebases and generate user stories, test cases, and acceptance criteria using Claude AI.

## Features

- **Multiple Input Methods**: Paste code, fetch from public GitHub repos, or upload files (including .zip)
- **Configurable Analysis**: Choose what to generate - user stories, test cases, acceptance criteria
- **Framework Support**: Generic, Jest, Pytest, or JUnit formatted test cases
- **Output Formats**: Markdown, JSON, or Jira-ready format
- **Edge Cases & Security**: Optional inclusion of edge case and security test scenarios

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

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Icons
- [JSZip](https://stuk.github.io/jszip/) - ZIP file handling
- [Claude API](https://docs.anthropic.com/claude/reference/messages_post) - AI analysis

## Privacy

Your API key is sent directly to Anthropic's API via our serverless function and is never stored or logged. All processing happens in real-time with no data persistence.

## License

MIT
