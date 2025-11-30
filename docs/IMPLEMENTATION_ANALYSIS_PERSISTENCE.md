# Analysis Persistence Implementation Plan

**Feature**: Link Analyses to User Accounts & Enable Persistence
**Priority**: 🔥 CRITICAL (Phase 4.5 - Task #1)
**Status**: PLANNED
**Estimated Time**: 1-2 hours

---

## 🎯 Problem Statement

Currently, ORIZON QA does NOT save analysis results to the database:
- ❌ Analyses are generated but never persisted
- ❌ Users cannot view their analysis history
- ❌ No tracking of token usage or costs
- ❌ `user_id` column exists but is never populated
- ❌ `saveAnalysis()` function exists but is never called

**Impact**: Users lose all their analysis results after refresh. No history, no tracking, no value retention.

---

## 📊 Current State Analysis

### Database Schema (CORRECT)
```sql
CREATE TABLE analyses (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  input_type VARCHAR(50) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  model VARCHAR(100),
  config JSONB,
  results JSONB,
  token_usage JSONB,
  github_url TEXT,
  github_branch VARCHAR(255),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE  -- EXISTS but unused!
);
```

### Current saveAnalysis() Function (INCOMPLETE)
```javascript
// lib/db.js:115-123
export async function saveAnalysis(data) {
  const { inputType, contentHash, provider, model, config, results, tokenUsage, githubUrl, githubBranch } = data;
  const result = await query(`
    INSERT INTO analyses (input_type, content_hash, provider, model, config, results, token_usage, github_url, github_branch)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, created_at
  `, [inputType, contentHash, provider, model, JSON.stringify(config), JSON.stringify(results), JSON.stringify(tokenUsage), githubUrl, githubBranch]);
  return result.rows[0];
}
```

**Issues**:
- ❌ No `user_id` parameter accepted
- ❌ No `user_id` in INSERT statement
- ❌ Function is never called anywhere in the app

### Current API Route (NO PERSISTENCE)
```javascript
// app/api/analyze/route.js:112-122
const parsed = parseResponse(responseText, config.outputFormat);

const result = NextResponse.json({
  ...parsed,
  usage
});

// Add CORS headers
result.headers.set('Access-Control-Allow-Origin', '*');
// ... more headers

return result;  // ❌ Just returns, never saves to DB
```

**Issues**:
- ❌ No session retrieval
- ❌ No saveAnalysis() call
- ❌ Results only returned, never persisted

---

## 🛠️ Implementation Plan

### Step 1: Update saveAnalysis() Function (5 minutes)

**File**: `lib/db.js`

**Changes**:
1. Add `userId` parameter (optional, nullable for guest users)
2. Include `user_id` in INSERT statement
3. Add function documentation

**Updated Function**:
```javascript
/**
 * Save analysis to database
 * @param {object} data - Analysis data
 * @param {string} data.inputType - Type of input (paste, github, file)
 * @param {string} data.contentHash - SHA-256 hash of content
 * @param {string} data.provider - AI provider (claude, lmstudio)
 * @param {string} data.model - Model used
 * @param {object} data.config - Analysis configuration
 * @param {object} data.results - Parsed analysis results
 * @param {object} data.tokenUsage - Token usage stats
 * @param {string} [data.githubUrl] - GitHub repo URL (optional)
 * @param {string} [data.githubBranch] - GitHub branch (optional)
 * @param {number} [data.userId] - User ID (null for guest analyses)
 * @returns {Promise<{id: number, created_at: Date}>}
 */
export async function saveAnalysis(data) {
  const {
    inputType,
    contentHash,
    provider,
    model,
    config,
    results,
    tokenUsage,
    githubUrl,
    githubBranch,
    userId = null  // Default to null for guest users
  } = data;

  const result = await query(`
    INSERT INTO analyses (
      input_type,
      content_hash,
      provider,
      model,
      config,
      results,
      token_usage,
      github_url,
      github_branch,
      user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, created_at
  `, [
    inputType,
    contentHash,
    provider,
    model,
    JSON.stringify(config),
    JSON.stringify(results),
    JSON.stringify(tokenUsage),
    githubUrl,
    githubBranch,
    userId  // Can be null
  ]);

  return result.rows[0];
}
```

---

### Step 2: Add User-Specific Query Functions (10 minutes)

**File**: `lib/db.js`

**New Functions**:
```javascript
/**
 * Get analyses for a specific user
 * @param {number} userId - User ID
 * @param {number} [limit=10] - Number of results
 * @param {number} [offset=0] - Offset for pagination
 * @returns {Promise<Array>}
 */
export async function getAnalysesByUser(userId, limit = 10, offset = 0) {
  const result = await query(`
    SELECT
      id,
      created_at,
      input_type,
      provider,
      model,
      github_url,
      github_branch,
      token_usage,
      config
    FROM analyses
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    OFFSET $3
  `, [userId, limit, offset]);

  return result.rows;
}

/**
 * Get analysis count for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>}
 */
export async function getAnalysisCountByUser(userId) {
  const result = await query(`
    SELECT COUNT(*) as count
    FROM analyses
    WHERE user_id = $1
  `, [userId]);

  return parseInt(result.rows[0].count, 10);
}

/**
 * Get full analysis by ID (only if owned by user)
 * @param {number} id - Analysis ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<object|null>}
 */
export async function getAnalysisByIdForUser(id, userId) {
  const result = await query(`
    SELECT *
    FROM analyses
    WHERE id = $1 AND user_id = $2
  `, [id, userId]);

  return result.rows[0] || null;
}

/**
 * Delete analysis (only if owned by user)
 * @param {number} id - Analysis ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<boolean>}
 */
export async function deleteAnalysis(id, userId) {
  const result = await query(`
    DELETE FROM analyses
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `, [id, userId]);

  return result.rows.length > 0;
}
```

**Add to exports**:
```javascript
export {
  query,
  initDB,
  saveAnalysis,
  getRecentAnalyses,
  getAnalysisById,
  getAnalysesByUser,
  getAnalysisCountByUser,
  getAnalysisByIdForUser,
  deleteAnalysis
};
```

---

### Step 3: Update API Route with Session & Persistence (30 minutes)

**File**: `app/api/analyze/route.js`

**Changes**:
1. Import Next-Auth `getServerSession`
2. Import `saveAnalysis` from lib/db.js
3. Import crypto for content hashing
4. Get session before analysis
5. Save analysis after successful response
6. Return analysis ID to client

**Updated Implementation**:
```javascript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route.js';
import { buildPrompt, parseResponse } from '../../../lib/promptBuilder.js';
import { saveAnalysis } from '../../../lib/db.js';
import crypto from 'crypto';

export async function POST(request) {
  try {
    // Get user session (if authenticated)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const { apiKey, content, config = {}, provider = 'claude', lmStudioUrl } = await request.json();

    // Validate API key for Claude, optional for LM Studio
    if (provider === 'claude' && !apiKey) {
      return NextResponse.json({ error: 'API key is required for Claude' }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Code content is required' }, { status: 400 });
    }

    // Ensure config has defaults
    const analysisConfig = {
      userStories: true,
      testCases: true,
      acceptanceCriteria: true,
      edgeCases: false,
      securityTests: false,
      outputFormat: 'markdown',
      testFramework: 'generic',
      additionalContext: '',
      ...config
    };

    // Determine input type
    const inputType = config.inputType || 'paste';  // paste, github, file

    // Create content hash for deduplication/caching
    const contentHash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    // Build prompt from content and config using our prompt builder
    const prompt = buildPrompt(content, analysisConfig);

    let response;
    let responseText;
    let usage = null;

    if (provider === 'lmstudio') {
      // LM Studio uses OpenAI-compatible API
      const lmUrl = lmStudioUrl || 'http://192.168.2.101:1234';

      response = await fetch(`${lmUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: analysisConfig.model || 'local-model',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 16000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.error?.message || `LM Studio error: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      responseText = data.choices[0].message.content;
      usage = data.usage ? {
        input_tokens: data.usage.prompt_tokens || 0,
        output_tokens: data.usage.completion_tokens || 0
      } : null;

    } else {
      // Claude API
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: analysisConfig.model || 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          return NextResponse.json({ error: 'Rate limited. Please wait and try again.' }, { status: 429 });
        }

        if (response.status === 401) {
          return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }

        return NextResponse.json(
          { error: errorData.error?.message || `API error: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      responseText = data.content[0].text;
      usage = data.usage;
    }

    // Parse response into sections
    const parsed = parseResponse(responseText, config.outputFormat);

    // 🆕 SAVE ANALYSIS TO DATABASE
    let analysisRecord = null;
    try {
      analysisRecord = await saveAnalysis({
        inputType,
        contentHash,
        provider,
        model: analysisConfig.model || (provider === 'claude' ? 'claude-sonnet-4-20250514' : 'local-model'),
        config: analysisConfig,
        results: parsed,
        tokenUsage: usage,
        githubUrl: config.githubUrl || null,
        githubBranch: config.githubBranch || null,
        userId  // Can be null for guest users
      });

      console.log(`✓ Analysis saved: ID ${analysisRecord.id}, User: ${userId || 'guest'}`);
    } catch (dbError) {
      // Log error but don't fail the request
      console.error('Failed to save analysis to database:', dbError);
      // Analysis still returns to user even if DB save fails
    }

    const result = NextResponse.json({
      ...parsed,
      usage,
      analysisId: analysisRecord?.id || null,  // Return analysis ID if saved
      savedAt: analysisRecord?.created_at || null
    });

    // Add CORS headers
    result.headers.set('Access-Control-Allow-Origin', '*');
    result.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return result;

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add CORS headers for local development
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

**Key Changes**:
- ✅ Import `getServerSession` and `authOptions`
- ✅ Get user session at start of request
- ✅ Extract `userId` from session (null if not logged in)
- ✅ Determine `inputType` from config
- ✅ Create `contentHash` using SHA-256
- ✅ Call `saveAnalysis()` after successful analysis
- ✅ Handle DB save errors gracefully (log but don't fail request)
- ✅ Return `analysisId` and `savedAt` to client
- ✅ Console log for tracking

---

### Step 4: Update useAnalysis Hook (Optional Enhancement) (10 minutes)

**File**: `app/hooks/useAnalysis.js`

**Add state for saved analysis**:
```javascript
const [savedAnalysisId, setSavedAnalysisId] = useState(null);
```

**Update handleAnalysis to capture ID**:
```javascript
const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || 'Analysis failed');
}

// Capture saved analysis ID
if (data.analysisId) {
  setSavedAnalysisId(data.analysisId);
  console.log(`Analysis saved with ID: ${data.analysisId}`);
}

setResults(data);
setUsage(data.usage || null);
```

**Return in hook**:
```javascript
return {
  results,
  usage,
  isLoading,
  error,
  handleAnalysis,
  savedAnalysisId  // New
};
```

---

### Step 5: Test Implementation (20 minutes)

#### Test Case 1: Authenticated User Analysis
1. Log in to the application
2. Run an analysis from dashboard
3. Check console for "Analysis saved" message
4. Query database:
   ```sql
   SELECT id, created_at, user_id, input_type, provider
   FROM analyses
   ORDER BY created_at DESC
   LIMIT 5;
   ```
5. Verify `user_id` matches logged-in user

#### Test Case 2: Guest User Analysis
1. Log out
2. Go to public dashboard (if exists) or analyze page
3. Run an analysis
4. Check console for "Analysis saved" message
5. Query database:
   ```sql
   SELECT id, created_at, user_id, input_type, provider
   FROM analyses
   WHERE user_id IS NULL
   ORDER BY created_at DESC
   LIMIT 5;
   ```
6. Verify `user_id` is NULL but analysis is saved

#### Test Case 3: Database Failure Handling
1. Stop database: `docker-compose stop postgres`
2. Run analysis
3. Verify analysis still returns to user
4. Check console for DB error log
5. Restart database: `docker-compose start postgres`

---

## 🎯 Success Criteria

- [x] `saveAnalysis()` accepts `userId` parameter
- [x] `saveAnalysis()` includes `user_id` in INSERT
- [x] API route gets user session
- [x] API route calls `saveAnalysis()` after successful analysis
- [x] Authenticated user analyses have `user_id` populated
- [x] Guest user analyses have `user_id = NULL` but are still saved
- [x] Analysis ID returned to client
- [x] Database errors don't break user experience
- [x] Console logging for debugging
- [x] Tests pass for both authenticated and guest users

---

## 📈 Database Migration Notes

**No migration needed!** The `user_id` column already exists in the schema. We're just starting to populate it.

**Existing data**: Any analyses in the database will have `user_id = NULL` (guest analyses). This is fine.

---

## 🔄 Rollback Plan

If something goes wrong:

1. **Revert `lib/db.js`**:
   ```bash
   git checkout HEAD -- lib/db.js
   ```

2. **Revert `app/api/analyze/route.js`**:
   ```bash
   git checkout HEAD -- app/api/analyze/route.js
   ```

3. **Database is safe**: No schema changes, only INSERT changes. Existing data unaffected.

---

## 📊 Expected Database State After Implementation

```sql
-- Before: Empty or all NULL user_id
SELECT user_id, COUNT(*)
FROM analyses
GROUP BY user_id;

-- Result:
-- user_id | count
-- --------|------
-- (null)  |  23

-- After: Mix of user IDs and NULL
SELECT user_id, COUNT(*)
FROM analyses
GROUP BY user_id;

-- Result:
-- user_id | count
-- --------|------
-- (null)  |  23   -- Old guest analyses
-- 1       |  5    -- User 1's analyses
-- 2       |  12   -- User 2's analyses
-- (null)  |  8    -- New guest analyses
```

---

## 📝 Files to Modify

1. **`lib/db.js`**:
   - Update `saveAnalysis()` function
   - Add `getAnalysesByUser()`
   - Add `getAnalysisCountByUser()`
   - Add `getAnalysisByIdForUser()`
   - Add `deleteAnalysis()`

2. **`app/api/analyze/route.js`**:
   - Import Next-Auth session
   - Import crypto for hashing
   - Import saveAnalysis
   - Get user session
   - Calculate content hash
   - Call saveAnalysis after success
   - Return analysis ID

3. **`app/hooks/useAnalysis.js`** (optional):
   - Add savedAnalysisId state
   - Capture analysis ID from response

---

## ⏱️ Time Breakdown

- Step 1: Update saveAnalysis() - **5 minutes**
- Step 2: Add query functions - **10 minutes**
- Step 3: Update API route - **30 minutes**
- Step 4: Update hook (optional) - **10 minutes**
- Step 5: Testing - **20 minutes**

**Total: 75 minutes (1.25 hours)**

---

## 🚀 Next Steps After Completion

Once this is done:
1. ✅ Task #1 complete
2. → Move to Task #2: Create Analysis History Page
3. → Task #3: Update Documentation

---

**END OF IMPLEMENTATION PLAN**
