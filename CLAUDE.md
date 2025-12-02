# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Codebase QA Analyzer** - A Next.js web application that uses Claude AI to analyze codebases and generate QA artifacts (user stories, test cases, and acceptance criteria). The app supports multiple input methods: direct code pasting, GitHub repository fetching, and file uploads (including .zip files).

**Current Status:** Navigation & History System Complete. User analyses are persisted and accessible via dedicated History page.

**Live App:** https://orizon-qa.vercel.app

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (not TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **File Processing**: JSZip for handling .zip archives
- **AI**: Claude API (via Anthropic Messages API) + LM Studio (local LLMs)
- **Database**: PostgreSQL (Vercel Postgres in production)
- **Cache**: Vercel KV/Redis (for GitHub fetches and analysis results)
- **Authentication**: Next-Auth v4 (JWT sessions)
- **Email**: Resend (verification codes, password resets)
- **Encryption**: AES-256-GCM (for API key storage)

## Development Commands

```bash
# Install dependencies
npm install

# Start local databases (PostgreSQL + Redis)
docker-compose up -d

# Run development server (opens at http://localhost:3000)
npm run dev

# Initialize database schema (first time only)
# Visit: http://localhost:3000/api/db/init

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Stop local databases
docker-compose down
```

**Note**: Local development requires Docker for PostgreSQL and Redis. See `DATABASE.md` for full setup instructions.

## Git Auto-Commit & Commit Strategy

**IMPORTANT**: This repository has automatic git commits enabled as a safety net, but meaningful commit messages are still expected.

**Auto-commit behavior**:
- Files are auto-committed periodically (messages like "Auto-commit: YYYY-MM-DD HH:MM:SS")
- Use `git log --oneline -5` to check if changes were already auto-committed
- If `git status` shows clean, changes are already committed

**Best practice - Create meaningful commits**:
- **Always prefer descriptive commit messages** over relying on auto-commits
- Commit after completing a logical unit of work (feature, fix, refactor)
- Write clear commit messages that explain WHAT changed and WHY
- Examples of good commit messages:
  - "Add RepositorySelector component with search and favorites"
  - "Fix OAuth token refresh for expired GitHub connections"
  - "Refactor IndexedDB layer to support branch caching"

**When auto-commit is acceptable**:
- Small work-in-progress saves during active development
- Quick typo fixes or minor adjustments
- When you'll squash commits later before PR

**Workflow**:
1. Make changes
2. Check `git status` - if changes are staged/unstaged, create a proper commit
3. If already auto-committed but message is important, use `git commit --amend` to improve the message (only if not pushed)
4. Push with `git push` when ready

## Architecture

### Application Structure

The app uses Next.js 14's App Router pattern with a modular component architecture:

```
app/
├── api/
│   ├── analyze/route.js         # API endpoint for Claude AI interactions
│   ├── auth/                    # Authentication endpoints
│   │   ├── [...nextauth]/route.js
│   │   ├── signup/route.js
│   │   ├── verify-email/route.js
│   │   ├── resend-code/route.js
│   │   ├── forgot-password/route.js
│   │   └── reset-password/route.js
│   ├── db/init/route.js         # Database initialization
│   └── user/settings/route.js   # User settings API
├── components/
│   ├── auth/                    # Authentication forms
│   │   ├── SignupForm.jsx
│   │   ├── LoginForm.jsx
│   │   ├── VerificationCodeInput.jsx
│   │   ├── ForgotPasswordForm.jsx
│   │   └── ResetPasswordForm.jsx
│   ├── layout/                  # Layout components (NEW)
│   │   ├── Sidebar.jsx          # Left navigation sidebar
│   │   └── AppLayout.jsx        # Layout wrapper with sidebar
│   ├── ui/                      # UI component library (30+ components)
│   ├── config/                  # Configuration components
│   │   ├── ApiKeyInput.jsx
│   │   └── ConfigSection.jsx
│   ├── input/                   # Input method components
│   │   ├── FileTree.jsx
│   │   └── InputSection.jsx
│   ├── output/                  # Output display components
│   │   └── OutputSection.jsx
│   └── shared/                  # Reusable UI components
│       ├── Alert.jsx
│       ├── Header.jsx
│       ├── HelpModal.jsx
│       └── Tab.jsx
├── hooks/                    # Custom React hooks
│   ├── useAnalysis.js
│   ├── useFileUpload.js
│   └── useGitHubFetch.js
├── dashboard/page.js         # Main app (protected, was root page)
├── history/                  # Analysis history (NEW)
│   ├── page.js               # History list with search/filter
│   └── [id]/page.js          # Individual analysis detail
├── login/page.js             # Login page
├── signup/page.js            # Signup page
├── verify-email/page.js      # Email verification
├── forgot-password/page.js   # Password reset request
├── reset-password/page.js    # Password reset form
├── settings/page.js          # User settings (protected)
├── globals.css               # Tailwind base styles
├── layout.js                 # Root layout with metadata
└── page.js                   # Landing page (public)
```

### Key Components

**`app/page.js`** - Main orchestrator component (183 lines) that:
- Manages global state and coordinates between components
- Uses custom hooks for business logic (analysis, file upload, GitHub fetch)
- Renders modular components for different UI sections
- Maintains clean separation of concerns

**Components:**
- `Header` & `HelpModal` - App branding and user guidance
- `Alert` - Error and success notifications
- `InputSection` - Three input methods (paste, GitHub, file upload)
- `ConfigSection` - Analysis options and output format selection
- `ApiKeyInput` - API key configuration
- `OutputSection` - Results display with copy/download functionality
- `Tab` & `FileTree` - Reusable UI elements

**Custom Hooks:**
- `useAnalysis` - Handles API calls and result management
- `useFileUpload` - File processing and upload handling
- `useGitHubFetch` - GitHub repository fetching logic

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

The application supports **two methods** for API keys:
1. **Saved in Settings** (Recommended):
   - Keys encrypted with AES-256-GCM before database storage
   - Only decrypted when needed for analysis
   - Auto-loaded in dashboard for convenience
   - User can update/delete anytime
2. **Per-Request Input**:
   - Keys held only in React state during the session
   - Sent directly to backend, which forwards to Anthropic
   - No persistence, logging, or server-side storage
   - User-provided keys are used for single requests only

## Important Patterns

### UI Layout Guidelines

**CRITICAL**: Do NOT use `max-w-*` (max-width) classes on form pages or content areas unless explicitly required for specific design purposes like centering narrow content (e.g., login forms).

**Why**: Form pages need full width to accommodate complex forms with multiple columns, steps, and detailed inputs. Restricting width to `max-w-4xl` (896px) or similar creates unnecessary horizontal scrolling and poor UX on larger screens.

**Examples**:
- ❌ BAD: `<div className="max-w-4xl mx-auto bg-slate-800 ...">` on form pages
- ✅ GOOD: `<div className="bg-slate-800 border border-slate-700 rounded-lg p-6">` on form pages
- ✅ GOOD: `<div className="max-w-md mx-auto">` on login/signup pages (narrow forms that should be centered)

**Where to apply full-width**:
- Test case creation/edit pages
- Requirement creation/edit pages
- Project creation/edit pages
- Any page with complex forms, multi-column layouts, or detailed inputs

**Where max-width is acceptable**:
- Login/signup forms (narrow, centered)
- Simple single-column forms with few fields
- Landing page content sections

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

## Current Implementation Status

### Completed ✅
- **Phase 1:** Critical bug fix
  - Prompt construction system working
  - API route refactored
  - App deployed and functional
  - Templates from Codebase-Digest integrated

- **Phase 2:** Component refactoring ✅
  - 9 components extracted and organized
  - 3 custom hooks created
  - page.js reduced from 715 → 183 lines (74% reduction)
  - Clean separation of concerns achieved
  - All functionality working and tested

- **Phase 4:** Authentication system ✅
  - User signup with email verification (6-digit code)
  - Login with Next-Auth v4 (JWT sessions, 30-day expiration)
  - Password reset flow (forgot/reset with tokens)
  - User settings page with encrypted API key storage
  - Protected routes with middleware
  - Dashboard with auto-loaded API keys
  - Audit logging for security events
  - Landing page for unauthenticated users
  - Database schema: users, sessions, analyses, audit_logs
  - Production build passing (20 routes)

### In Progress 🚧
- **Phase 4.5:** User-linked analysis features
  - Link analyses to user accounts (database ready, not connected)
  - Analysis history page
  - User profile management

### Planned 📋
- **Phase 5:** Advanced features (export to Jira, team accounts, billing)
- **Phase 6:** CLI development (npx command)
- **Phase 7:** Integrations (GitHub Actions, Jira Cloud app, CI/CD webhooks)

**Note**: Phase 3 (session-based features) was SKIPPED. Went directly from Phase 2 to Phase 4 for database-backed user features.

See `PROJECT_STATUS.md` and `TODO.md` for detailed status and action items.
