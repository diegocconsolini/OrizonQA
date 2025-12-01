# Next Steps - Phase 4.5: User-Linked Analysis Features

**Updated**: 2025-11-30
**Current Phase**: Phase 4 Complete ✅
**Next Phase**: Phase 4.5 (User Integration)

---

## What Just Finished ✅

**Phase 4: Authentication System (COMPLETE)**
- ✅ Full authentication flow (signup, login, logout)
- ✅ Email verification with 6-digit codes
- ✅ Password reset functionality
- ✅ User settings page with encrypted API key storage
- ✅ Protected routes via middleware
- ✅ Dashboard integration with auto-loaded settings
- ✅ Landing page for unauthenticated users
- ✅ Database schema with 4 tables
- ✅ Production build passing (20 routes)

---

## Critical Issue ⚠️

**Analyses are NOT linked to user accounts!**

The database has everything ready:
- `analyses` table has `user_id` column
- Users can save API keys in settings
- Authentication works perfectly

**BUT**: When users run analyses, the `user_id` is NOT being saved. This means:
- Users can't see their history
- Analyses are orphaned (no owner)
- The main feature (persistence) doesn't work

**This is the #1 priority to fix.**

---

## Phase 4.5 Overview

**Goal**: Connect analyses to user accounts and enable full user experience

**Estimated Time**: 4-6 hours total

**Priority**: HIGH (blocking user value)

---

## Task Breakdown

### 🔥 Task 1: Link Analyses to Users (CRITICAL)
**Time**: 1-2 hours
**Priority**: HIGHEST
**Blocking**: Everything else

#### What to Do:
1. **Modify `/api/analyze` route**:
   ```javascript
   // Add at the top
   import { getServerSession } from 'next-auth/next';
   import { authOptions } from '@/lib/authOptions';

   export async function POST(request) {
     // Get user session
     const session = await getServerSession(authOptions);
     const userId = session?.user?.id || null;

     // ... existing code ...

     // When saving analysis, include userId
     const savedAnalysis = await saveAnalysis({
       // ... existing fields ...
       userId: userId  // ADD THIS
     });
   }
   ```

2. **Update `lib/db.js`**:
   ```javascript
   export async function saveAnalysis(data) {
     const {
       inputType, contentHash, provider, model,
       config, results, tokenUsage, githubUrl,
       githubBranch, userId  // ADD THIS
     } = data;

     const result = await query(`
       INSERT INTO analyses (
         input_type, content_hash, provider, model,
         config, results, token_usage, github_url,
         github_branch, user_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, created_at
     `, [
       inputType, contentHash, provider, model,
       JSON.stringify(config), JSON.stringify(results),
       JSON.stringify(tokenUsage), githubUrl, githubBranch,
       userId  // ADD THIS
     ]);

     return result.rows[0];
   }
   ```

3. **Test**:
   - Run analysis while logged in
   - Check database: `SELECT user_id FROM analyses ORDER BY created_at DESC LIMIT 1;`
   - Should return the logged-in user's ID

**Files to Modify**:
- `app/api/analyze/route.js`
- `lib/db.js`

---

### 🔥 Task 2: Create Analysis History Page
**Time**: 2-3 hours
**Depends On**: Task 1

#### What to Do:
1. **Create API endpoint** `/api/user/analyses/route.js`:
   ```javascript
   import { NextResponse } from 'next/server';
   import { getServerSession } from 'next-auth/next';
   import { authOptions } from '@/lib/authOptions';
   import { query } from '@/lib/db';

   export async function GET(request) {
     const session = await getServerSession(authOptions);

     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     // Get user's analyses
     const result = await query(`
       SELECT
         id, created_at, input_type, provider, model,
         github_url, github_branch, token_usage,
         config, results
       FROM analyses
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50
     `, [session.user.id]);

     return NextResponse.json({ analyses: result.rows });
   }

   export async function DELETE(request) {
     const session = await getServerSession(authOptions);
     const { id } = await request.json();

     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     // Delete analysis (only if owned by user)
     await query(`
       DELETE FROM analyses
       WHERE id = $1 AND user_id = $2
     `, [id, session.user.id]);

     return NextResponse.json({ success: true });
   }
   ```

2. **Create History Page** `/app/history/page.js`:
   ```javascript
   'use client';

   import { useState, useEffect } from 'react';
   import { useSession } from 'next-auth/react';
   import { useRouter } from 'next/navigation';

   export default function HistoryPage() {
     const { data: session, status } = useSession();
     const router = useRouter();
     const [analyses, setAnalyses] = useState([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       if (status === 'loading') return;
       if (!session) {
         router.push('/login');
         return;
       }

       loadAnalyses();
     }, [session, status]);

     async function loadAnalyses() {
       try {
         const res = await fetch('/api/user/analyses');
         const data = await res.json();
         setAnalyses(data.analyses || []);
       } catch (err) {
         console.error('Failed to load analyses:', err);
       } finally {
         setLoading(false);
       }
     }

     // ... render UI with list of analyses ...
   }
   ```

3. **Add to Navigation**:
   - Update `app/dashboard/page.js` to add "History" link
   - Update `middleware.js` to protect `/history` route

**Files to Create**:
- `app/api/user/analyses/route.js`
- `app/history/page.js`

**Files to Modify**:
- `app/dashboard/page.js`
- `middleware.js`

---

### 🟡 Task 3: Dashboard Recent Analyses Widget
**Time**: 1 hour
**Optional but Recommended**

#### What to Do:
1. **Add widget to dashboard** showing 3-5 most recent analyses
2. **Show**: Date, input type, model, tokens used
3. **Actions**: View results, re-run analysis
4. **Link**: "View All History" button → `/history`

**Files to Modify**:
- `app/dashboard/page.js`

---

### 🟡 Task 4: Re-run Analysis Feature
**Time**: 1 hour
**Nice to Have**

#### What to Do:
1. **Add button in history** to re-run past analysis
2. **Pre-fill dashboard** with:
   - Same config options
   - Same GitHub URL or file (if available)
   - Same test framework, output format, etc.
3. **User can modify** before re-running

**Files to Modify**:
- `app/history/page.js`
- `app/dashboard/page.js`

---

## Quick Start Commands

```bash
# Navigate to project
cd /home/diegocc/OrizonQA

# Start dev server
npm run dev
# Opens at http://localhost:3033

# Access database
psql $POSTGRES_URL

# Check recent analyses
psql $POSTGRES_URL -c "SELECT id, user_id, created_at, input_type FROM analyses ORDER BY created_at DESC LIMIT 5;"

# Build for production
npm run build
```

---

## Success Criteria

After Phase 4.5, you should be able to:
- [ ] Run analysis while logged in
- [ ] See user_id saved in database
- [ ] Visit `/history` and see past analyses
- [ ] Click on analysis to view full results
- [ ] Delete an analysis from history
- [ ] See recent analyses widget in dashboard
- [ ] Re-run a previous analysis

---

## Testing Checklist

### Analysis Persistence
- [ ] Login to dashboard
- [ ] Run an analysis (paste some code)
- [ ] Check database for user_id: `SELECT user_id FROM analyses ORDER BY created_at DESC LIMIT 1;`
- [ ] Should see your user ID (not null)

### History Page
- [ ] Visit `/history`
- [ ] See list of your analyses
- [ ] Click to view results
- [ ] Delete an analysis
- [ ] Refresh - analysis should be gone

### Dashboard Widget
- [ ] See recent analyses on dashboard
- [ ] Click "View All" → goes to `/history`
- [ ] Re-run button works

---

## After Phase 4.5

### Phase 5: Advanced Features
1. Export to Jira (API integration)
2. Export as PDF
3. Email HTML templates
4. Profile management
5. Account deletion
6. Usage statistics

### Phase 6: CLI Tool
1. npx command
2. Local analysis
3. Authentication via CLI

### Phase 7: Integrations
1. GitHub Actions
2. Jira Cloud app
3. CI/CD webhooks

---

## Important Files Reference

### Core Analysis Flow
- `app/dashboard/page.js` - Where users trigger analyses
- `app/hooks/useAnalysis.js` - Analysis hook
- `app/api/analyze/route.js` - API endpoint (NEEDS MODIFICATION)
- `lib/db.js` - Database functions (NEEDS MODIFICATION)

### Database
- `lib/db.js` - Query functions and schema
- `app/api/db/init/route.js` - Schema initialization
- Database: `analyses` table has `user_id` column ready

### Authentication
- `lib/authOptions.js` - Next-Auth configuration
- `middleware.js` - Route protection
- `app/api/auth/[...nextauth]/route.js` - Auth handler

---

## Common Issues & Solutions

### Issue: "Cannot find module 'next-auth/next'"
**Solution**: Make sure Next-Auth is installed:
```bash
npm install next-auth
```

### Issue: "user_id is null in database"
**Solution**: Check that:
1. Session is being retrieved in `/api/analyze`
2. `userId` is being passed to `saveAnalysis()`
3. User is logged in when running analysis

### Issue: "Unauthorized" on /api/user/analyses
**Solution**: Check that:
1. User is logged in
2. Session is valid
3. Middleware allows access to API routes

---

## Documentation Status

- ✅ `PROJECT_STATUS.md` - Complete project overview
- ✅ `TODO.md` - Detailed action items
- ✅ `CLAUDE.md` - Updated with Phase 4 info
- ✅ `NEXT_STEPS.md` - This file
- ✅ `PHASE4_COMPLETE.md` - Phase 4 completion doc
- ⚠️ `README.md` - Needs update with auth features

---

**Ready to Start**: Begin with Task 1 (Link Analyses to Users) - it's the foundation for everything else!
