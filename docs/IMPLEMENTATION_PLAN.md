# High Priority Implementation Plan

**Target**: Complete 3 critical tasks to make History page functional
**Total Time**: ~4-5 hours

---

## Task #1: Link Analyses to User Accounts (CRITICAL)
**Time**: 1-2 hours | **Blocks**: Everything else

### Step 1: Update `lib/db.js` (10 min)
```javascript
// Modify saveAnalysis function
export async function saveAnalysis(userId, analysisData) {
  const { provider, model, input_type, github_url, token_usage, results } = analysisData;

  const result = await sql`
    INSERT INTO analyses (
      user_id, provider, model, input_type, github_url,
      token_usage, results, created_at
    )
    VALUES (
      ${userId}, ${provider}, ${model}, ${input_type}, ${github_url},
      ${JSON.stringify(token_usage)}, ${JSON.stringify(results)}, NOW()
    )
    RETURNING id
  `;

  return result[0].id;
}
```

### Step 2: Update `app/api/analyze/route.js` (15 min)
```javascript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {
  // Get session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... existing code to call Claude API ...

  // Save with user_id
  const analysisId = await saveAnalysis(session.user.id, {
    provider,
    model,
    input_type,
    github_url,
    token_usage,
    results
  });

  return NextResponse.json({ results, token_usage, analysisId });
}
```

### Step 3: Test (15 min)
```bash
# 1. Run analysis in Dashboard
# 2. Check database:
psql $POSTGRES_URL -c "SELECT id, user_id, created_at FROM analyses ORDER BY created_at DESC LIMIT 5;"

# 3. Verify History page shows data
# 4. Verify Sidebar Quick Stats update
```

**Files Modified**: `lib/db.js`, `app/api/analyze/route.js`

---

## Task #2: Analysis Detail View
**Time**: 2-3 hours | **Depends**: Task #1

### Step 1: Create API Route (30 min)
**File**: `app/api/user/analyses/[id]/route.js`
```javascript
import { getServerSession } from 'next-auth';
import { sql } from '@vercel/postgres';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sql`
    SELECT * FROM analyses
    WHERE id = ${params.id} AND user_id = ${session.user.id}
  `;

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await sql`
    DELETE FROM analyses
    WHERE id = ${params.id} AND user_id = ${session.user.id}
  `;

  return NextResponse.json({ success: true });
}
```

### Step 2: Create Detail Page (90 min)
**File**: `app/history/[id]/page.js`

Structure:
- Load analysis data on mount
- Display results in tabs (User Stories, Tests, Criteria)
- Reuse `OutputSection` component from Dashboard
- Add action buttons: Download, Delete, Run Again

Key code:
```javascript
const [analysis, setAnalysis] = useState(null);

useEffect(() => {
  async function loadAnalysis() {
    const res = await fetch(`/api/user/analyses/${params.id}`);
    const data = await res.json();
    setAnalysis(data);
  }
  loadAnalysis();
}, [params.id]);

// Display using existing OutputSection component
<OutputSection results={analysis.results} />
```

### Step 3: Make History Cards Clickable (15 min)
**File**: `app/history/page.js`

Change:
```javascript
<Card className="...">
  // Wrap in Link or add onClick
  <Link href={`/history/${analysis.id}`}>
    {/* existing card content */}
  </Link>
</Card>
```

**Files Created**:
- `app/history/[id]/page.js`
- `app/api/user/analyses/[id]/route.js`

**Files Modified**:
- `app/history/page.js`

---

## Task #3: Update Documentation
**Time**: 30-45 min

### Update `CLAUDE.md` (25 min)
Changes:
1. Line 4: "Phase 2 complete" → "Navigation & History Complete"
2. Add to Architecture section:
   ```
   app/components/
   ├── layout/
   │   ├── Sidebar.jsx          # Left navigation sidebar
   │   └── AppLayout.jsx         # Layout wrapper with sidebar

   app/history/
   ├── page.js                   # Analysis history list
   └── [id]/page.js             # Individual analysis detail
   ```
3. Update "Current Status" section
4. Add to "Planned" work: "Analysis detail actions (delete, run again, share)"

### Update `README.md` (20 min)
Changes:
1. Add to Features: "Analysis History with search and filtering"
2. Update architecture diagram (if exists)
3. Add screenshot paths (if adding screenshots)

**Files Modified**:
- `CLAUDE.md`
- `README.md`

---

## Testing Checklist

After completing all tasks:

- [ ] **Task #1 Tests**:
  - [ ] Run analysis in Dashboard
  - [ ] Verify database has user_id
  - [ ] Check History page shows analyses
  - [ ] Verify Sidebar stats update

- [ ] **Task #2 Tests**:
  - [ ] Click history card → navigates to detail
  - [ ] Detail page loads correctly
  - [ ] All tabs display results
  - [ ] Download button works
  - [ ] Delete button works (with confirmation)
  - [ ] "Run Again" redirects to Dashboard

- [ ] **Task #3 Tests**:
  - [ ] Documentation reflects current state
  - [ ] File structure is accurate
  - [ ] No outdated information

---

## Execution Order

1. **Session Start** (5 min):
   ```bash
   cd /home/diegocc/OrizonQA
   npm run dev
   ```

2. **Task #1** (1-2 hours):
   - Edit `lib/db.js` → Edit `app/api/analyze/route.js` → Test

3. **Task #2** (2-3 hours):
   - Create API route → Create detail page → Update history page → Test

4. **Task #3** (30-45 min):
   - Update CLAUDE.md → Update README.md

**Total**: 4-5 hours for fully functional History system

---

## Quick Reference

**Database Check**:
```bash
psql $POSTGRES_URL -c "SELECT id, user_id, provider, created_at FROM analyses ORDER BY created_at DESC LIMIT 5;"
```

**Dev Server**:
```bash
PORT=3033 npm run dev
```

**Key Files**:
- `lib/db.js` - Database functions
- `app/api/analyze/route.js` - Analysis creation
- `app/history/page.js` - History list
- `app/history/[id]/page.js` - Analysis detail (NEW)
- `app/api/user/analyses/[id]/route.js` - Detail API (NEW)

---

**END OF PLAN**
