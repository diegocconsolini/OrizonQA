# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Codebase QA Analyzer** - A Next.js web application that uses Claude AI to analyze codebases and generate QA artifacts (user stories, test cases, and acceptance criteria). The app supports multiple input methods: direct code pasting, GitHub repository fetching, and file uploads (including .zip files).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (not TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **File Processing**: JSZip for handling .zip archives
- **AI**: Claude API (via Anthropic Messages API)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (opens at http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture

### Application Structure

The app uses Next.js 14's App Router pattern with a minimal structure:

```
app/
├── api/
│   └── analyze/
│       └── route.js          # API endpoint for Claude AI interactions
├── globals.css               # Tailwind base styles
├── layout.js                 # Root layout with metadata
└── page.js                   # Main application UI (client component)
```

### Key Components

**`app/page.js`** - Single-page client component containing:
- Three input methods (tabs): paste code, fetch from GitHub, upload files
- Analysis configuration options (user stories, test cases, acceptance criteria)
- Output format selection (Markdown, JSON, Jira)
- Test framework styling (Generic, Jest, Pytest, JUnit)
- Results display with copy/download functionality
- File tree visualization for uploaded files

**`app/api/analyze/route.js`** - Server-side API route that:
- Accepts: `apiKey`, `prompt`, `model`, `maxTokens`
- Proxies requests to Anthropic Messages API
- Handles error responses (rate limiting, invalid keys, etc.)
- Returns Claude's response with token usage

### Data Flow

1. User inputs code via paste/GitHub/upload
2. User configures analysis options and provides Claude API key
3. Frontend constructs prompt based on configuration
4. Request sent to `/api/analyze` endpoint
5. Backend proxies to Anthropic API with user's key
6. Response parsed and displayed in tabbed output sections
7. User can copy or download generated QA artifacts

### File Upload System

- Supports common code file types: `.js`, `.ts`, `.py`, `.java`, `.go`, etc.
- Handles `.zip` archives by extracting and filtering valid files
- Excludes common non-code directories: `node_modules/`, `.git/`, `__pycache__/`
- 500KB per-file size limit to prevent memory issues
- Max 50 files from GitHub repositories
- Displays files in an interactive tree structure with expand/collapse

### API Key Handling

The application **never stores** API keys:
- Keys are only held in React state during the session
- Sent directly to backend, which forwards to Anthropic
- No persistence, logging, or server-side storage
- User-provided keys are used for single requests only

## Important Patterns

### Client-Side State Management

All state is managed via React `useState` hooks in the main `page.js` component. No external state management library is used.

### Input Truncation

Content longer than 100,000 characters is truncated before sending to the API to prevent excessive token usage.

### GitHub Fetching

Uses public GitHub API endpoints:
- Tree API to list repository files
- Raw content API to fetch file contents
- No authentication required (public repos only)
- Branch selection supported (defaults to `main`)

### Prompt Construction

The app constructs prompts dynamically based on:
- Selected analysis options (user stories, tests, criteria)
- Output format preference
- Test framework style
- Optional edge cases and security considerations
- Additional user-provided context

## Configuration Files

- **`next.config.js`**: Minimal Next.js config with `reactStrictMode: true`
- **`tailwind.config.js`**: Standard Tailwind setup scanning `app/**` directory
- **`postcss.config.js`**: Standard PostCSS with Tailwind and Autoprefixer

## Prompt System

The app uses a modular prompt construction system:
- **Templates**: Adapted from Codebase-Digest (MIT license) in `prompts/templates/`
- **Builder**: `lib/promptBuilder.js` combines templates based on user configuration
- **Dynamic**: Prompts adjust based on outputFormat, testFramework, edgeCases, securityTests options

Key templates:
- `learning_user_story_reconstruction.md` - User story generation
- `testing_unit_test_generation.md` - Test case generation
- `performance_test_scenario_generation.md` - Performance test scenarios
- `quality_documentation_generation.md` - Acceptance criteria

The prompt builder:
1. Loads templates from filesystem
2. Combines them based on config options
3. Adds framework-specific instructions (Jest, Pytest, JUnit, Generic)
4. Formats output instructions (Markdown, JSON, Jira)
5. Includes edge cases and security tests when requested

## Model Usage

The app is hardcoded to use `claude-sonnet-4-20250514` model. This is the latest Claude Sonnet 4 model available when the app was created.

## Privacy & Security

- API keys are client-side only and never stored
- No user data persistence
- Direct API calls to Anthropic (no intermediary storage)
- Files processed in-memory only
- All processing happens in real-time with no logging

## ES Module Configuration

The project uses ES modules (`"type": "module"` in package.json) to enable modern JavaScript features in the prompt builder. Config files use `.cjs` extension to maintain CommonJS compatibility with Next.js tooling.
