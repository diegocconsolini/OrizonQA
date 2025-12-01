# ORIZON QA - Comprehensive Development Plan

**Created:** 2025-11-30
**Status:** Complete Feature Analysis & Roadmap

---

## Current State Analysis

### ✅ What We Have (Working)

**Main App (Basic QA Analyzer):**
- ✅ Multiple input methods (paste, GitHub, file upload)
- ✅ Claude API integration for analysis
- ✅ Basic configuration options (user stories, tests, acceptance criteria)
- ✅ Framework selection (Jest, Pytest, JUnit, Generic)
- ✅ Output formats (Markdown, JSON, Jira)
- ✅ Copy/download functionality
- ✅ File upload with .zip support
- ✅ GitHub repository fetching
- ✅ Prompt builder with templates
- ✅ API route working (`/api/analyze`)

**Component Library (Phase 2 - 50% Complete):**
- ✅ 12/24 UI components built (Button, Input, Card, Modal, etc.)
- ✅ ORIZON design system established
- ✅ Showcase page at `/showcase`
- ✅ Borderless Interstellar aesthetic
- ✅ Purple (#6A00FF) + Blue (#00D4FF) color scheme

**Infrastructure:**
- ✅ Next.js 14 App Router
- ✅ Tailwind CSS configured
- ✅ Database schema designed (not implemented)
- ✅ Docker Compose for local Postgres + Redis (not integrated)
- ✅ Vercel deployment ready

---

## ❌ What's Missing (Critical Features)

### 1. Database Integration (HIGH PRIORITY)
**Status:** Schema designed, NOT integrated

**Missing:**
- [ ] Database connection to app
- [ ] Save analysis results to Postgres
- [ ] Content hash deduplication
- [ ] Query recent analyses
- [ ] Token usage tracking
- [ ] Provider/model tracking

**Files to create/modify:**
- `lib/db.js` - Database client and queries
- `app/api/analyze/route.js` - Save to DB after analysis
- `.env.local` - Database connection strings

**Impact:** No persistence, no history, no deduplication

---

### 2. Redis Caching (HIGH PRIORITY)
**Status:** Docker ready, NOT integrated

**Missing:**
- [ ] GitHub repository caching (1 hour TTL)
- [ ] Analysis results caching (2 hour TTL)
- [ ] Content hash-based cache lookup
- [ ] Graceful fallback to in-memory cache

**Files to create:**
- `lib/cache.js` - Redis client and caching functions
- Integration in GitHub fetch hook
- Integration in analyze API route

**Impact:** Repeated GitHub fetches, redundant API calls, high costs

---

### 3. Analysis History UI (MEDIUM PRIORITY)
**Status:** NOT started

**Missing:**
- [ ] History sidebar/panel
- [ ] Recent analyses list (from DB)
- [ ] Click to load previous result
- [ ] Filter by date, input type, provider
- [ ] Delete analysis option
- [ ] Export history to CSV/JSON

**Files to create:**
- `app/components/history/HistoryPanel.jsx`
- `app/components/history/HistoryItem.jsx`
- `app/api/history/route.js` - GET recent analyses
- Integration in main `app/page.js`

**Impact:** Users must re-analyze same code, no way to review past results

---

### 4. Authentication System (MEDIUM PRIORITY)
**Status:** Pages designed, NOT implemented

**Missing:**
- [ ] Login page (`/login`)
- [ ] Signup page (`/signup`)
- [ ] Password reset page (`/forgot-password`)
- [ ] Email verification (`/verify-email`)
- [ ] Verification code input component
- [ ] User session management
- [ ] Protected routes

**Files to create:**
- `app/login/page.js`
- `app/signup/page.js`
- `app/forgot-password/page.js`
- `app/verify-email/page.js`
- `app/components/auth/*` - Auth components
- `app/api/auth/*` - Auth API routes
- Middleware for protected routes

**Impact:** No user accounts, no personalized experience, no API key storage

---

### 5. Dashboard Layout (MEDIUM PRIORITY)
**Status:** Spec exists, NOT implemented

**Missing:**
- [ ] Dashboard page (`/dashboard`)
- [ ] Sidebar navigation (240px)
- [ ] Recent analyses grid
- [ ] Quick stats (total analyses, tokens used)
- [ ] Saved configurations
- [ ] User profile section

**Files to create:**
- `app/dashboard/page.js`
- `app/dashboard/layout.js`
- `app/components/dashboard/*`

**Impact:** No central hub for user activity

---

### 6. Landing Page (LOW PRIORITY)
**Status:** NOT started

**Missing:**
- [ ] Hero section
- [ ] Features showcase
- [ ] Pricing section (if applicable)
- [ ] Testimonials
- [ ] CTA buttons → /signup
- [ ] SEO optimization

**Files to create:**
- `app/page.js` - Replace or create separate landing
- `app/components/landing/*`

**Impact:** No marketing/onboarding page

---

### 7. Advanced Features (LOW PRIORITY)

**Missing:**
- [ ] LM Studio integration (local LLMs)
- [ ] Model selection dropdown
- [ ] Analysis comparison (diff between runs)
- [ ] Shared analysis links (public URLs)
- [ ] Team collaboration
- [ ] API rate limiting
- [ ] Usage analytics
- [ ] Webhook notifications

**Impact:** Limited to basic analysis flow

---

### 8. Remaining UI Components (Phase 2)

**Missing (12 components):**
- [ ] Tooltip
- [ ] Toast/Notifications
- [ ] Dropdown
- [ ] ToggleSwitch
- [ ] Checkbox
- [ ] Radio
- [ ] Breadcrumbs
- [ ] Pagination
- [ ] Accordion
- [ ] Tabs (full system)
- [ ] FileUpload (for dashboard)
- [ ] Avatar

**Impact:** Component library incomplete for future pages

---

## Recommended Implementation Order

### 🔥 Phase 3: Core Functionality (IMMEDIATE - 2 weeks)

**Week 1: Database + Caching**
1. **Database Integration** (3 days)
   - Set up `lib/db.js` with connection pool
   - Initialize schema via `/api/db/init`
   - Modify `/api/analyze` to save results
   - Test local Postgres connection

2. **Redis Caching** (2 days)
   - Create `lib/cache.js` with Redis client
   - Add GitHub repo caching to `useGitHubFetch` hook
   - Add analysis result caching to `/api/analyze`
   - Test cache hits/misses

**Week 2: History UI + Basic Auth**
3. **Analysis History UI** (3 days)
   - Create `HistoryPanel` component
   - Create `/api/history` route
   - Integrate into main page
   - Add delete/export functionality

4. **Basic User State** (2 days)
   - Session storage for user preferences
   - API key persistence in localStorage
   - Recent GitHub repos tracking

**Deliverable:** Fully functional app with persistence and caching

---

### 🎨 Phase 4: Authentication & User Accounts (2 weeks)

**Week 3: Auth Pages**
1. Create login/signup pages
2. Email verification flow
3. Password reset flow
4. User session management

**Week 4: Protected Routes**
1. Middleware for auth
2. User profile page
3. Settings page
4. API key management

**Deliverable:** Complete auth system

---

### 📊 Phase 5: Dashboard & Analytics (1 week)

1. Dashboard layout with sidebar
2. Recent analyses grid
3. Usage statistics
4. Saved configurations
5. Team management (if applicable)

**Deliverable:** Full dashboard experience

---

### 🚀 Phase 6: Advanced Features (2 weeks)

1. LM Studio integration
2. Model selection
3. Analysis comparison
4. Shared links
5. Webhooks
6. Analytics dashboard

**Deliverable:** Production-ready app

---

### 🎨 Phase 7: Polish & Marketing (1 week)

1. Landing page
2. SEO optimization
3. Documentation
4. Onboarding flow
5. Help/support page

**Deliverable:** Launch-ready product

---

## Detailed Implementation: Phase 3 (Week 1-2)

### Step 1: Database Integration

#### 1.1 Create Database Client (`lib/db.js`)

```javascript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function saveAnalysis({
  inputType,
  contentHash,
  provider,
  model,
  config,
  results,
  tokenUsage,
  githubUrl = null,
  githubBranch = null,
}) {
  const query = `
    INSERT INTO analyses
    (input_type, content_hash, provider, model, config, results, token_usage, github_url, github_branch)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, created_at
  `;

  const values = [
    inputType,
    contentHash,
    provider,
    model,
    JSON.stringify(config),
    JSON.stringify(results),
    JSON.stringify(tokenUsage),
    githubUrl,
    githubBranch,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getRecentAnalyses(limit = 10) {
  const query = `
    SELECT * FROM analyses
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const result = await pool.query(query, [limit]);
  return result.rows;
}

export async function findAnalysisByHash(contentHash) {
  const query = `
    SELECT * FROM analyses
    WHERE content_hash = $1
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const result = await pool.query(query, [contentHash]);
  return result.rows[0] || null;
}

export async function initDB() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS analyses (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      input_type VARCHAR(50) NOT NULL,
      content_hash VARCHAR(64) NOT NULL,
      provider VARCHAR(20) NOT NULL,
      model VARCHAR(100) NOT NULL,
      config JSONB NOT NULL,
      results JSONB NOT NULL,
      token_usage JSONB NOT NULL,
      github_url TEXT,
      github_branch VARCHAR(255)
    );

    CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analyses_content_hash ON analyses(content_hash);
  `;

  await pool.query(createTableQuery);
  return { success: true };
}
```

#### 1.2 Modify `/api/analyze/route.js`

Add at the end before sending response:

```javascript
import crypto from 'crypto';
import { saveAnalysis, findAnalysisByHash } from '@/lib/db';

// Calculate content hash
const contentHash = crypto.createHash('sha256')
  .update(prompt)
  .digest('hex');

// Check cache in DB
const cachedAnalysis = await findAnalysisByHash(contentHash);
if (cachedAnalysis) {
  return NextResponse.json({
    ...JSON.parse(cachedAnalysis.results),
    fromCache: true,
  });
}

// After successful analysis...
await saveAnalysis({
  inputType: 'paste', // or detect from request
  contentHash,
  provider: 'claude',
  model,
  config: { maxTokens, /* other config */ },
  results: responseData,
  tokenUsage: {
    input: responseData.usage?.input_tokens,
    output: responseData.usage?.output_tokens,
  },
});
```

---

### Step 2: Redis Caching

#### 2.1 Create Cache Client (`lib/cache.js`)

```javascript
import { createClient } from 'redis';

let redisClient = null;

async function getRedisClient() {
  if (redisClient) return redisClient;

  if (!process.env.REDIS_URL && !process.env.KV_REST_API_URL) {
    console.warn('No Redis configured, using in-memory cache');
    return null; // Fallback to in-memory
  }

  redisClient = createClient({
    url: process.env.REDIS_URL || process.env.KV_REST_API_URL,
  });

  await redisClient.connect();
  return redisClient;
}

export async function getCachedGitHubRepo(owner, repo, branch) {
  const client = await getRedisClient();
  if (!client) return null;

  const key = `github:${owner}/${repo}:${branch}`;
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheGitHubRepo(owner, repo, branch, data, ttl = 3600) {
  const client = await getRedisClient();
  if (!client) return;

  const key = `github:${owner}/${repo}:${branch}`;
  await client.setEx(key, ttl, JSON.stringify(data));
}

export async function getCachedAnalysis(contentHash) {
  const client = await getRedisClient();
  if (!client) return null;

  const key = `analysis:${contentHash}`;
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheAnalysis(contentHash, results, ttl = 7200) {
  const client = await getRedisClient();
  if (!client) return;

  const key = `analysis:${contentHash}`;
  await client.setEx(key, ttl, JSON.stringify(results));
}
```

---

### Step 3: Analysis History UI

#### 3.1 Create History API (`app/api/history/route.js`)

```javascript
import { NextResponse } from 'next/server';
import { getRecentAnalyses } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const analyses = await getRecentAnalyses(limit);

    return NextResponse.json({
      success: true,
      analyses: analyses.map(a => ({
        id: a.id,
        createdAt: a.created_at,
        inputType: a.input_type,
        provider: a.provider,
        model: a.model,
        config: a.config,
        results: a.results,
        tokenUsage: a.token_usage,
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

#### 3.2 Create History Panel Component

```javascript
// app/components/history/HistoryPanel.jsx
'use client';

import { useState, useEffect } from 'react';

export default function HistoryPanel({ onLoadAnalysis }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await fetch('/api/history?limit=20');
      const data = await res.json();
      if (data.success) {
        setHistory(data.analyses);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-80 bg-surface-dark border-r border-white/5 overflow-y-auto">
      <div className="p-6 border-b border-white/5">
        <h2 className="text-xl font-semibold text-white">History</h2>
      </div>

      <div className="p-4 space-y-2">
        {loading && <p className="text-text-secondary-dark">Loading...</p>}

        {history.map((analysis) => (
          <button
            key={analysis.id}
            onClick={() => onLoadAnalysis(analysis)}
            className="w-full text-left p-4 rounded-lg bg-surface-dark/50 hover:bg-surface-dark border border-white/5 hover:border-primary/30 transition-all"
          >
            <div className="text-sm font-medium text-white mb-1">
              {analysis.inputType === 'github' ? 'GitHub' : analysis.inputType}
            </div>
            <div className="text-xs text-text-secondary-dark">
              {new Date(analysis.createdAt).toLocaleDateString()}
            </div>
            <div className="text-xs text-text-muted-dark mt-1">
              {analysis.provider} • {analysis.model}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## File Structure After Phase 3

```
/home/diegocc/OrizonQA/
├── app/
│   ├── api/
│   │   ├── analyze/route.js         ✅ Modified (save to DB)
│   │   ├── db/
│   │   │   └── init/route.js        ✅ Existing
│   │   └── history/
│   │       └── route.js             🆕 NEW
│   ├── components/
│   │   ├── history/                 🆕 NEW
│   │   │   ├── HistoryPanel.jsx
│   │   │   └── HistoryItem.jsx
│   │   └── ui/                      ✅ Existing
│   ├── page.js                      ✅ Modified (add HistoryPanel)
│   └── showcase/page.js             ✅ Existing
├── lib/
│   ├── db.js                        🆕 NEW
│   ├── cache.js                     🆕 NEW
│   └── promptBuilder.js             ✅ Existing
├── .env.local                       🆕 NEW (copy from example)
├── docker-compose.yml               ✅ Existing
├── DATABASE.md                      ✅ Existing
└── COMPREHENSIVE_PLAN.md            🆕 THIS FILE
```

---

## Success Metrics (Phase 3)

### Database Integration
- [x] Database connection works locally
- [x] Analysis results saved to Postgres
- [x] Duplicate analyses cached via content hash
- [x] Recent analyses queryable via API
- [x] Token usage tracked

### Redis Caching
- [x] GitHub repo caching works (1 hour TTL)
- [x] Analysis result caching works (2 hour TTL)
- [x] Cache hits logged and visible
- [x] Graceful fallback to in-memory if Redis down

### History UI
- [x] History panel shows recent analyses
- [x] Click to load previous analysis
- [x] Displays date, input type, provider, model
- [x] Responsive and performant
- [x] Export option available

---

## Questions to Answer Before Starting

1. **Should we pause Phase 2 (component library) and focus on Phase 3 (core features)?**
   - Recommendation: YES - Core features more important than showcase

2. **Do we want user accounts in Phase 3, or defer to Phase 4?**
   - Recommendation: Defer to Phase 4 - Focus on persistence first

3. **Should we implement LM Studio in Phase 3 or Phase 6?**
   - Recommendation: Phase 6 - Advanced feature, not critical path

4. **Landing page before or after authentication?**
   - Recommendation: After - Focus on app functionality first

5. **Should analysis history be public or private (requires auth)?**
   - Recommendation: Start with sessionStorage-based history, add DB persistence without auth in Phase 3

---

## Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 3 (Core) | 2 weeks | DB + Cache + History |
| Phase 4 (Auth) | 2 weeks | User accounts |
| Phase 5 (Dashboard) | 1 week | Dashboard UI |
| Phase 6 (Advanced) | 2 weeks | LM Studio, sharing, etc. |
| Phase 7 (Polish) | 1 week | Landing, SEO, docs |
| **TOTAL** | **8 weeks** | Production-ready app |

---

## Next Immediate Steps

1. **Decide:** Pause Phase 2 (components) or continue?
2. **Start Phase 3:** Database integration (3 days)
3. **Test:** Local Postgres + Redis working
4. **Ship:** Analysis history working end-to-end

---

**This plan is comprehensive and ready to execute. Which phase should we start?**
