# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Codebase QA Analyzer** - A Next.js web application that uses Claude AI to analyze codebases and generate QA artifacts (user stories, test cases, and acceptance criteria). The app supports multiple input methods: direct code pasting, GitHub repository fetching, and file uploads (including .zip files).

**Current Status:** Full-featured QA platform with projects, requirements, test management, multi-provider integrations (GitHub/GitLab/Azure DevOps), OAuth authentication, and browser-based test execution.

**Live App:** https://orizon-qa.vercel.app

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (not TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **File Processing**: JSZip for handling .zip archives
- **AI**: Claude API (via Anthropic Messages API) + LM Studio (local LLMs)
- **Test Execution**: WebContainers API (browser-based Node.js for Jest/Vitest/Mocha)
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

# Run development server (opens at http://localhost:3033)
PORT=3033 npm run dev

# Initialize database schema (first time only)
# Visit: http://localhost:3033/api/db/init

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

## ⚠️ Git Auto-Commit Behavior (READ THIS FIRST)

**CRITICAL**: This repository has AUTOMATIC git commits enabled. Before making any commit:

```bash
# ALWAYS check status first
git status
git log --oneline -5
```

**Auto-commit behavior**:
- A background process auto-commits files periodically
- Messages appear as "Auto-commit: YYYY-MM-DD HH:MM:SS"
- If `git status` shows clean working tree, your changes were ALREADY auto-committed
- **Do NOT create duplicate commits** - check first!

**Before committing**:
1. Run `git status` - if clean, changes are already committed
2. Run `git log --oneline -3` - see if auto-commit captured your changes
3. Only create a new commit if there are unstaged/staged changes

**When to create manual commits**:
- After completing a logical unit of work (feature, fix, refactor)
- When you need a descriptive message for the change
- Before pushing to remote

**Good commit messages**:
- "Add RepositorySelector component with search and favorites"
- "Fix OAuth token refresh for expired GitHub connections"
- "Refactor IndexedDB layer to support branch caching"

**If changes were auto-committed but need better message**:
```bash
# Only if NOT pushed yet:
git commit --amend -m "Better descriptive message"
```

## Background Process Management

**IMPORTANT**: When running long-lived processes like dev servers in background mode:

1. **Track shell IDs**: Remember the shell ID when starting a background process
2. **Kill before restart**: Always kill previous background shells before starting new ones
3. **Single instance**: Only have ONE dev server running at a time

**Why this matters**: Each background shell adds system reminders to every message (~150 chars per shell). Having 20+ zombie shells consumes ~3000 chars per message, rapidly filling context.

**Correct pattern**:
```bash
# Kill previous dev server first
fuser -k 3033/tcp 2>/dev/null
# Then start new one
PORT=3033 npm run dev
```

**Wrong pattern**:
```bash
# Starting multiple dev servers without cleanup - DON'T DO THIS
PORT=3033 npm run dev &  # Shell 1
PORT=3033 npm run dev &  # Shell 2 (zombie)
PORT=3033 npm run dev &  # Shell 3 (zombie)
```

## Architecture

### Application Structure

The app uses Next.js 14's App Router pattern with a modular component architecture:

```
app/
├── api/
│   ├── analyze/route.js              # Claude AI analysis
│   ├── analyze-stream/route.js       # Streaming analysis with SSE
│   ├── analyze-multipass/route.js    # Multi-pass chunked analysis
│   ├── ai/models/route.js            # Available AI models
│   ├── auth/                         # Authentication
│   │   ├── [...nextauth]/route.js    # NextAuth handler (GitHub OAuth + Credentials)
│   │   ├── signup/route.js
│   │   ├── verify-email/route.js
│   │   ├── forgot-password/route.js
│   │   ├── reset-password/route.js
│   │   ├── device/route.js           # Device flow for CLI
│   │   └── logout/route.js
│   ├── integrations/                 # External service integrations
│   │   ├── github/                   # GitHub integration
│   │   │   ├── connect/route.js
│   │   │   ├── disconnect/route.js
│   │   │   ├── sync/route.js
│   │   │   └── webhook/route.js
│   │   ├── gitlab/                   # GitLab integration
│   │   │   ├── connect/route.js
│   │   │   ├── disconnect/route.js
│   │   │   ├── sync/route.js
│   │   │   └── webhook/route.js
│   │   └── azure-devops/             # Azure DevOps integration
│   │       ├── connect/route.js
│   │       ├── disconnect/route.js
│   │       ├── sync/route.js
│   │       └── webhook/route.js
│   ├── oauth/github/                 # GitHub OAuth for private repos
│   │   ├── connect/route.js
│   │   ├── callback/route.js
│   │   ├── repositories/route.js
│   │   ├── tree/route.js
│   │   ├── content/route.js
│   │   └── revoke/route.js
│   ├── projects/                     # Project management
│   │   ├── route.js                  # List/create projects
│   │   └── [id]/
│   │       ├── route.js              # Get/update/delete project
│   │       ├── requirements/         # Requirements management
│   │       │   ├── route.js
│   │       │   └── [reqId]/
│   │       │       ├── route.js
│   │       │       └── tests/route.js
│   │       ├── tests/                # Test case management
│   │       │   ├── route.js
│   │       │   ├── bulk-import/route.js
│   │       │   └── [testId]/route.js
│   │       └── coverage/route.js     # Coverage matrix
│   ├── execute-tests/                # Test execution
│   │   ├── route.js
│   │   └── [id]/
│   │       ├── route.js
│   │       └── stream/route.js
│   ├── todos/                        # Todo management
│   │   ├── route.js
│   │   ├── [id]/route.js
│   │   └── bulk/route.js
│   ├── user/                         # User APIs
│   │   ├── settings/route.js
│   │   ├── profile/route.js
│   │   ├── analytics/route.js
│   │   ├── analyses/route.js
│   │   ├── shares/route.js
│   │   └── delete/route.js
│   ├── shared/[token]/route.js       # Public shared analysis
│   └── db/                           # Database migrations
│       ├── init/route.js
│       ├── migrate-oauth/route.js
│       ├── migrate-todos/route.js
│       └── migrate-test-execution/route.js
│
├── analyze/                          # Analysis page
│   ├── page.js
│   └── components/
│       ├── RepositorySelector.jsx    # Search & select repos with favorites
│       ├── BranchSelector.jsx        # Branch selection
│       ├── FileFolderPicker.jsx      # Select specific files/folders
│       ├── SmartConfigPanel.jsx      # AI-powered config suggestions
│       ├── OutputSettingsPanel.jsx   # Format & framework selection
│       ├── AnalysisProgress.jsx      # Progress with stages
│       ├── ChunkProgress.jsx         # Multi-pass chunk progress
│       ├── TokenUsageBar.jsx         # Token consumption display
│       ├── LocalCachePanel.jsx       # IndexedDB cache management
│       └── ...more
│
├── projects/                         # Project management
│   ├── page.js                       # Project list
│   ├── new/page.js                   # Create project
│   └── [id]/
│       ├── page.js                   # Project dashboard
│       ├── requirements/             # Requirements
│       │   ├── page.js
│       │   ├── new/page.js
│       │   └── [reqId]/page.js
│       ├── tests/                    # Test cases
│       │   ├── page.js
│       │   ├── new/page.js
│       │   └── [testId]/page.js
│       ├── coverage/page.js          # Coverage matrix
│       └── settings/integrations/page.js  # Project integrations
│
├── dashboard/page.js                 # Analytics dashboard
├── history/                          # Analysis history
│   ├── page.js
│   └── [id]/page.js
├── profile/page.js                   # User profile
├── shares/page.js                    # Share link management
├── settings/page.js                  # User settings
├── todos/page.js                     # Todo list
├── shared/[token]/page.js            # Public shared view
│
├── components/
│   ├── analyze/                      # 15+ analyze components
│   ├── dashboard/                    # KPICard, UsageChart, ActivityHeatmap, etc.
│   ├── auth/                         # Auth forms
│   ├── layout/                       # Sidebar, AppLayout
│   ├── todos/                        # Todo components
│   ├── settings/                     # GitHubConnectionSection, etc.
│   ├── modals/                       # ImportTestsModal, etc.
│   └── ui/                           # 25+ reusable UI components
│
├── hooks/
│   ├── useAnalysis.js                # Basic analysis
│   ├── useAnalysisStream.js          # Streaming analysis with SSE
│   ├── useFileUpload.js              # File upload handling
│   ├── useGitHubFetch.js             # Public GitHub fetch
│   ├── useRepositories.js            # OAuth repo management
│   ├── useIndexedDB.js               # Local caching
│   ├── useLMStudio.js                # Local LLM integration
│   ├── useTestExecution.js           # Test execution
│   └── useTodos.js                   # Todo management
│
└── lib/indexedDB.js                  # IndexedDB utilities
```

### Key Features

**Projects & Requirements System:**
- Create projects with metadata (name, description, repo URL)
- Add requirements (user stories) with priority and status
- Create test cases linked to requirements
- Coverage matrix showing requirement-to-test traceability
- Bulk import tests from analysis results
- Project-level integrations with external services

**Multi-Provider Integrations:**
- **GitHub**: Connect repos, sync issues, receive webhooks
- **GitLab**: Connect projects, sync issues, receive webhooks
- **Azure DevOps**: Connect projects, sync work items, receive webhooks
- Per-project integration configuration
- Encrypted token storage

**GitHub OAuth for Private Repos:**
- Connect GitHub account to access private repositories
- Browse repositories with search and favorites
- Select specific branches
- Pick files/folders for analysis
- Revoke access anytime

**Output Formats (lib/outputFormats.js):**
- **Documentation**: Markdown, HTML
- **Data Export**: JSON, YAML, CSV
- **Test Tools**: Jira/Xray JSON, TestRail CSV, Azure Test Plans XML
- **BDD**: Gherkin/Cucumber feature files

**Analysis Modes:**
- Basic single-pass analysis
- Streaming analysis with real-time SSE output
- Multi-pass chunked analysis for large codebases

**Dashboard Analytics:**
- KPI cards (analyses, tokens, tests)
- Usage charts over time
- Activity heatmap
- Recent analyses list

**Custom Hooks:**
- `useAnalysis` - Basic API calls
- `useAnalysisStream` - SSE streaming analysis
- `useFileUpload` - File processing
- `useGitHubFetch` - Public GitHub fetch
- `useRepositories` - OAuth repo management with favorites
- `useIndexedDB` - Local caching for offline support
- `useLMStudio` - Local LLM integration
- `useTestExecution` - Browser-based test execution
- `useTodos` - Persistent todo management

### Data Flow

1. User inputs code via paste/GitHub/upload
2. User configures analysis options and provides Claude API key
3. Frontend constructs prompt based on configuration
4. Request sent to `/api/analyze` endpoint
5. Backend proxies to Anthropic API with user's key
6. Response parsed and displayed in tabbed output sections
7. User can copy or download generated QA artifacts
8. **NEW**: User can execute generated tests directly in browser

### Test Execution System

Browser-based test execution using WebContainers API. Tests run entirely in the browser without server infrastructure.

**Architecture:**
```
┌────────────────────────────────────────────────────────────┐
│                      Browser (Client)                       │
├────────────────────────────────────────────────────────────┤
│  ExecuteButton → ExecutionModal → useTestExecution hook    │
│                          ↓                                  │
│  POST /api/execute-tests → Get executionId + streamUrl     │
│                          ↓                                  │
│  SSE Connection: /api/execute-tests/[id]/stream            │
│                          ↓                                  │
│  WebContainer (in-browser Node.js)                         │
│  ├── Mount test files                                       │
│  ├── Install dependencies (jest/vitest/mocha)             │
│  ├── Run tests                                             │
│  └── Stream output via SSE                                 │
└────────────────────────────────────────────────────────────┘
```

**Key Components:**
- `app/execute/components/ExecuteButton.jsx` - Trigger button with loading states
- `app/execute/components/ExecutionModal.jsx` - Live progress and results display
- `app/hooks/useTestExecution.js` - State management hook with SSE connection

**Test Execution Libraries:**
- `lib/testExecution/webContainerRunner.js` - WebContainer orchestration
- `lib/testExecution/resultParser.js` - Parse Jest/Vitest/Mocha output
- `lib/testExecution/testValidator.js` - Syntax validation and framework detection

**API Endpoints:**
- `POST /api/execute-tests` - Start execution, returns executionId
- `GET /api/execute-tests/[id]` - Fetch execution status/results
- `GET /api/execute-tests/[id]/stream` - SSE stream for real-time updates
- `PATCH /api/execute-tests/[id]` - Cancel execution
- `DELETE /api/execute-tests/[id]` - Remove execution record

**Database Tables (PostgreSQL):**
Core tables (lib/db.js):
- `users` - User accounts with encrypted API keys
- `sessions` - NextAuth sessions
- `analyses` - Analysis history with results
- `audit_logs` - Security event logging
- `todos` - Persistent todo list
- `oauth_connections` - GitHub OAuth tokens (encrypted)

Test execution (lib/db.js):
- `targets` - Execution scope (repo, project)
- `test_executions` - Execution records
- `test_results` - Individual test results
- `execution_credits` - Future billing support

Projects system (lib/db-*.js):
- `projects` - Project metadata
- `requirements` - User stories/requirements
- `test_cases` - Test case definitions
- `test_suites` - Test suite groupings
- `test_coverage` - Requirement-to-test mapping

**Supported Frameworks:**
- Jest (auto-detected via `describe/it/test/expect`)
- Vitest (detected via vitest imports)
- Mocha (detected via mocha imports or `describe/it` without Jest)

**Execution Status Flow:**
```
IDLE → STARTING → BOOTING → MOUNTING → INSTALLING → RUNNING → COMPLETE/FAILED/CANCELLED
```

**Security:**
- Test code validated with Acorn AST parser
- Blocked patterns: `process.exit`, `child_process`, `eval`, `fs.*`, `vm`, `os`
- Runs in isolated WebContainer sandbox

### Todos System

Persistent todo list that survives across browser sessions and user logins.

**Features:**
- Create, edit, delete todos with title, description, priority, due date, tags
- Status tracking: pending → in_progress → completed
- Priority levels: low (green), medium (yellow), high (red)
- Subtasks support with parent-child relationships
- Due date with overdue highlighting
- Filter by status, priority, search
- Bulk operations (reorder, delete, update status)
- Statistics dashboard (total, pending, completed, overdue)

**Database Table:**
```sql
todos (
  id, user_id, title, description, status, priority,
  due_date, tags[], parent_id, position,
  created_at, updated_at, completed_at
)
```

**API Endpoints:**
- `GET /api/todos` - List todos with filters (status, priority, tag, search)
- `POST /api/todos` - Create todo
- `GET /api/todos/[id]` - Get single todo with subtasks
- `PATCH /api/todos/[id]` - Update todo
- `DELETE /api/todos/[id]` - Delete todo (cascades to subtasks)
- `POST /api/todos/bulk` - Bulk operations (reorder, updateStatus, delete)

**Key Components:**
- `app/components/todos/TodoList.jsx` - Main container with filters and stats
- `app/components/todos/TodoItem.jsx` - Single todo row with inline edit
- `app/components/todos/TodoForm.jsx` - Create/edit form with priority/date
- `app/components/todos/TodoFilters.jsx` - Status tabs, priority dropdown, search
- `app/components/todos/TodoStats.jsx` - Statistics cards with completion rate

**React Hook (`useTodos`):**
- Optimistic updates for instant UI feedback
- Auto-refetch on filter changes
- Computed values: pendingTodos, completedTodos, overdueTodos, todosByPriority

**Migration:**
```bash
# Run once to create todos table
GET /api/db/migrate-todos
```

### File Upload System

- Supports common code file types: `.js`, `.ts`, `.py`, `.java`, `.go`, etc.
- Handles `.zip` archives by extracting and filtering valid files
- Excludes common non-code directories: `node_modules/`, `.git/`, `__pycache__/`
- 500KB per-file size limit to prevent memory issues
- Max 50 files from GitHub repositories
- Displays files in an interactive tree structure with expand/collapse

### API Key & AI Configuration

**IMPORTANT**: AI provider settings are managed in TWO places:
1. **Settings Page (`/settings`)** - For saving encrypted API keys (recommended)
2. **Analyze Page (`/analyze`) Configure tab** - For per-session configuration

The application supports **two methods** for API keys:
1. **Saved in Settings** (Recommended):
   - Navigate to `/settings` → Integrations tab
   - Keys encrypted with AES-256-GCM before database storage
   - Only decrypted when needed for analysis
   - Auto-loaded in Analyze page for convenience
   - User can update/delete anytime
2. **Per-Session Input** (on Analyze page):
   - Keys held only in React state during the session
   - Sent directly to backend, which forwards to Anthropic
   - No persistence, logging, or server-side storage
   - User-provided keys are used for single requests only

**AI Providers supported**:
- **Claude AI** (Anthropic) - Cloud-based, requires API key
- **LM Studio** - Local LLMs, no API key needed, connects to local server

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

- **API Keys**: Stored encrypted (AES-256-GCM) in database OR per-session only
- **OAuth Tokens**: Encrypted storage for GitHub/GitLab/Azure connections
- **Passwords**: bcrypt hashed (10 rounds)
- **Sessions**: JWT tokens with 30-day expiration
- **Audit Logging**: All auth events tracked
- **Test Execution**: Sandboxed in WebContainers (no server access)
- **Files**: Processed in-memory, cached locally in IndexedDB

## ES Module Configuration

The project uses ES modules (`"type": "module"` in package.json) to enable modern JavaScript features in the prompt builder. Config files use `.cjs` extension to maintain CommonJS compatibility with Next.js tooling.

## Current Implementation Status

### Completed ✅

**Core Platform:**
- ✅ Claude AI analysis with streaming and multi-pass support
- ✅ Multiple input methods (paste, file upload, GitHub)
- ✅ 10+ output formats (Markdown, JSON, Jira, TestRail, Azure, BDD)
- ✅ Browser-based test execution (Jest, Vitest, Mocha)
- ✅ Local caching with IndexedDB
- ✅ LM Studio integration for local LLMs

**Authentication & Users:**
- ✅ Email/password signup with verification
- ✅ GitHub OAuth login
- ✅ Password reset flow
- ✅ JWT sessions (30-day expiration)
- ✅ Encrypted API key storage (AES-256-GCM)
- ✅ User profile management
- ✅ Account deletion
- ✅ Audit logging

**Projects System:**
- ✅ Project CRUD with metadata
- ✅ Requirements/user stories management
- ✅ Test case management with bulk import
- ✅ Coverage matrix (requirement-to-test traceability)
- ✅ Test suites organization

**Integrations:**
- ✅ GitHub OAuth for private repos (connect, browse, select files)
- ✅ GitHub integration (sync, webhooks)
- ✅ GitLab integration (sync, webhooks)
- ✅ Azure DevOps integration (sync, webhooks)
- ✅ Per-project integration configuration

**User Features:**
- ✅ Dashboard with analytics (KPIs, charts, heatmaps)
- ✅ Analysis history with sharing
- ✅ Share link management
- ✅ Persistent todo list
- ✅ Settings page

**Infrastructure:**
- ✅ PostgreSQL with 15+ tables
- ✅ Redis caching
- ✅ Database migrations
- ✅ 60+ API routes
- ✅ 27 pages

---

## ✅ COMPLETED: Test Execution UI

**Status**: COMPLETE
**Tracker**: `docs/TEST-EXECUTION-UI-IMPLEMENTATION.md`

### What Exists (Backend - COMPLETE)
| File | Status |
|------|--------|
| `app/api/execute-tests/route.js` | ✅ DONE |
| `app/api/execute-tests/[id]/route.js` | ✅ DONE |
| `app/api/execute-tests/[id]/stream/route.js` | ✅ DONE |
| `lib/testExecution/webContainerRunner.js` | ✅ DONE |
| `lib/testExecution/resultParser.js` | ✅ DONE |
| `lib/testExecution/testValidator.js` | ✅ DONE |
| `app/execute/components/ExecuteButton.jsx` | ✅ DONE |
| `app/execute/components/ExecutionModal.jsx` | ✅ DONE |

### Phase 1: Execute Components (5 files) ✅ COMPLETE
| File | Status |
|------|--------|
| `app/execute/components/TestSelector.jsx` | ✅ DONE |
| `app/execute/components/EnvironmentConfig.jsx` | ✅ DONE |
| `app/execute/components/ExecutionStrategy.jsx` | ✅ DONE |
| `app/execute/components/LiveProgress.jsx` | ✅ DONE |
| `app/execute/components/LogViewer.jsx` | ✅ DONE |

### Phase 2: Execute Pages (2 files) ✅ COMPLETE
| File | Status |
|------|--------|
| `app/execute/page.js` | ✅ DONE |
| `app/execute/[id]/page.js` | ✅ DONE |

### Phase 3: Report Components (4 files) ✅ COMPLETE
| File | Status |
|------|--------|
| `app/reports/[id]/components/SummaryCard.jsx` | ✅ DONE |
| `app/reports/[id]/components/TestList.jsx` | ✅ DONE |
| `app/reports/[id]/components/FailureDetails.jsx` | ✅ DONE |
| `app/reports/[id]/components/AllureReport.jsx` | ✅ DONE |

### Phase 4: Report Pages (2 files) ✅ COMPLETE
| File | Status |
|------|--------|
| `app/reports/page.js` | ✅ DONE |
| `app/reports/[id]/page.js` | ✅ DONE |

### Phase 5: Navigation Updates (3 files) ✅ COMPLETE
| File | Status |
|------|--------|
| `app/components/layout/Sidebar.jsx` - Add Execute/Reports links | ✅ DONE |
| `middleware.js` - Add protected routes | ✅ DONE |
| `app/api/execute-tests/route.js` - Add GET for list | ✅ DONE |

### Completion Summary
| Phase | Files | Done | Remaining |
|-------|-------|------|-----------|
| Phase 1 | 5 | 5 | 0 |
| Phase 2 | 2 | 2 | 0 |
| Phase 3 | 4 | 4 | 0 |
| Phase 4 | 2 | 2 | 0 |
| Phase 5 | 3 | 3 | 0 |
| **TOTAL** | **16** | **16** | **0** |

### User Flow After Completion
```
/analyze → Generate tests → Click "Execute" → /execute (configure)
→ Start → /execute/[id] (live view) → Complete → /reports/[id] (results)
→ /reports (history list)
```

### Verification Checklist
- [x] All 13 new files created
- [x] All 3 updates applied
- [x] `npm run build` passes
- [ ] Full user flow works end-to-end
- [x] Sidebar shows Execute & Reports links

---

## 🚨 ACTIVE IMPLEMENTATION: Smart Analysis Flow UX

**Status**: IN PROGRESS
**Tracker**: `docs/SMART_ANALYSIS_FLOW.md`
**Problem**: Users don't understand what inputs generate what outputs, especially for executable tests.

### Goal
Replace confusing manual file selection with guided, goal-based analysis that auto-detects tech stack and recommends what can be generated.

### Phase 1: Add Visibility (Low Risk) ✅ COMPLETE
| Task | Status |
|------|--------|
| Integrate `AnalysisPreview.jsx` into Configure tab | ✅ |
| Show "Tests will be executable" / "documentation only" | ✅ |

### Phase 2: Add Pre-Analysis (Medium Risk) ✅ COMPLETE
| Task | Status |
|------|--------|
| Fetch package.json when repo selected | ✅ |
| Create `lib/repoAnalyzer.js` (detectTechStack, detectTestFramework) | ✅ |
| Create `RepoAnalysisSummary.jsx` component | ✅ |
| Auto-suggest test framework based on detection | ✅ |

### Phase 3: Add Goal Selection (Higher Risk) ✅ COMPLETE
| Task | Status |
|------|--------|
| Create `lib/analysisGoals.js` (goal definitions) | ✅ |
| Create `GoalSelector.jsx` component | ✅ |
| Goals auto-configure files + settings | ✅ |
| Keep manual selection as "Custom" option | ✅ |

### Phase 4: Simplify UI (Optional) ✅ COMPLETE
| Task | Status |
|------|--------|
| Hide complex manual options by default | ✅ |
| Make goal-based flow the default | ✅ |
| Advanced options for power users only | ✅ |

### Key Files
- `lib/repoAnalyzer.js` - Tech stack & test framework detection
- `lib/analysisGoals.js` - Goal definitions (6 presets + custom)
- `app/analyze/components/AnalysisPreview.jsx` - Shows what will be generated
- `app/analyze/components/RepoAnalysisSummary.jsx` - Repository analysis summary
- `app/analyze/components/GoalSelector.jsx` - Goal selection UI
- `app/analyze/page.js` - Main integration point
- `docs/SMART_ANALYSIS_FLOW.md` - Original plan document

### Proposed Flow
```
Select Repo → Auto-Analyze Repo → Choose Goal → Review & Run
```

---

## 🚨 ACTIVE IMPLEMENTATION: V2 Global Assistant + Agent Testing

**Status**: IN PROGRESS
**Tracker**: `docs/V2_COMPREHENSIVE_PLAN.md`
**Summary**: `docs/V2_MASTER_SUMMARY.md`

### Overview
Transform Orizon into an AI Agent Testing Platform with:
1. Global Floating Assistant (available on all pages)
2. V2 Chat Panel Redesign (adaptive flows)
3. Agent Testing Platform (test AI agents from various frameworks)
4. Framework Integrations (Google ADK, Claude SDK, LangChain, CrewAI, AutoGen, Solace)

### Phase 0: Global Floating Assistant (~20h) 🔄 IN PROGRESS
| Task | Status |
|------|--------|
| Install Zustand for state management | ✅ |
| Create `app/stores/assistantStore.js` | ✅ |
| Create `app/providers/AssistantProvider.jsx` | ✅ |
| Create `app/hooks/usePageContext.js` | ✅ |
| Build `app/components/assistant/CollapsedButton.jsx` | ✅ |
| Build `app/components/assistant/ContextBar.jsx` | ✅ |
| Build `app/components/assistant/FloatingPanel.jsx` | ⏳ |
| Build `app/components/assistant/SidebarPanel.jsx` | ⏳ |
| Build `app/components/assistant/ChatMessages.jsx` | ⏳ |
| Build `app/components/assistant/ChatInput.jsx` | ⏳ |
| Build `app/components/assistant/FloatingAssistant.jsx` | ⏳ |
| Integrate with `AppLayout.jsx` | ⏳ |
| Add keyboard shortcuts (⌘J, Escape) | ⏳ |

### Phase 1: V2 Chat Improvements (~19h)
| Task | Status |
|------|--------|
| Fix P0 issues (reset, steps, navigation) | ⏳ |
| Implement adaptive chat flows (GitHub/Paste/Upload) | ⏳ |
| Add context bar with source info | ⏳ |
| Chat history opt-in | ⏳ |
| Integrate V2 with global assistant | ⏳ |

### Phase 2: Agent Testing Foundation (~26h)
| Task | Status |
|------|--------|
| Agent upload UI & parsing | ⏳ |
| Agent description mode | ⏳ |
| Test case generation (functional) | ⏳ |
| Basic results display | ⏳ |

### Phase 3: Framework Adapters (~36h)
| Task | Status |
|------|--------|
| LangChain adapter | ⏳ |
| CrewAI adapter | ⏳ |
| AutoGen adapter | ⏳ |
| Google ADK adapter | ⏳ |
| Claude Agent SDK adapter | ⏳ |
| Solace Agent Mesh adapter | ⏳ |

### Phase 4: Advanced Testing (~26h)
| Task | Status |
|------|--------|
| Safety/security tests | ⏳ |
| Performance benchmarks | ⏳ |
| Red team testing | ⏳ |
| Multi-run statistics | ⏳ |

### Phase 5: Integration & Polish (~18h)
| Task | Status |
|------|--------|
| LangSmith export | ⏳ |
| AutoGenBench export | ⏳ |
| Report generation (PDF) | ⏳ |
| API endpoint for CI/CD | ⏳ |

### Key Files Created
```
app/
├── stores/assistantStore.js          # Zustand global state
├── providers/AssistantProvider.jsx   # Context provider + keyboard shortcuts
├── hooks/usePageContext.js           # Pages provide context to assistant
└── components/assistant/
    ├── CollapsedButton.jsx           # Floating trigger button
    ├── ContextBar.jsx                # Page context display
    ├── FloatingPanel.jsx             # (pending)
    ├── SidebarPanel.jsx              # (pending)
    └── FloatingAssistant.jsx         # (pending)
```

---

### Remaining Work 📋

**Polish:**
- [ ] Avatar/profile picture upload
- [ ] HTML email templates
- [ ] Google OAuth

**Future:**
- [ ] CLI tool (`npx orizon-qa`)
- [ ] GitHub Action
- [ ] Team/organization accounts
- [ ] Billing system

See `PROJECT_STATUS.md` for detailed tracking.
