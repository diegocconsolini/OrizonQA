# ORIZON Professional QA System - Comprehensive Design Document

**Created**: 2025-12-01
**Based on Research**: Repomix, Codebase-Digest, TestRail, Xray
**Purpose**: Design a best-in-class QA management platform combining industry standards with AI-powered analysis

---

## Executive Summary

ORIZON will evolve from a basic AI artifact generator into a comprehensive QA management platform that combines:

1. **TestRail's** test case management and execution tracking
2. **Xray's** requirements traceability and coverage analysis
3. **Repomix's** codebase packing and token counting
4. **Codebase-Digest's** 60+ analysis prompts
5. **Our unique** AI-powered test generation and analysis

---

## Part 1: Research Findings

### 1.1 Repomix Analysis

**Key Features to Adopt**:
- Single-file codebase packing (XML, Markdown, Plain text)
- Token counting for AI context windows
- MCP server support for Claude integration
- Security scanning (Secretlint integration)
- Configurable include/exclude patterns
- Multiple output formats

**Implementation in ORIZON**:
- Add "Pack Project" feature to compress entire test suite into AI-friendly format
- Token counter for test case descriptions before AI analysis
- Security scanner for sensitive data in test cases (API keys, credentials)
- Export test suites in multiple formats for AI consumption

### 1.2 Codebase-Digest Analysis

**60+ Prompt Library Categories**:
1. **Quality Analysis**: Code duplication, complexity, churn hotspots
2. **Testing**: Unit test generation, test coverage analysis
3. **Documentation**: Auto-generate test documentation
4. **Learning**: Frontend/backend analysis, architecture mapping
5. **Security**: Initial security assessment
6. **Business**: Alignment with business objectives

**Implementation in ORIZON**:
- Integrate all 60+ prompts as "AI Analysis Templates"
- Add prompt library browser in UI
- Allow custom prompt creation and saving
- Map prompts to test types (unit, integration, e2e, security)
- Use prompts for automated test case enhancement

### 1.3 TestRail Analysis

**Core Features**:
1. **Test Cases**: Templates, versioning, consistent structure
2. **Test Runs**: Sprint-based execution, dynamic filtering
3. **Test Plans**: Multiple test runs for releases
4. **Assignments**: Track who executes which tests
5. **Results Tracking**: Pass/Fail/Blocked/Skipped with history
6. **Reporting**: Real-time visibility, historical data
7. **Integrations**: Selenium, JUnit, pytest, Jenkins, Jira
8. **AI Features**: Test case creation assistance (Sembi IQ)

**Implementation in ORIZON**:
- Test case templates with customizable fields
- Test runs linked to sprints/releases
- Test plans for comprehensive coverage
- Assignment system for team collaboration
- Rich result tracking with screenshots/logs
- Dashboard with real-time metrics
- AI-assisted test case generation (already have this!)

### 1.4 Xray Analysis

**Core Features**:
1. **Requirements Traceability**: Link tests to requirements/stories
2. **Coverage Analysis**: Interactive charts, version-based analysis
3. **Traceability Matrix**: Requirements → Tests → Executions → Defects
4. **Native Jira Integration**: Test issue types, custom workflows
5. **BDD Support**: Cucumber, Gherkin syntax
6. **Automation**: REST API, CI/CD integration
7. **Compliance**: FDA/ISO audit trails for regulated industries

**Implementation in ORIZON**:
- Full traceability from requirements to defects
- Coverage dashboard with charts
- Bidirectional traceability matrix
- BDD/Gherkin support for test cases
- Audit trail for compliance (already have audit_logs!)
- REST API for automation integrations

---

## Part 2: Comprehensive Database Schema

### 2.1 Core Tables

#### **projects**
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  key VARCHAR(10) UNIQUE NOT NULL,          -- Project key (e.g., "PROJ")
  description TEXT,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}'               -- Project-specific settings
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_key ON projects(key);
```

#### **requirements** (from Xray)
```sql
CREATE TABLE requirements (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  key VARCHAR(50) NOT NULL,                 -- REQ-1, STORY-42
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'Story',         -- Story, Epic, Bug, Feature
  status VARCHAR(50) DEFAULT 'Open',        -- Open, In Progress, Done
  priority VARCHAR(20) DEFAULT 'Medium',
  version VARCHAR(100),                     -- Release version
  external_id VARCHAR(255),                 -- Jira ID, Azure DevOps ID
  external_url TEXT,                        -- Link to external system
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_requirements_project ON requirements(project_id);
CREATE INDEX idx_requirements_key ON requirements(key);
CREATE INDEX idx_requirements_version ON requirements(version);
```

#### **test_suites** (organize tests)
```sql
CREATE TABLE test_suites (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES test_suites(id),  -- Nested suites
  name VARCHAR(200) NOT NULL,
  description TEXT,
  folder_path VARCHAR(500) DEFAULT '/',    -- /Regression/Login/
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_test_suites_project ON test_suites(project_id);
CREATE INDEX idx_test_suites_parent ON test_suites(parent_id);
```

#### **test_cases** (enhanced from Phase 1)
```sql
CREATE TABLE test_cases (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  suite_id INTEGER REFERENCES test_suites(id),
  key VARCHAR(50) NOT NULL,                 -- TC-1, TEST-42
  title VARCHAR(500) NOT NULL,
  description TEXT,
  preconditions TEXT,
  steps JSONB,                              -- [{step, expected, data, attachments}]
  expected_result TEXT,
  postconditions TEXT,
  priority VARCHAR(20) DEFAULT 'Medium',    -- Critical, High, Medium, Low
  type VARCHAR(50) DEFAULT 'Functional',    -- Functional, Integration, Performance, Security, UI/UX
  status VARCHAR(20) DEFAULT 'Draft',       -- Draft, Ready, Deprecated, Obsolete
  automated BOOLEAN DEFAULT FALSE,
  automation_script TEXT,                   -- Path to test script
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',         -- Extensible custom data
  estimated_time INTEGER,                   -- Minutes
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1,

  -- AI Generation Metadata
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model VARCHAR(100),
  ai_prompt_template VARCHAR(255),
  analysis_id INTEGER REFERENCES analyses(id)
);

CREATE INDEX idx_test_cases_project ON test_cases(project_id);
CREATE INDEX idx_test_cases_suite ON test_cases(suite_id);
CREATE INDEX idx_test_cases_key ON test_cases(key);
CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_cases_priority ON test_cases(priority);
CREATE INDEX idx_test_cases_automated ON test_cases(automated);
```

#### **test_coverage** (Xray-style traceability)
```sql
CREATE TABLE test_coverage (
  id SERIAL PRIMARY KEY,
  requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
  test_case_id INTEGER REFERENCES test_cases(id) ON DELETE CASCADE,
  coverage_type VARCHAR(50) DEFAULT 'Covers',  -- Covers, VerifiedBy, BlockedBy
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(requirement_id, test_case_id)
);

CREATE INDEX idx_test_coverage_requirement ON test_coverage(requirement_id);
CREATE INDEX idx_test_coverage_test_case ON test_coverage(test_case_id);
```

#### **test_plans** (TestRail-style)
```sql
CREATE TABLE test_plans (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  milestone VARCHAR(100),                   -- Sprint 42, Release 2.0
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'Active',      -- Active, Completed, Cancelled
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_test_plans_project ON test_plans(project_id);
CREATE INDEX idx_test_plans_milestone ON test_plans(milestone);
```

#### **test_runs** (execution instances)
```sql
CREATE TABLE test_runs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES test_plans(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  environment VARCHAR(100),                 -- Dev, Staging, Production
  build_version VARCHAR(100),
  assigned_to INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'Open',        -- Open, In Progress, Completed
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_test_runs_project ON test_runs(project_id);
CREATE INDEX idx_test_runs_plan ON test_runs(plan_id);
CREATE INDEX idx_test_runs_assigned ON test_runs(assigned_to);
```

#### **test_run_cases** (link runs to cases)
```sql
CREATE TABLE test_run_cases (
  id SERIAL PRIMARY KEY,
  run_id INTEGER REFERENCES test_runs(id) ON DELETE CASCADE,
  test_case_id INTEGER REFERENCES test_cases(id) ON DELETE CASCADE,
  assigned_to INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'Untested',    -- Untested, Passed, Failed, Blocked, Skipped, Retest
  executed_at TIMESTAMP,
  execution_time INTEGER,                   -- Seconds
  UNIQUE(run_id, test_case_id)
);

CREATE INDEX idx_test_run_cases_run ON test_run_cases(run_id);
CREATE INDEX idx_test_run_cases_test_case ON test_run_cases(test_case_id);
CREATE INDEX idx_test_run_cases_status ON test_run_cases(status);
```

#### **test_results** (execution details)
```sql
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  run_case_id INTEGER REFERENCES test_run_cases(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,              -- Passed, Failed, Blocked, Skipped
  comment TEXT,
  actual_result TEXT,
  steps_results JSONB,                      -- [{step_index, status, comment, screenshot}]
  attachments JSONB DEFAULT '[]',           -- [{filename, url, type}]
  defects JSONB DEFAULT '[]',               -- [{defect_key, url, title}]
  executed_by INTEGER REFERENCES users(id),
  executed_at TIMESTAMP DEFAULT NOW(),
  execution_time INTEGER                    -- Seconds
);

CREATE INDEX idx_test_results_run_case ON test_results(run_case_id);
CREATE INDEX idx_test_results_status ON test_results(status);
CREATE INDEX idx_test_results_executed_by ON test_results(executed_by);
```

#### **defects** (bug tracking)
```sql
CREATE TABLE defects (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  key VARCHAR(50) NOT NULL,                 -- BUG-1, DEFECT-42
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'Medium',    -- Critical, High, Medium, Low
  status VARCHAR(50) DEFAULT 'Open',        -- Open, In Progress, Resolved, Closed
  external_id VARCHAR(255),                 -- Jira issue key
  external_url TEXT,
  found_in_version VARCHAR(100),
  fixed_in_version VARCHAR(100),
  reported_by INTEGER REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_defects_project ON defects(project_id);
CREATE INDEX idx_defects_key ON defects(key);
CREATE INDEX idx_defects_status ON defects(status);
```

#### **ai_prompt_templates** (Codebase-Digest prompts)
```sql
CREATE TABLE ai_prompt_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),                    -- Quality, Testing, Security, Learning
  description TEXT,
  prompt_text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,          -- System templates vs user-created
  is_public BOOLEAN DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_prompt_templates_category ON ai_prompt_templates(category);
CREATE INDEX idx_ai_prompt_templates_created_by ON ai_prompt_templates(created_by);
```

#### **project_members** (team collaboration)
```sql
CREATE TABLE project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'Tester',        -- Admin, Manager, Tester, Viewer
  added_at TIMESTAMP DEFAULT NOW(),
  added_by INTEGER REFERENCES users(id),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
```

---

## Part 3: UI/UX Design & Mockups

### 3.1 Navigation Structure

```
ORIZON Dashboard
├── 🏠 Home
│   ├── Recent Activity
│   ├── Quick Stats
│   └── Assigned Tests
│
├── 📁 Projects
│   ├── All Projects (list view)
│   ├── Create Project
│   └── [Project View]
│       ├── Overview (dashboard)
│       ├── Requirements
│       ├── Test Cases
│       ├── Test Suites
│       ├── Test Plans
│       ├── Test Runs
│       ├── Defects
│       ├── Coverage Matrix
│       ├── Reports
│       └── Settings
│
├── 🤖 AI Analysis
│   ├── Generate Test Cases
│   ├── Analyze Codebase
│   ├── Prompt Library (60+ templates)
│   └── Analysis History
│
├── 📊 Reports
│   ├── Test Coverage
│   ├── Execution Status
│   ├── Traceability Matrix
│   ├── Defect Trends
│   └── Team Performance
│
└── ⚙️ Settings
    ├── Profile
    ├── API Keys
    ├── Integrations
    └── Preferences
```

### 3.2 Key Pages - Detailed Mockups

#### Page 1: Projects List (`/projects`)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ ORIZON - Projects                          [+ New Project] │
├─────────────────────────────────────────────────────────┤
│ Search: [_________]  Filter: [All▾] [Active▾] [My Projects▾]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────────────┐ ┌──────────────────┐             │
│ │ PROJ              │ │ AUTH              │             │
│ │ E-Commerce App    │ │ Auth System       │             │
│ │ Complete testing  │ │ Identity platform │             │
│ │                   │ │                   │             │
│ │ 142 Tests         │ │ 89 Tests          │             │
│ │ 85% Coverage      │ │ 92% Coverage      │             │
│ │ 12 Pending        │ │ 3 Blocked         │             │
│ │                   │ │                   │             │
│ │ [Open Project]    │ │ [Open Project]    │             │
│ └──────────────────┘ └──────────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Page 2: Project Dashboard (`/projects/[id]`)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ PROJ - E-Commerce App                    [⚙️ Settings]    │
├─────────────────────────────────────────────────────────┤
│ Overview  Requirements  Test Cases  Runs  Reports       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ 142      │ │ 85%      │ │ 12       │ │ 5        │  │
│ │ Test Cases│ │ Coverage │ │ Active   │ │ Defects  │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│ Test Execution Status                                  │
│ ┌───────────────────────────────────────────────────┐  │
│ │ ████████████████░░░░░░░░░░                        │  │
│ │ Passed: 98 | Failed: 12 | Blocked: 8 | Skipped: 24│  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ Requirements Coverage                                  │
│ ┌───────────────────────────────────────────────────┐  │
│ │ REQ-1: User Login            ████████████ 100%    │  │
│ │ REQ-2: Product Search        ████████░░░░  80%    │  │
│ │ REQ-3: Shopping Cart         ██████░░░░░░  60%    │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ Recent Activity                                        │
│ • Diego executed TC-142 - Failed (2 min ago)          │
│ • AI generated 15 new test cases (1 hour ago)         │
│ • Test run "Sprint 42" completed (3 hours ago)        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Page 3: Test Cases List (`/projects/[id]/tests`)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ PROJ - Test Cases                      [+ Create Test]  │
│                                        [🤖 AI Generate]  │
├─────────────────────────────────────────────────────────┤
│ Search: [_________]                                     │
│ Filter: Suite [All▾] Priority [All▾] Status [All▾] Type [All▾]│
│ Tags: [login] [checkout] [x]                           │
├──────┬─────────────────────┬──────────┬────────┬───────┤
│ Key  │ Title               │ Priority │ Status │ Type  │
├──────┼─────────────────────┼──────────┼────────┼───────┤
│ TC-1 │ User Login Success  │ Critical │ Ready  │ Func  │
│      │ 📎 3 reqs | ✓ Pass  │          │        │       │
├──────┼─────────────────────┼──────────┼────────┼───────┤
│ TC-2 │ Invalid Password    │ High     │ Ready  │ Func  │
│      │ 📎 2 reqs | ✗ Fail  │          │        │       │
├──────┼─────────────────────┼──────────┼────────┼───────┤
│ TC-3 │ Password Reset      │ Medium   │ Draft  │ Func  │
│      │ 📎 1 req  | - New   │          │        │  🤖   │
├──────┴─────────────────────┴──────────┴────────┴───────┤
│ Showing 3 of 142 test cases                            │
└─────────────────────────────────────────────────────────┘
```

#### Page 4: Test Case Detail (`/projects/[id]/tests/[testId]`)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ TC-1: User Login Success                [Edit] [Delete] │
├─────────────────────────────────────────────────────────┤
│ Status: ● Ready    Priority: Critical    Type: Functional│
│ Created: 2025-11-25 by Diego   Updated: 2025-11-30      │
│ Tags: [login] [auth] [smoke]                           │
├─────────────────────────────────────────────────────────┤
│ Description:                                            │
│ Verify that users can successfully log in with valid   │
│ credentials and access their dashboard.                │
│                                                         │
│ Preconditions:                                         │
│ • User account exists in database                      │
│ • Email is verified                                    │
│ • Application is accessible                            │
│                                                         │
│ Test Steps:                                            │
│ ┌──┬─────────────────────┬──────────────────────┐     │
│ │# │ Step                │ Expected Result      │     │
│ ├──┼─────────────────────┼──────────────────────┤     │
│ │1 │ Navigate to /login  │ Login page displays  │     │
│ │2 │ Enter valid email   │ Field accepts input  │     │
│ │3 │ Enter valid password│ Field masks password │     │
│ │4 │ Click "Login"       │ Redirect to dashboard│     │
│ └──┴─────────────────────┴──────────────────────┘     │
│                                                         │
│ Linked Requirements:                                   │
│ • REQ-1: User Authentication                          │
│ • REQ-5: Session Management                           │
│                                                         │
│ Execution History: (Last 10)                          │
│ • Sprint 42 Run - ✓ Passed (Nov 30, 2:30 PM)         │
│ • Sprint 41 Run - ✓ Passed (Nov 23, 3:15 PM)         │
│ • Regression Run - ✗ Failed (Nov 20, 1:00 PM)        │
│   └─ Defect: BUG-42 "Session timeout too short"      │
│                                                         │
│ AI Generation Info: 🤖                                 │
│ Generated by: Claude Sonnet 4                         │
│ Template: testing_unit_test_generation                │
│ Analysis ID: #1234                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Page 5: Test Run Execution (`/projects/[id]/runs/[runId]`)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Sprint 42 - Regression Testing            [Complete Run]│
├─────────────────────────────────────────────────────────┤
│ Environment: Staging     Build: v2.1.0-rc1             │
│ Assigned to: Diego      Started: Nov 30, 9:00 AM       │
│                                                         │
│ Progress: ████████████░░░░░░░░ 65%                     │
│ Passed: 92 | Failed: 12 | Blocked: 8 | Remaining: 50  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Test Execution                                         │
├──────┬──────────────────────┬──────────┬───────────────┤
│ TC-1 │ User Login Success   │ ✓ Passed │ [View Result] │
│ TC-2 │ Invalid Password     │ ✗ Failed │ [Execute]     │
│ TC-3 │ Password Reset       │ ⏸ Blocked│ [Execute]     │
│ TC-4 │ Product Search       │ — Pending│ [Execute]     │
├──────┴──────────────────────┴──────────┴───────────────┤
│                                                         │
│ [Execute Test Modal]                                   │
│ ┌─────────────────────────────────────────────────────┐│
│ │ TC-2: Invalid Password                              ││
│ │                                                     ││
│ │ Step 1: Navigate to /login                          ││
│ │ Expected: Login page displays                       ││
│ │ Status: [Passed ▾] Comment: [____________]          ││
│ │                                                     ││
│ │ Step 2: Enter invalid password                      ││
│ │ Expected: Error message shows                       ││
│ │ Status: [Failed ▾] Comment: [No error shown]       ││
│ │                                                     ││
│ │ Overall Result: [Failed ▾]                          ││
│ │ Link Defect: [BUG-42] or [Create New Defect]       ││
│ │ Attachments: [Upload Screenshot]                    ││
│ │                                                     ││
│ │ [Submit Result] [Cancel]                            ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Page 6: Traceability Matrix (`/projects/[id]/coverage`)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ PROJ - Traceability Matrix                             │
├─────────────────────────────────────────────────────────┤
│ View: [Requirements → Tests → Defects]                 │
│                                                         │
│ Requirements Coverage:                                 │
│ ┌──────────┬─────────────────────┬──────────┬────────┐ │
│ │ Key      │ Title               │ Tests    │Coverage│ │
│ ├──────────┼─────────────────────┼──────────┼────────┤ │
│ │ REQ-1    │ User Authentication │ 8 tests  │● 100%  │ │
│ │          │ ├─ TC-1 ✓           │          │        │ │
│ │          │ ├─ TC-2 ✗ → BUG-42  │          │        │ │
│ │          │ ├─ TC-3 ⏸           │          │        │ │
│ │          │ └─ TC-7 ✓           │          │        │ │
│ ├──────────┼─────────────────────┼──────────┼────────┤ │
│ │ REQ-2    │ Product Search      │ 5 tests  │◐ 80%   │ │
│ │          │ ├─ TC-15 ✓          │          │        │ │
│ │          │ ├─ TC-16 ✓          │          │        │ │
│ │          │ └─ TC-22 ✗ → BUG-50 │          │        │ │
│ ├──────────┼─────────────────────┼──────────┼────────┤ │
│ │ REQ-3    │ Shopping Cart       │ 3 tests  │○ 60%   │ │
│ │          │ ├─ TC-30 —          │          │        │ │
│ │          │ └─ TC-31 —          │          │        │ │
│ └──────────┴─────────────────────┴──────────┴────────┘ │
│                                                         │
│ [Export Matrix] [Generate Report]                      │
└─────────────────────────────────────────────────────────┘
```

#### Page 7: AI Analysis (`/ai/generate`)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ 🤖 AI-Powered Test Generation                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Input Source:                                          │
│ [●] Paste Code  [ ] GitHub Repo  [ ] Upload Files     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ // Paste your code here                             ││
│ │ function login(email, password) {                   ││
│ │   // ...                                            ││
│ │ }                                                   ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ AI Template:                                           │
│ [testing_unit_test_generation ▾]                       │
│                                                         │
│ [Browse 60+ Templates] [Create Custom Template]        │
│                                                         │
│ Output Options:                                        │
│ ☑ User Stories                                         │
│ ☑ Test Cases                                           │
│ ☑ Acceptance Criteria                                  │
│ ☐ Security Tests                                       │
│                                                         │
│ Save to Project:                                       │
│ [PROJ - E-Commerce App ▾]                              │
│ Suite: [/Regression/Login ▾]                           │
│                                                         │
│ [🤖 Generate Tests]                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Part 4: Key Features & Workflows

### 4.1 Test Management Workflow

```
1. Create Project
   └─ Define project key, description, team members

2. Import Requirements
   └─ Manual entry or Jira sync
   └─ Categorize by type, version, priority

3. Generate Test Cases (AI or Manual)
   └─ AI: Use prompts to generate from code/requirements
   └─ Manual: Use templates to create structured tests
   └─ Link tests to requirements for traceability

4. Organize into Suites
   └─ Create folder structure (/Regression/Login/)
   └─ Group related tests

5. Create Test Plan
   └─ Define milestone (Sprint 42, Release 2.0)
   └─ Select test suites to include

6. Create Test Run
   └─ Link to test plan
   └─ Assign to team members
   └─ Set environment and build version

7. Execute Tests
   └─ Mark each step as Pass/Fail
   └─ Add comments and screenshots
   └─ Link defects to failed tests

8. Track & Report
   └─ View real-time execution status
   └─ Analyze coverage gaps
   └─ Generate traceability matrix
   └─ Export reports for stakeholders
```

### 4.2 AI Integration Workflow

```
1. User uploads codebase or pastes code

2. User selects AI template from library:
   - testing_unit_test_generation
   - security_initial_assessment
   - quality_code_complexity_analysis
   - etc. (60+ templates)

3. ORIZON sends code + template to Claude AI

4. AI generates structured output:
   - User stories
   - Test cases with steps
   - Acceptance criteria
   - Security considerations

5. User reviews AI output

6. User clicks "Save to Project"
   └─ Select target project
   └─ Select test suite/folder
   └─ Map AI output to structured test cases

7. Tests are created in database
   └─ Marked as "AI Generated"
   └─ Linked to original analysis
   └─ Ready for review and execution

8. Team can:
   └─ Refine AI-generated tests
   └─ Add manual test steps
   └─ Link to requirements
   └─ Execute in test runs
```

### 4.3 Traceability Workflow (Xray-style)

```
Requirements → Test Cases → Test Runs → Defects

1. Requirement REQ-1 created
   └─ "User must be able to log in"

2. Test cases TC-1, TC-2, TC-3 linked to REQ-1
   └─ Bidirectional link

3. Test run "Sprint 42" includes TC-1, TC-2, TC-3

4. Execution results:
   ├─ TC-1: Passed ✓
   ├─ TC-2: Failed ✗ → Creates BUG-42
   └─ TC-3: Blocked ⏸

5. Traceability Matrix shows:
   REQ-1 → TC-1 (✓) → No defects
   REQ-1 → TC-2 (✗) → BUG-42 (Open)
   REQ-1 → TC-3 (⏸) → Blocked by BUG-15

6. Coverage Report:
   REQ-1: 67% passed (2/3 tests)
   Overall: Partially covered
```

---

## Part 5: Integration Points

### 5.1 Existing Integrations to Maintain
- Claude AI API (keep current implementation)
- LM Studio (local LLM support)
- PostgreSQL database
- Resend (email notifications)
- NextAuth (authentication)

### 5.2 New Integrations to Add

#### External Issue Trackers
- **Jira**: Sync requirements and defects
- **Azure DevOps**: Import work items
- **GitHub Issues**: Link to repository issues

#### Test Automation Tools
- **Selenium WebDriver**: Link automated scripts
- **Cypress**: Import test specs
- **Playwright**: Integration for e2e tests
- **Jest/Pytest/JUnit**: Parse test results

#### CI/CD Platforms
- **GitHub Actions**: Trigger test runs on PR
- **Jenkins**: Post build test execution
- **GitLab CI**: Pipeline integration

#### Reporting & Analytics
- **Custom Reports**: PDF export
- **Dashboards**: Real-time metrics
- **Webhooks**: External notifications

---

## Part 6: Implementation Phases (Revised)

### Phase 1: Foundation (10-12 hours)
**Goal**: Projects, Test Cases, Basic Traceability

**Tasks**:
1. Database migration (all tables from Part 2)
2. Projects CRUD (pages, API, components)
3. Test Cases CRUD with enhanced fields
4. Test Suites (folder organization)
5. Requirements CRUD
6. Test Coverage (linking requirements to tests)
7. Update sidebar navigation

**Deliverables**:
- Users can create projects
- Users can add requirements
- Users can create test cases
- Users can link tests to requirements
- Basic coverage view

### Phase 2: Test Execution (8-10 hours)
**Goal**: Test Plans, Test Runs, Result Tracking

**Tasks**:
1. Test Plans CRUD
2. Test Runs CRUD
3. Test run execution interface
4. Result submission with step-by-step tracking
5. Defect linking
6. Execution history

**Deliverables**:
- Users can create test plans
- Users can execute test runs
- Step-by-step result tracking
- Link defects to failed tests

### Phase 3: AI Enhancement (6-8 hours)
**Goal**: Connect AI generation to test management

**Tasks**:
1. "Save to Project" after AI generation
2. Bulk import AI-generated tests
3. AI prompt template library (60+ templates)
4. Custom prompt creation
5. AI analysis history linked to projects

**Deliverables**:
- AI-generated tests saved directly to projects
- Browse and use 60+ prompt templates
- Track which tests were AI-generated

### Phase 4: Reporting & Traceability (6-8 hours)
**Goal**: Xray-style coverage and reporting

**Tasks**:
1. Coverage dashboard with charts
2. Traceability matrix (Requirements → Tests → Defects)
3. Execution status reports
4. Defect trends
5. Team performance metrics

**Deliverables**:
- Interactive traceability matrix
- Coverage charts
- Exportable reports

### Phase 5: Integrations & Polish (8-10 hours)
**Goal**: External tool integration

**Tasks**:
1. Jira API integration (requirements/defects sync)
2. GitHub integration (link to repository)
3. Export features (PDF reports, Excel)
4. REST API for automation tools
5. Webhooks for CI/CD

**Deliverables**:
- Jira bidirectional sync
- Automation API
- Professional reports

---

## Part 7: Success Metrics

### User Experience Metrics
- Time to create first test case: < 2 minutes
- Time to execute test run: < 30 seconds per test
- Coverage report generation: < 5 seconds
- AI test generation: < 30 seconds

### Feature Completeness
- ✓ TestRail-level test management
- ✓ Xray-level traceability
- ✓ Repomix-level codebase packing
- ✓ Codebase-Digest prompt library
- ✓ AI-powered test generation (unique feature!)

### Quality Metrics
- 100% test case traceability to requirements
- Real-time execution status tracking
- Historical trend analysis
- Compliance audit trail (FDA/ISO ready)

---

## Part 8: Next Steps

### Immediate Action (This Session)
1. Review this design document
2. Confirm database schema
3. Confirm UI mockups
4. Prioritize features for Phase 1

### Next Session
1. Create database migration script
2. Build Phase 1 (Projects + Test Cases + Requirements)
3. Create UI components
4. Test basic workflows

---

## Sources

**Research References**:
- [Repomix GitHub](https://github.com/yamadashy/repomix)
- [Codebase-Digest GitHub](https://github.com/kamilstanuch/codebase-digest)
- [TestRail Introduction](https://support.testrail.com/hc/en-us/articles/7076810203028-Introduction-to-TestRail)
- [TestRail Best Practices: Test Cases](https://support.testrail.com/hc/en-us/articles/32781644837396-Best-Practices-Guide-Test-Cases)
- [TestRail Best Practices: Test Runs](https://support.testrail.com/hc/en-us/articles/32784099933844-Best-Practices-Guide-Test-Runs-and-Results)
- [Xray Test Management Guide](https://www.getxray.app/blog/xray-test-management-for-jira)
- [Xray Traceability Documentation](https://docs.getxray.app/display/XRAY/Traceability+Report)

---

**END OF DESIGN DOCUMENT**
