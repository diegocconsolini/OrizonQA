# Next Session - Implementation Prompt

**Date**: 2025-12-01
**Current Status**: Foundation complete, ready to build professional QA system
**Session Goal**: Begin Phase 1 of Professional QA System

---

## 🎯 Session Objective

Transform ORIZON from a basic artifact generator into a professional QA management platform comparable to TestRail and Xray (Jira).

---

## 📊 Current State Summary

### ✅ What's Working (Foundation)
- **Authentication**: Complete user system with email verification, password reset
- **AI Analysis**: Claude AI + LM Studio integration for generating QA artifacts
- **History**: Analysis tracking with search/filter
- **Settings**: Encrypted API key storage with auto-load
- **UI/UX**: Professional design system with sidebar navigation, optimized favicons
- **Database**: PostgreSQL with 4 tables (users, sessions, analyses, audit_logs)

### 📁 Current Architecture
- **11 pages**: Landing, auth flow (5), core app (4), dev showcase
- **11 API endpoints**: Auth (6), user data (3), core (2)
- **4 core feature pages**: Dashboard, History, Analysis Detail, Settings

### 🎨 Branding Complete
- Logo: Transparent white version (full + icon)
- Favicons: 7 optimized sizes (16×16 to 512×512)
- Colors: Event Horizon Blue (#00D4FF), Quantum Violet (#6A00FF)
- Typography: Inter, Roboto, JetBrains Mono

---

## 🚀 What to Build Next

### Primary Task: Start Phase 1 - Test Management Foundation

**Reference Document**: `PROFESSIONAL_QA_SYSTEM_PLAN.md` (24KB comprehensive plan)

**Phase 1 Goal**: Add proper test case management (not just AI-generated artifacts)

**Estimated Time**: 8-10 hours

---

## 📋 Phase 1 Implementation Checklist

### 1.1 Projects & Organization (2 hours)

**Database** (15 min):
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  prefix VARCHAR(10) DEFAULT 'TC',
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_active ON projects(is_active);
```

**Tasks**:
- [ ] Add projects table to `lib/db.js` initDB()
- [ ] Create `lib/db-projects.js` with CRUD functions
- [ ] Create API: `app/api/projects/route.js` (GET, POST)
- [ ] Create API: `app/api/projects/[id]/route.js` (GET, PUT, DELETE)
- [ ] Create page: `app/projects/page.js` (list projects)
- [ ] Create page: `app/projects/new/page.js` (create project)
- [ ] Create page: `app/projects/[id]/page.js` (project dashboard)
- [ ] Create component: `ProjectCard.jsx`
- [ ] Create component: `ProjectForm.jsx`
- [ ] Update sidebar navigation to include "Projects"

**Deliverable**: Users can create and manage projects

---

### 1.2 Test Case Management (4 hours)

**Database** (20 min):
```sql
CREATE TABLE test_cases (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  preconditions TEXT,
  steps JSONB,  -- [{step: string, expected: string, data: string}]
  expected_result TEXT,
  priority VARCHAR(20) DEFAULT 'Medium',  -- Critical, High, Medium, Low
  type VARCHAR(50) DEFAULT 'Functional',  -- Functional, Integration, Performance, Security, UI/UX
  status VARCHAR(20) DEFAULT 'Draft',  -- Draft, Ready, Deprecated
  automated BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]',  -- ['login', 'auth', 'smoke']
  folder_path VARCHAR(500) DEFAULT '/',  -- /Regression/Login/
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_test_cases_project ON test_cases(project_id);
CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_cases_folder ON test_cases(folder_path);
CREATE INDEX idx_test_cases_priority ON test_cases(priority);
```

**Tasks**:
- [ ] Add test_cases table to database
- [ ] Create `lib/db-tests.js` with CRUD functions
- [ ] Create API: `app/api/projects/[id]/tests/route.js` (GET, POST)
- [ ] Create API: `app/api/projects/[id]/tests/[testId]/route.js` (GET, PUT, DELETE)
- [ ] Create page: `app/projects/[id]/tests/page.js` (list tests)
- [ ] Create page: `app/projects/[id]/tests/new/page.js` (create test)
- [ ] Create page: `app/projects/[id]/tests/[testId]/page.js` (view/edit test)
- [ ] Create component: `TestCaseForm.jsx` (multi-step editor)
- [ ] Create component: `TestCaseList.jsx` (with filters)
- [ ] Create component: `TestCaseCard.jsx`
- [ ] Create component: `StepsEditor.jsx` (repeatable step blocks)
- [ ] Create component: `FolderPicker.jsx`
- [ ] Create component: `TagManager.jsx`

**Deliverable**: Users can create, organize, and manage test cases

---

### 1.3 AI Integration with Test Management (2 hours)

**Goal**: Connect existing AI generation to the new test case library

**Tasks**:
- [ ] Add "Save to Project" button to Dashboard after AI generation
- [ ] Create modal: `SaveToProjectModal.jsx` (select project + folder)
- [ ] Create API: `app/api/projects/[id]/tests/bulk-import` (POST)
- [ ] Map AI-generated test artifacts to structured test cases:
  ```javascript
  // Transform AI output
  {
    userStories: "...",
    testCases: "...",
    acceptanceCriteria: "..."
  }
  // Into structured test cases
  {
    title: "...",
    description: "...",
    steps: [{step: "", expected: ""}],
    priority: "High",
    type: "Functional",
    tags: ["ai-generated"]
  }
  ```
- [ ] Add "Import from Analysis History" feature to test list page
- [ ] Show success notification with link to created tests

**Deliverable**: AI-generated artifacts can be saved as reusable test cases

---

## 🗂️ File Structure Changes

**New Directories**:
```
app/
├── projects/
│   ├── page.js                        # Project list
│   ├── new/page.js                    # Create project
│   ├── [id]/
│   │   ├── page.js                    # Project dashboard
│   │   └── tests/
│   │       ├── page.js                # Test list
│   │       ├── new/page.js            # Create test
│   │       └── [testId]/
│   │           ├── page.js            # View/edit test
│   │           └── history/page.js    # Version history
│   └── components/
│       ├── ProjectCard.jsx
│       ├── ProjectForm.jsx
│       ├── TestCaseForm.jsx
│       ├── TestCaseList.jsx
│       ├── TestCaseCard.jsx
│       ├── StepsEditor.jsx
│       ├── FolderPicker.jsx
│       └── TagManager.jsx
├── api/
│   └── projects/
│       ├── route.js                   # GET, POST
│       ├── [id]/
│       │   ├── route.js              # GET, PUT, DELETE
│       │   └── tests/
│       │       ├── route.js          # GET, POST
│       │       ├── bulk-import/route.js  # POST
│       │       └── [testId]/route.js # GET, PUT, DELETE
lib/
├── db-projects.js                     # Project CRUD
└── db-tests.js                        # Test case CRUD
```

---

## 📊 Database Migration Script

Create `scripts/migrate-phase1.js`:
```javascript
import { query, initDB } from '../lib/db.js';

async function migratePhase1() {
  console.log('🔄 Starting Phase 1 migration...');

  // Add projects table
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      prefix VARCHAR(10) DEFAULT 'TC',
      owner_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      is_active BOOLEAN DEFAULT TRUE
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active);`);

  console.log('✓ Projects table created');

  // Add test_cases table
  await query(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      preconditions TEXT,
      steps JSONB,
      expected_result TEXT,
      priority VARCHAR(20) DEFAULT 'Medium',
      type VARCHAR(50) DEFAULT 'Functional',
      status VARCHAR(20) DEFAULT 'Draft',
      automated BOOLEAN DEFAULT FALSE,
      tags JSONB DEFAULT '[]',
      folder_path VARCHAR(500) DEFAULT '/',
      created_by INTEGER REFERENCES users(id),
      updated_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      version INTEGER DEFAULT 1
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_test_cases_project ON test_cases(project_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_test_cases_folder ON test_cases(folder_path);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority);`);

  console.log('✓ Test cases table created');

  console.log('✅ Phase 1 migration complete!');
}

migratePhase1().catch(console.error);
```

Run with: `node scripts/migrate-phase1.js`

---

## 🎨 UI Components to Build

### ProjectCard.jsx
```jsx
<Card>
  <div className="flex items-start justify-between">
    <div>
      <h3 className="text-lg font-semibold">{project.name}</h3>
      <p className="text-sm text-slate-400">{project.description}</p>
    </div>
    <Badge>{project.prefix}</Badge>
  </div>
  <div className="flex gap-4 mt-4 text-sm">
    <div>
      <span className="text-slate-400">Tests:</span>
      <span className="font-semibold ml-1">{project.testCount}</span>
    </div>
    <div>
      <span className="text-slate-400">Created:</span>
      <span className="ml-1">{formatDate(project.created_at)}</span>
    </div>
  </div>
</Card>
```

### TestCaseForm.jsx (Key Component)
```jsx
<form>
  <Input label="Title" required />
  <Textarea label="Description" />
  <Textarea label="Preconditions" />

  <StepsEditor>
    {steps.map((step, i) => (
      <StepBlock key={i}>
        <Input label={`Step ${i + 1}`} />
        <Input label="Expected Result" />
        <Input label="Test Data" />
        <Button onClick={() => removeStep(i)}>Remove</Button>
      </StepBlock>
    ))}
    <Button onClick={addStep}>+ Add Step</Button>
  </StepsEditor>

  <Select label="Priority" options={['Critical', 'High', 'Medium', 'Low']} />
  <Select label="Type" options={['Functional', 'Integration', 'Performance', 'Security', 'UI/UX']} />
  <FolderPicker label="Folder" />
  <TagInput label="Tags" />
  <Checkbox label="Automated" />
</form>
```

---

## 🧪 Testing Checklist

After Phase 1 implementation:

**Projects**:
- [ ] Can create new project
- [ ] Can view project list
- [ ] Can edit project details
- [ ] Can delete project (with confirmation)
- [ ] Project card shows test count
- [ ] Projects are user-specific (can't see other users' projects)

**Test Cases**:
- [ ] Can create test case with multiple steps
- [ ] Can edit existing test case
- [ ] Can delete test case
- [ ] Can organize tests in folders
- [ ] Can add tags to tests
- [ ] Can filter tests by status/priority/type
- [ ] Can search tests by title

**AI Integration**:
- [ ] "Save to Project" button appears after analysis
- [ ] Can select target project and folder
- [ ] AI artifacts are correctly transformed to test cases
- [ ] Multiple test cases are created in bulk
- [ ] Success notification with links
- [ ] Can view newly created tests

---

## 📚 Reference Documents

**In this repository**:
- `PROFESSIONAL_QA_SYSTEM_PLAN.md` - Full implementation plan (24KB)
- `SYSTEM_CAPABILITIES.md` - Current system analysis
- `CLAUDE.md` - Architecture and patterns
- `TODO.md` - Task tracking
- `README.md` - User documentation

**External References** (to study):
- TestRail: https://www.testrail.com/ (test management patterns)
- Xray for Jira: https://www.getxray.app/ (traceability)
- Kiwi TCMS: https://kiwitcms.org/ (open source alternative)

---

## 🎯 Success Criteria

**Phase 1 is complete when**:
1. ✅ Database has projects and test_cases tables
2. ✅ Users can create and manage projects
3. ✅ Users can create, edit, and organize test cases
4. ✅ Test cases have structured format (title, steps, expected results)
5. ✅ Users can save AI-generated artifacts as test cases
6. ✅ Navigation sidebar includes "Projects" section
7. ✅ All pages are responsive and match design system
8. ✅ No console errors, proper loading states

---

## 💡 Implementation Tips

### Start Small
Begin with the simplest version:
1. Projects CRUD first (no fancy features)
2. Basic test case form (title, description, steps only)
3. Simple list views (no advanced filters initially)
4. Add polish and features iteratively

### Reuse Existing Components
- Use existing Card, Button, Input components
- Copy patterns from History page for list views
- Reuse sidebar navigation structure
- Follow existing authentication patterns

### Database Pattern
Follow the pattern from `lib/db.js`:
```javascript
export async function getProjectsByUser(userId) {
  const result = await query(`
    SELECT * FROM projects
    WHERE owner_id = $1 AND is_active = true
    ORDER BY created_at DESC
  `, [userId]);
  return result.rows;
}
```

### API Pattern
Follow the pattern from `/api/user/analyses/route.js`:
```javascript
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... fetch data for this user only
}
```

---

## 🚦 Development Workflow

### 1. Run Migration
```bash
cd /home/diegocc/OrizonQA
node scripts/migrate-phase1.js
```

### 2. Start Dev Server
```bash
PORT=3033 npm run dev
```

### 3. Test in Browser
- Navigate to `http://localhost:3033/projects`
- Create a new project
- Add test cases to the project
- Save AI analysis to project

### 4. Verify Database
```bash
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM projects;"
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM test_cases;"
```

---

## 📝 Task Breakdown (First 2 Hours)

### Hour 1: Database & Project API
1. Create `scripts/migrate-phase1.js` (15 min)
2. Run migration (5 min)
3. Create `lib/db-projects.js` with CRUD functions (20 min)
4. Create `app/api/projects/route.js` - GET, POST (20 min)

### Hour 2: Project Pages
1. Create `app/projects/page.js` - list view (30 min)
2. Create `app/projects/components/ProjectCard.jsx` (15 min)
3. Create `app/projects/new/page.js` - create form (15 min)
4. Update sidebar navigation with "Projects" link (10 min)
5. Test: Create first project (10 min)

---

## ✅ Quick Start Command

```bash
# Navigate to project
cd /home/diegocc/OrizonQA

# Review the plan
cat PROFESSIONAL_QA_SYSTEM_PLAN.md

# Start implementing
# 1. Create migration script
# 2. Run migration
# 3. Build project management
# 4. Build test case management
# 5. Connect AI generation
```

---

## 🎬 Ready to Start!

**Next message to Claude**:
> "Let's implement Phase 1 of the Professional QA System. Start with Task 1.1: Projects & Organization. Create the database migration script, then build the project management pages and API."

---

**This prompt provides everything needed to continue building the professional QA system in the next session.** 🚀
