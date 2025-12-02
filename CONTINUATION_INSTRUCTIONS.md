# Dashboard Rebuild - Continuation Instructions

**Date:** 2025-12-02
**Status:** Phase 1 In Progress (30% complete)
**Priority:** Continue implementation

---

## Session Summary

This session accomplished:
1. Created comprehensive Dashboard rebuild plans (3 documents)
2. Identified Git integration as core differentiator
3. Started Phase 1 implementation with IndexedDB storage layer
4. Strategic decisions confirmed by user

---

## Key Strategic Decisions (CONFIRMED)

| Decision | Choice |
|----------|--------|
| Route Naming | `/dashboard` → `/analyze` (new `/dashboard` for overview) |
| Template Strategy | Hybrid (curated + reviewed user submissions) |
| Code Editor | Monaco Editor (VS Code experience) |
| Core Differentiator | **Git Integration** (repository-first UX) |
| Storage | **IndexedDB ONLY** - NO cloud storage of user code |

---

## Current Progress

### Completed (3/10 tasks)

1. **IndexedDB Storage Layer** ✅
   - File: `app/lib/indexedDB.js`
   - Database: `orizon_repository_cache`
   - Stores: repositories, files, branches, fetch_history
   - Features: save/get repos, files, branches, cleanup, stats

2. **useIndexedDB Hook** ✅
   - File: `app/hooks/useIndexedDB.js`
   - Wraps IndexedDB for React
   - Includes privacy notice helper
   - Auto-cleanup of old data (30 days)

3. **useRepositories Hook** ✅
   - File: `app/hooks/useRepositories.js`
   - GitHub OAuth integration
   - Fetch repos, branches, file trees
   - Multi-file selection with glob patterns
   - Auto-caches to IndexedDB

### Pending (7/10 tasks)

4. **RepositorySelector Component** ⏳
   - Visual repository list with search
   - Shows private/public icons
   - Favorites support
   - Cache status indicators

5. **FileFolderPicker Component** ⏳
   - Tree view with expand/collapse
   - Checkboxes for multi-select
   - "Select All Code Files" button
   - "Select by Pattern" input
   - File size and line count display

6. **Privacy Notice Component** ⏳
   - Banner: "Your Code Stays Local"
   - Clear messaging: NO cloud storage
   - Link to clear cache

7. **Update InputSection** ⏳
   - Integrate RepositorySelector
   - Integrate FileFolderPicker
   - Add privacy notice
   - Keep existing paste/upload options

8. **Create /analyze Route** ⏳
   - Copy current `/dashboard/page.js` to `/analyze/page.js`
   - Create new `/dashboard/page.js` (overview)
   - Update Sidebar navigation
   - Add redirects

9. **Monaco Editor Integration** ⏳
   - Install: `npm install @monaco-editor/react`
   - Create MonacoEditor wrapper component
   - Language auto-detection
   - Dark theme (vs-dark)

10. **End-to-End Testing** ⏳
    - Connect GitHub → Select repo → Pick files → Analyze
    - Verify IndexedDB caching works
    - Test offline access to cached repos

---

## Files Created This Session

```
app/
├── lib/
│   └── indexedDB.js           # 🆕 IndexedDB storage layer
└── hooks/
    ├── useIndexedDB.js        # 🆕 React hook for IndexedDB
    └── useRepositories.js     # 🆕 GitHub OAuth + file selection
```

---

## Planning Documents Created

| Document | Size | Purpose |
|----------|------|---------|
| `DASHBOARD_REBUILD_PLAN.md` | 24KB | Original comprehensive plan |
| `DASHBOARD_RESEARCH_ITERATION_2.md` | 38KB | Deep competitive research |
| `DASHBOARD_REBUILD_FINAL_PLAN.md` | 51KB | Final approved plan with Git focus |

---

## Critical Implementation Notes

### Privacy Requirement (MUST FOLLOW)

**All repository content must be stored in IndexedDB ONLY:**
- NO cloud storage of code
- NO uploading to ORIZON servers
- Clear privacy messaging to users
- User can clear cache anytime

### Existing OAuth Infrastructure (USE THIS)

Already built and working:
- `/lib/oauth/adapters/GitHubAdapter.js` - GitHub OAuth adapter
- `/api/oauth/github/connect/route.js` - OAuth flow
- `/api/oauth/github/repositories/route.js` - List repos
- `/api/oauth/github/callback/route.js` - OAuth callback
- `/lib/oauth/encryption.js` - Token encryption

### Next Component to Build

**RepositorySelector.jsx** should:
```jsx
<RepositorySelector
  repositories={repos}
  selectedRepo={selected}
  onSelect={handleSelect}
  onRefresh={refreshRepos}
  loading={loading}
  cachedRepos={cached}
/>
```

Features needed:
- Search/filter repos
- Private/public icons (Lock/Globe)
- Star favorites
- Cache status badge
- Last updated time
- Language indicator

---

## Code Patterns to Follow

### Component Structure
```jsx
'use client';

import { useState } from 'react';
import { Lock, Globe, Star, RefreshCw } from 'lucide-react';

export default function RepositorySelector({
  repositories,
  selectedRepo,
  onSelect,
  loading
}) {
  // Component logic
}
```

### Design System Colors
- Primary: `text-primary`, `bg-primary`
- Surface: `bg-surface-dark`, `bg-surface-hover-dark`
- Borders: `border-white/10`
- Text: `text-white`, `text-text-secondary-dark`

### File Tree Node Structure
```javascript
{
  name: 'src',
  path: 'src',
  type: 'tree',  // or 'blob' for files
  children: [...],
  sha: 'abc123',
  size: 0
}
```

---

## Resume Command

When resuming, start with:

```
Continue implementing Phase 1 of the Dashboard rebuild.

Current progress: 3/10 tasks complete (IndexedDB layer, useIndexedDB hook, useRepositories hook).

Next task: Build RepositorySelector component with visual repository list, search, favorites, and cache status indicators.

Key requirement: All code stored in IndexedDB only - NO cloud storage. Make this clear to users.
```

---

## Reference Files to Read

Before continuing, read these for context:
1. `DASHBOARD_REBUILD_FINAL_PLAN.md` - Full plan with Git integration details
2. `app/hooks/useRepositories.js` - Hook that components will use
3. `app/components/ui/Card.jsx` - UI component pattern to follow
4. `app/components/settings/GitHubConnectionSection.jsx` - Existing GitHub UI

---

## Git Status

- Branch: `main`
- Last commit: `978759c` - Add IndexedDB storage layer and repository hooks
- Remote: Up to date with `origin/main`

---

**Next Action:** Build RepositorySelector component
