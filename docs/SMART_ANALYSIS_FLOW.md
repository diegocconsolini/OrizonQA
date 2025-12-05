# Smart Analysis Flow - UX Improvement Plan

## Problem Statement

Users don't understand:
1. What files to select to get executable tests
2. What configuration produces what output
3. The connection between input → output

Current flow requires too much manual work and domain knowledge.

---

## Current Flow (Confusing)

```
Select Repo → Manually pick files → Manually configure → Hope for the best
```

**Pain Points:**
- No guidance on what to select
- No visibility into what exists in the repo
- Framework choice is disconnected from actual repo setup
- User has to understand the system to use it
- No preview of what will be generated

---

## Proposed Flow (Guided)

```
Select Repo → Auto-Analyze Repo → Choose Goal → Review & Run
```

### Step 1: Select Repository
Same as now - pick repo and branch

### Step 2: Auto Pre-Analysis (NEW)

When repo is selected, automatically scan key files:
- **package.json** → detect JS/TS stack, existing test framework (jest, vitest, mocha)
- **requirements.txt** / **pyproject.toml** → detect Python stack, pytest
- **pom.xml** / **build.gradle** → detect Java stack, JUnit
- **File structure** → categorize what exists in the codebase

**Show summary card:**
```
┌─────────────────────────────────────────────────────┐
│ 📊 Repository Analysis                              │
├─────────────────────────────────────────────────────┤
│ Tech Stack: React + Node.js                         │
│ Test Framework: Jest (detected from package.json)   │
│                                                     │
│ Found:                                              │
│   • 15 React components (app/components/)           │
│   • 8 API routes (app/api/)                         │
│   • 5 utility functions (lib/)                      │
│   • 3 existing test files (tests already exist)     │
│                                                     │
│ Recommendation: Generate Jest tests for components  │
└─────────────────────────────────────────────────────┘
```

### Step 3: Choose What You Want (Goal-Based)

Instead of picking individual files, user picks a **goal**:

```
What do you want to generate?

● Tests for React Components (15 files)
  → Executable Jest tests, can run with Execute button

○ Tests for API Routes (8 files)
  → Executable Jest tests for endpoints

○ User Stories for Features
  → Documentation describing user workflows

○ Full QA Suite (everything)
  → Tests + Stories + Acceptance Criteria

○ Custom selection...
  → Manual file picker (advanced users)
```

**Each goal auto-configures:**
- Which files to include
- Which framework to use (based on detection)
- What outputs to generate
- Whether tests will be executable

### Step 4: Review & Run

Clear preview of what will happen:

```
┌─────────────────────────────────────────────────────┐
│ Ready to Analyze                                    │
├─────────────────────────────────────────────────────┤
│ Input: 15 React component files                     │
│ Framework: Jest (auto-detected from package.json)   │
│                                                     │
│ Will Generate:                                      │
│   ✓ Test Cases - EXECUTABLE (Jest)                 │
│   ✓ User Stories - Documentation                    │
│   ✓ Acceptance Criteria - Documentation             │
│                                                     │
│ ✅ Tests CAN be run with Execute button             │
│                                                     │
│              [Analyze Now]                          │
└─────────────────────────────────────────────────────┘
```

---

## UI Implementation Options

### Option A: Replace Configure Tab

```
Tabs: [Input] [Smart Config] [Results] [Cache]
              ^^^^^^^^^^^^
              Combines pre-analysis + goal selection
```

- Pre-analysis happens when files are fetched
- Goal selection replaces manual file picking
- Advanced options collapsed by default

### Option B: Add Analysis Plan Step

```
Tabs: [Input] [Plan] [Configure] [Results] [Cache]
              ^^^^^^
              NEW - shows detection + recommendations
```

- Plan tab appears after repo selection
- Configure tab becomes optional (for tweaks)
- More gradual transition from current UX

### Option C: Wizard Modal Flow

```
Select Repo → [Modal Wizard Opens]
              Step 1: Analyzing repo...
              Step 2: Choose your goal
              Step 3: Review settings
              [Start Analysis]
```

- Guided wizard appears after repo selection
- Can't proceed without choosing a goal
- Most hand-holding but changes current flow significantly

---

## Technical Implementation

### 1. Pre-Analysis Service

New file: `lib/repoAnalyzer.js`

```javascript
export async function analyzeRepository(files, packageJson) {
  return {
    techStack: detectTechStack(packageJson),
    testFramework: detectTestFramework(packageJson),
    categories: categorizeFiles(files),
    recommendations: generateRecommendations(...)
  };
}

function detectTechStack(packageJson) {
  // Check dependencies for React, Vue, Express, etc.
}

function detectTestFramework(packageJson) {
  // Check devDependencies for jest, vitest, mocha, pytest
  // Returns: { id: 'jest', name: 'Jest', detected: true }
}

function categorizeFiles(files) {
  // Group files by type:
  // - components (React/Vue components)
  // - api (API routes, controllers)
  // - utilities (helper functions)
  // - models (database models)
  // - tests (existing test files)
  // - config (configuration files)
}
```

### 2. Goal Definitions

New file: `lib/analysisGoals.js`

```javascript
export const ANALYSIS_GOALS = {
  componentTests: {
    id: 'componentTests',
    name: 'Tests for Components',
    description: 'Generate unit tests for UI components',
    fileCategories: ['components'],
    outputs: ['testCases'],
    executable: true
  },
  apiTests: {
    id: 'apiTests',
    name: 'Tests for API Routes',
    description: 'Generate integration tests for API endpoints',
    fileCategories: ['api'],
    outputs: ['testCases'],
    executable: true
  },
  userStories: {
    id: 'userStories',
    name: 'User Stories',
    description: 'Generate user stories describing features',
    fileCategories: ['components', 'api', 'utilities'],
    outputs: ['userStories'],
    executable: false
  },
  fullSuite: {
    id: 'fullSuite',
    name: 'Full QA Suite',
    description: 'Generate everything: tests, stories, criteria',
    fileCategories: ['components', 'api', 'utilities'],
    outputs: ['testCases', 'userStories', 'acceptanceCriteria'],
    executable: true
  }
};
```

### 3. New Components

- `RepoAnalysisSummary.jsx` - Shows detected tech stack and file categories
- `GoalSelector.jsx` - Goal-based selection UI
- `AnalysisPreview.jsx` - Shows what will be generated (already created)

### 4. Flow Changes

```
FileFolderPicker (current)
    ↓
Add: RepoAnalysisSummary (shows after files loaded)
    ↓
Add: GoalSelector (replaces manual file selection for most users)
    ↓
Keep: Manual selection as "Custom" option
```

---

## Open Questions

1. **Trigger for pre-analysis**: Automatic when repo selected, or button click?

2. **Manual selection**: Keep as advanced option, or phase out?

3. **Goal categories**: Are these the right ones?
   - Component tests
   - API tests
   - User stories
   - Full suite
   - Custom

4. **Package.json fetch**: Need to fetch this file specifically for detection - acceptable latency?

5. **Caching**: Cache the pre-analysis results in IndexedDB?

---

## Migration Path

### Phase 1: Add visibility (low risk)
- Add `AnalysisPreview` component to Configure tab
- Show "Tests will be executable" / "Tests will be documentation only"
- No flow changes

### Phase 2: Add pre-analysis (medium risk)
- Fetch package.json when repo selected
- Show `RepoAnalysisSummary` with detected stack
- Auto-suggest test framework based on detection

### Phase 3: Add goal selection (higher risk)
- Add `GoalSelector` component
- Goals auto-configure files + settings
- Manual selection becomes "Custom" option

### Phase 4: Simplify UI (optional)
- Hide/remove complex manual options
- Make goal-based flow the default
- Advanced options for power users only

---

## Success Metrics

- Reduced time from repo selection to analysis start
- Increased rate of executable test generation
- Reduced support questions about "what to select"
- User feedback on clarity of the flow
