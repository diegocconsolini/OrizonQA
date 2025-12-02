# ORIZON Dashboard Rebuild - Final Plan

**Date:** 2025-12-02
**Status:** APPROVED - Ready for Implementation
**Version:** 3.0 (Final)

---

## Strategic Decisions (Confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Route Naming** | `/dashboard` → `/analyze` | Clear separation: `/analyze` for core feature, `/dashboard` for overview |
| **Template Strategy** | Hybrid | Curated starter templates + reviewed user submissions |
| **Timeline** | Quality-focused | No time pressure, deliver excellence |
| **Code Editor** | Monaco Editor | Full VS Code experience, best developer UX |

---

## Executive Summary

Transform the current basic dashboard into a **premium AI-assisted QA analysis platform** with:

1. **New Route Structure**: `/analyze` (core feature) + `/dashboard` (overview)
2. **Template Gallery**: 15-20 curated templates with user contribution system
3. **Monaco Editor**: Professional code editing experience
4. **Rich Results**: Syntax highlighting, coverage visualization, export options
5. **Intelligence Layer**: AI explanations, quality scoring, smart suggestions
6. **Analytics Dashboard**: Usage insights, cost tracking, trends

---

## Part 1: Architecture Overview

### New Route Structure

```
BEFORE:
/dashboard     → Basic 3-tab analysis interface

AFTER:
/dashboard     → NEW overview page (analytics, recent activity, quick actions)
/analyze       → RENAMED core analysis interface (enhanced)
/analyze/templates           → Template gallery
/analyze/templates/new       → Create custom template
/analyze/[id]                → View past analysis details
/analyze/[id]/rerun          → Re-run with modifications
/analyze/compare             → Compare multiple analyses
```

### File Structure (Target)

```
app/
├── dashboard/                        # 🆕 NEW - Overview Dashboard
│   └── page.js                      # Analytics, recent activity, quick actions
│
├── analyze/                          # 🔄 RENAMED from /dashboard
│   ├── page.js                      # Main analysis interface (redesigned)
│   ├── templates/
│   │   ├── page.js                  # Template gallery
│   │   └── new/page.js              # Create custom template
│   ├── [id]/
│   │   ├── page.js                  # Analysis detail view
│   │   └── rerun/page.js            # Re-run with modifications
│   ├── compare/page.js              # Compare analyses
│   └── components/
│       ├── AnalysisWizard.jsx       # 🆕 Step-by-step guided flow
│       ├── MonacoEditor.jsx         # 🆕 Code editor wrapper
│       ├── TemplateGallery.jsx      # 🆕 Template browser
│       ├── TemplateCard.jsx         # 🆕 Template display
│       ├── ConfigPanel.jsx          # 🔄 Enhanced configuration
│       ├── ConfigPresets.jsx        # 🆕 Quick config options
│       ├── ResultsViewer.jsx        # 🆕 Rich results display
│       ├── CoverageHeatmap.jsx      # 🆕 Visual coverage
│       ├── ExplainPanel.jsx         # 🆕 AI reasoning display
│       ├── QualityScore.jsx         # 🆕 A-F grade display
│       ├── CompareView.jsx          # 🆕 Side-by-side comparison
│       └── ExportOptions.jsx        # 🆕 Export functionality
│
├── components/
│   ├── input/
│   │   ├── InputSection.jsx         # 🔄 Keep, enhance
│   │   └── FileTree.jsx             # Keep as-is
│   ├── config/
│   │   ├── ConfigSection.jsx        # 🔄 Keep, enhance
│   │   └── ApiKeyInput.jsx          # Keep as-is
│   └── output/
│       └── OutputSection.jsx        # 🔄 Replace with ResultsViewer
│
├── hooks/
│   ├── useAnalysis.js               # 🔄 Keep, enhance
│   ├── useFileUpload.js             # Keep as-is
│   ├── useGitHubFetch.js            # Keep as-is
│   ├── useTemplates.js              # 🆕 Template management
│   ├── useMonacoEditor.js           # 🆕 Editor state
│   └── useAnalysisComparison.js     # 🆕 Compare functionality
│
├── contexts/
│   └── AnalysisContext.jsx          # 🆕 Shared analysis state
│
└── api/
    ├── analyze/route.js             # Keep, enhance
    ├── templates/
    │   ├── route.js                 # 🆕 List/create templates
    │   └── [id]/route.js            # 🆕 Get/update/delete template
    ├── analyses/
    │   ├── [id]/route.js            # 🆕 Get analysis details
    │   ├── [id]/rerun/route.js      # 🆕 Re-run analysis
    │   └── compare/route.js         # 🆕 Compare analyses
    └── intelligence/
        ├── explain/route.js         # 🆕 AI explanation
        ├── quality-score/route.js   # 🆕 Quality rating
        └── suggest-config/route.js  # 🆕 Smart suggestions
```

---

## Part 2: Database Schema

### New Tables

```sql
-- ============================================
-- TEMPLATES SYSTEM
-- ============================================

-- Main templates table
CREATE TABLE analysis_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,          -- URL-friendly identifier
  description TEXT,
  category VARCHAR(100) NOT NULL,             -- 'web', 'api', 'mobile', 'backend', 'data', 'security'
  language VARCHAR(50) NOT NULL,              -- 'javascript', 'python', 'java', etc.
  framework VARCHAR(100),                      -- 'react', 'express', 'django', etc.
  code_sample TEXT NOT NULL,
  config JSONB NOT NULL,                       -- Default analysis configuration

  -- Visibility & ownership
  is_public BOOLEAN DEFAULT false,            -- Visible to all users
  is_featured BOOLEAN DEFAULT false,          -- Show on homepage/gallery
  is_curated BOOLEAN DEFAULT false,           -- Official ORIZON template
  status VARCHAR(50) DEFAULT 'draft',         -- 'draft', 'pending_review', 'approved', 'rejected'
  user_id INTEGER REFERENCES users(id),       -- Creator (null for system templates)

  -- Metrics
  usage_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP                       -- When approved/published
);

-- Template categories (for dynamic category management)
CREATE TABLE template_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),                            -- Lucide icon name
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Template ratings
CREATE TABLE template_ratings (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES analysis_templates(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Template usage tracking
CREATE TABLE template_usage (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES analysis_templates(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),        -- Null for anonymous
  analysis_id INTEGER REFERENCES analyses(id),
  used_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USER PREFERENCES
-- ============================================

CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE ON DELETE CASCADE,

  -- Default configuration
  default_config JSONB DEFAULT '{
    "userStories": true,
    "testCases": true,
    "acceptanceCriteria": true,
    "edgeCases": false,
    "securityTests": false,
    "outputFormat": "markdown",
    "testFramework": "generic"
  }',

  -- Preferences
  preferred_provider VARCHAR(50) DEFAULT 'claude',
  preferred_language VARCHAR(50),              -- Default code language
  editor_theme VARCHAR(50) DEFAULT 'vs-dark',  -- Monaco theme
  editor_font_size INTEGER DEFAULT 14,

  -- Favorites
  favorite_template_ids INTEGER[] DEFAULT '{}',
  pinned_analysis_ids INTEGER[] DEFAULT '{}',

  -- Onboarding state
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,

  -- Feature flags
  show_token_usage BOOLEAN DEFAULT true,
  show_cost_estimate BOOLEAN DEFAULT true,
  auto_save_results BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ANALYSIS ENHANCEMENTS
-- ============================================

-- Add columns to existing analyses table
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS quality_score VARCHAR(1);           -- A, B, C, D, F
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS quality_breakdown JSONB;             -- Detailed scoring
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS coverage_data JSONB;                 -- For heatmap
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS ai_explanation TEXT;                 -- Explain mode result
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES analysis_templates(id);
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Analysis comparisons
CREATE TABLE analysis_comparisons (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  analysis_ids INTEGER[] NOT NULL,             -- Array of analysis IDs
  comparison_notes JSONB,                       -- User notes per analysis
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_templates_category ON analysis_templates(category);
CREATE INDEX idx_templates_language ON analysis_templates(language);
CREATE INDEX idx_templates_status ON analysis_templates(status);
CREATE INDEX idx_templates_featured ON analysis_templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_templates_public ON analysis_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_template_usage_template ON template_usage(template_id);
CREATE INDEX idx_template_usage_user ON template_usage(user_id);
CREATE INDEX idx_analyses_template ON analyses(template_id);
CREATE INDEX idx_analyses_favorite ON analyses(user_id, is_favorite) WHERE is_favorite = true;
```

### Seed Data: Initial Categories

```sql
INSERT INTO template_categories (name, slug, description, icon, display_order) VALUES
('Web Applications', 'web', 'Frontend frameworks, SPAs, full-stack web apps', 'Globe', 1),
('REST APIs', 'api', 'RESTful services, Express, FastAPI, Spring Boot', 'Server', 2),
('Mobile Apps', 'mobile', 'React Native, Flutter, iOS, Android', 'Smartphone', 3),
('Backend Services', 'backend', 'Microservices, workers, batch processing', 'Database', 4),
('Data & ML', 'data', 'ETL pipelines, ML models, data processing', 'BarChart', 5),
('Security', 'security', 'Authentication, authorization, security testing', 'Shield', 6),
('DevOps', 'devops', 'CI/CD, infrastructure, deployment scripts', 'GitBranch', 7),
('Blockchain', 'blockchain', 'Smart contracts, Web3, DeFi', 'Blocks', 8);
```

---

## Part 3: Phase Implementation Details

### Phase 1: Foundation + Quick Wins

**Goal**: Establish new architecture and deliver immediate value

#### 1.1 Route Restructuring

**Tasks:**
1. Create `/app/analyze/page.js` (copy from current dashboard)
2. Create `/app/dashboard/page.js` (new overview page)
3. Update `Sidebar.jsx` navigation links
4. Update `middleware.js` for protected routes
5. Add redirect: `/dashboard` → `/analyze` (temporary, for transition)
6. Update all internal links

**New Dashboard Overview (`/dashboard`):**
```jsx
// Key sections:
// 1. Hero: Quick Analysis CTA + greeting
// 2. Recent Analyses: Last 5 with quick actions
// 3. Stats Cards: Total analyses, tokens used, favorite templates
// 4. Quick Actions: New Analysis, Browse Templates, View History
// 5. Featured Templates: Top 3 curated templates
```

#### 1.2 Monaco Editor Integration

**Installation:**
```bash
npm install @monaco-editor/react
```

**Component: `MonacoEditor.jsx`**
```jsx
'use client';

import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

export default function MonacoEditor({
  value,
  onChange,
  language = 'javascript',
  theme = 'vs-dark',
  height = '400px',
  readOnly = false,
  onLanguageDetect
}) {
  const editorRef = useRef(null);
  const [detectedLanguage, setDetectedLanguage] = useState(language);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    // Auto-detect language on paste
    editor.onDidPaste(() => {
      const content = editor.getValue();
      const detected = detectLanguage(content);
      if (detected !== detectedLanguage) {
        setDetectedLanguage(detected);
        monaco.editor.setModelLanguage(editor.getModel(), detected);
        onLanguageDetect?.(detected);
      }
    });
  };

  const detectLanguage = (code) => {
    // Simple heuristics for language detection
    if (code.includes('import React') || code.includes('useState')) return 'javascript';
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('public class') || code.includes('System.out')) return 'java';
    if (code.includes('func ') && code.includes('package')) return 'go';
    if (code.includes('fn ') && code.includes('let mut')) return 'rust';
    if (code.includes('<?php')) return 'php';
    if (code.includes('SELECT') || code.includes('INSERT INTO')) return 'sql';
    return 'plaintext';
  };

  return (
    <div className="rounded-lg overflow-hidden border border-white/10">
      <div className="bg-surface-dark px-4 py-2 flex items-center justify-between border-b border-white/10">
        <span className="text-sm text-text-secondary-dark">
          Language: <span className="text-primary">{detectedLanguage}</span>
        </span>
        <div className="flex gap-2">
          {/* Language selector dropdown */}
        </div>
      </div>
      <Editor
        height={height}
        language={detectedLanguage}
        value={value}
        onChange={onChange}
        theme={theme}
        onMount={handleEditorMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 16, bottom: 16 }
        }}
      />
    </div>
  );
}
```

#### 1.3 Onboarding Wizard

**Component: `OnboardingWizard.jsx`**

Steps:
1. **Welcome**: Introduction to ORIZON, what it does
2. **Try It**: Sample analysis with pre-filled code
3. **Configure**: Explain configuration options
4. **Done**: Success, show results, offer templates

```jsx
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to ORIZON',
    description: 'Generate comprehensive QA artifacts from your code in seconds',
    action: 'Get Started'
  },
  {
    id: 'try-it',
    title: 'Try a Sample Analysis',
    description: 'See ORIZON in action with a real code example',
    action: 'Run Sample',
    showSampleCode: true
  },
  {
    id: 'configure',
    title: 'Customize Your Analysis',
    description: 'Choose what QA artifacts to generate',
    action: 'Continue',
    showConfig: true
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start analyzing your own code or explore templates',
    action: 'Start Analyzing'
  }
];
```

#### 1.4 Config Presets

**Presets Definition:**
```javascript
const CONFIG_PRESETS = {
  quick: {
    name: 'Quick Scan',
    description: 'Fast analysis with essential tests',
    icon: 'Zap',
    config: {
      userStories: true,
      testCases: true,
      acceptanceCriteria: false,
      edgeCases: false,
      securityTests: false,
      outputFormat: 'markdown',
      testFramework: 'generic'
    }
  },
  comprehensive: {
    name: 'Deep Analysis',
    description: 'Thorough analysis with all artifacts',
    icon: 'Search',
    config: {
      userStories: true,
      testCases: true,
      acceptanceCriteria: true,
      edgeCases: true,
      securityTests: false,
      outputFormat: 'markdown',
      testFramework: 'generic'
    }
  },
  security: {
    name: 'Security Focus',
    description: 'Security-oriented testing',
    icon: 'Shield',
    config: {
      userStories: false,
      testCases: true,
      acceptanceCriteria: false,
      edgeCases: true,
      securityTests: true,
      outputFormat: 'markdown',
      testFramework: 'generic'
    }
  },
  documentation: {
    name: 'Documentation',
    description: 'User stories and acceptance criteria',
    icon: 'FileText',
    config: {
      userStories: true,
      testCases: false,
      acceptanceCriteria: true,
      edgeCases: false,
      securityTests: false,
      outputFormat: 'markdown',
      testFramework: 'generic'
    }
  }
};
```

#### 1.5 Sample Analysis

**Sample Code for Demo:**
```javascript
const SAMPLE_CODES = {
  javascript: {
    name: 'Express.js Authentication',
    language: 'javascript',
    code: `// User Authentication Controller
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        name
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({ user: { id: user.id, email, name }, token });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
}

module.exports = new AuthController();`
  },
  python: {
    name: 'FastAPI CRUD Operations',
    language: 'python',
    code: `# Product API with FastAPI
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    stock: int

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    created_at: datetime

    class Config:
        orm_mode = True

@app.post("/products/", response_model=ProductResponse)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product."""
    if product.price < 0:
        raise HTTPException(status_code=400, detail="Price cannot be negative")
    if product.stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")

    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/products/", response_model=List[ProductResponse])
async def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all products with pagination."""
    products = db.query(Product).offset(skip).limit(limit).all()
    return products

@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}`
  }
};
```

---

### Phase 2: Template Gallery

**Goal**: Accelerate adoption with ready-to-use templates

#### 2.1 Template Gallery Page

**Layout:**
- Hero: Search bar + category filters
- Featured: 3-4 highlighted templates (carousel)
- Grid: All templates by category
- Sidebar: Categories, languages, popularity sort

#### 2.2 Initial Templates (15 Curated)

| # | Name | Category | Language | Framework |
|---|------|----------|----------|-----------|
| 1 | REST API Authentication | api | JavaScript | Express |
| 2 | React Form Component | web | JavaScript | React |
| 3 | FastAPI CRUD | api | Python | FastAPI |
| 4 | Django Model & Views | web | Python | Django |
| 5 | Spring Boot Controller | api | Java | Spring |
| 6 | React Native Screen | mobile | JavaScript | React Native |
| 7 | Flutter Widget | mobile | Dart | Flutter |
| 8 | Node.js Worker | backend | JavaScript | Node.js |
| 9 | Python ETL Pipeline | data | Python | Pandas |
| 10 | SQL Query Optimization | data | SQL | PostgreSQL |
| 11 | JWT Middleware | security | JavaScript | Express |
| 12 | Input Validation | security | JavaScript | Zod |
| 13 | GitHub Action | devops | YAML | GitHub |
| 14 | Terraform Module | devops | HCL | Terraform |
| 15 | Solidity Contract | blockchain | Solidity | Ethereum |

#### 2.3 Template Submission Flow

1. User creates analysis with their code
2. "Save as Template" button appears on results
3. Form: Name, description, category, tags
4. Submit for review (status: pending_review)
5. Admin reviews and approves/rejects
6. Approved templates appear in gallery (is_public: true)

---

### Phase 3: Results Enhancement

**Goal**: Transform results from plain text to rich, actionable output

#### 3.1 Rich Results Viewer

**Features:**
- Syntax highlighting (Prism.js or Monaco for read-only)
- Collapsible sections (User Stories / Tests / Criteria)
- Search within results (Cmd+F)
- Section navigation (jump to tests, criteria, etc.)
- Full-screen mode
- Print-friendly view

**Layout Options:**
1. **Tabbed** (current): Separate tabs per section
2. **Stacked**: All sections visible, collapsible
3. **Split**: Input on left, results on right

#### 3.2 Coverage Heatmap

**Implementation:**
- Parse generated tests to identify covered areas
- Map tests to code sections (functions, classes)
- Display heatmap: green (covered) / red (not covered)
- Click on area to see related tests

**Simple Version (Phase 3):**
- File-level coverage (which files have tests)
- Function-level coverage (which functions mentioned in tests)

**Advanced Version (Phase 4+):**
- Line-level coverage estimation
- Integration with actual test runners

#### 3.3 Compare Mode

**Features:**
- Select 2+ analyses to compare
- Side-by-side view
- Diff highlighting (what's different)
- Merge best parts from each
- Save comparison for future reference

#### 3.4 Export Options

| Format | Description | Use Case |
|--------|-------------|----------|
| Markdown | Clean .md file | Documentation, README |
| JSON | Structured data | Integration, automation |
| PDF | Formatted document | Sharing, printing |
| Jira | Jira-compatible markup | Direct import to Jira |
| HTML | Standalone webpage | Sharing without auth |
| GitHub Issue | GH issue format | Create issues directly |

---

### Phase 4: Intelligence Layer

**Goal**: Add AI-powered insights and recommendations

#### 4.1 Explain Mode

**Prompt Enhancement:**
```javascript
const EXPLAIN_PROMPT = `
For each test case you generated, provide a brief explanation:
1. WHY this test is important
2. WHAT it protects against
3. WHEN it might fail (common scenarios)

Format as:
### Test: [Test Name]
**Why**: [Explanation]
**Protects Against**: [Risk/Bug type]
**Watch For**: [Common failure scenarios]
`;
```

**UI:**
- "Explain" button on each test case
- Expandable panel showing reasoning
- Link to related documentation/best practices

#### 4.2 Quality Score

**Scoring Algorithm:**
```javascript
const calculateQualityScore = (analysis) => {
  let score = 0;
  const breakdown = {};

  // Coverage (40%)
  const coverageScore = calculateCoverageScore(analysis);
  breakdown.coverage = coverageScore;
  score += coverageScore * 0.4;

  // Test variety (20%)
  const varietyScore = calculateVarietyScore(analysis);
  breakdown.variety = varietyScore;
  score += varietyScore * 0.2;

  // Edge cases (20%)
  const edgeCaseScore = calculateEdgeCaseScore(analysis);
  breakdown.edgeCases = edgeCaseScore;
  score += edgeCaseScore * 0.2;

  // Security coverage (20%)
  const securityScore = calculateSecurityScore(analysis);
  breakdown.security = securityScore;
  score += securityScore * 0.2;

  // Convert to letter grade
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return { grade, score, breakdown };
};
```

**Display:**
- Large letter grade (A-F) with color coding
- Breakdown chart (radar or bar)
- Recommendations for improvement

#### 4.3 Smart Config Suggestions

**Logic:**
```javascript
const suggestConfig = async (code) => {
  const suggestions = [];

  // Detect auth patterns → suggest security tests
  if (hasAuthPatterns(code)) {
    suggestions.push({
      setting: 'securityTests',
      value: true,
      reason: 'Authentication code detected - security tests recommended'
    });
  }

  // Detect API patterns → suggest specific framework
  if (hasExpressPatterns(code)) {
    suggestions.push({
      setting: 'testFramework',
      value: 'jest',
      reason: 'Express.js detected - Jest is commonly used'
    });
  }

  // Complex logic → suggest edge cases
  if (hasComplexLogic(code)) {
    suggestions.push({
      setting: 'edgeCases',
      value: true,
      reason: 'Complex conditionals detected - edge cases recommended'
    });
  }

  return suggestions;
};
```

---

### Phase 5: Analytics Dashboard

**Goal**: Provide visibility into usage patterns and value delivered

#### 5.1 New Dashboard Overview Page

**Sections:**

1. **Hero**
   - Greeting: "Good morning, [Name]"
   - CTA: "New Analysis" button (prominent)
   - Quick stat: "You've generated X tests this month"

2. **Recent Analyses** (5 items)
   - Title, date, quality score badge
   - Quick actions: View, Re-run, Delete

3. **Stats Cards** (4 cards)
   - Total Analyses (all time)
   - Tests Generated (this month)
   - Token Usage (this month with trend)
   - Favorite Templates (count)

4. **Token Usage Chart**
   - Line chart: Last 30 days
   - Breakdown: Input vs Output tokens
   - Cost estimate (if Claude provider)

5. **Quick Actions**
   - New Analysis
   - Browse Templates
   - View All History
   - Manage Settings

6. **Featured Templates**
   - 3 curated templates with "Use" button

#### 5.2 Token Analytics

**Detailed View:**
- Daily/weekly/monthly breakdown
- By provider (Claude vs LM Studio)
- By analysis type (user stories, tests, criteria)
- Cost calculator with pricing tiers
- Export usage report (CSV)

---

### Phase 6: Integration & Scale

**Goal**: Connect with existing modules and external tools

#### 6.1 Projects Module Integration

**Features:**
- "Add to Project" button on analysis results
- Auto-create test cases from analysis
- Link analyses to requirements
- Coverage dashboard in project view

**Implementation:**
- Add `project_id` column to analyses table
- API endpoint: `POST /api/projects/:id/analyses/:analysisId/import`
- Parse test cases and create TestCase records
- Link to requirements if matching

#### 6.2 CI/CD Integration (Future)

**GitHub Action:**
```yaml
name: ORIZON Analysis
on: [pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: orizon/analyze-action@v1
        with:
          api-key: ${{ secrets.ORIZON_API_KEY }}
          files: 'src/**/*.js'
          config: 'security'
      - name: Post Results
        uses: actions/github-script@v6
        with:
          script: |
            // Post analysis results as PR comment
```

#### 6.3 API Access

**Endpoints for External Use:**
```
POST /api/v1/analyze
  - API key authentication
  - Same functionality as web interface
  - Returns JSON response

GET /api/v1/analyses
  - List user's analyses
  - Pagination, filtering

GET /api/v1/analyses/:id
  - Get specific analysis

POST /api/v1/analyses/:id/export
  - Export in various formats
```

---

## Part 4: UI/UX Specifications

### Design System Alignment

All new components must follow ORIZON design system:

**Colors:**
- Primary: `primary` (#00D4FF)
- Accent: `accent` (#FF9500)
- Background: `bg-dark` (#0A0A0A)
- Surface: `surface-dark` (#1A1A1A)
- Text: `text-primary-dark`, `text-secondary-dark`, `text-muted-dark`

**Typography:**
- Headings: `font-primary` (Outfit)
- Body: `font-secondary` (Inter)
- Code: `font-mono` (JetBrains Mono)

**Components:**
- Use existing UI components from `/app/components/ui`
- Extend with new specialized components as needed

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Single column, stacked sections |
| Tablet | 768px - 1199px | Two columns, condensed sidebar |
| Desktop | 1200px+ | Full layout, side-by-side panels |

### Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation for all features
- Screen reader support
- High contrast mode support
- Focus indicators on interactive elements

---

## Part 5: Testing Strategy

### Unit Tests

**Coverage Targets:**
- Hooks: 90%+ coverage
- Utility functions: 95%+ coverage
- API routes: 80%+ coverage

**Key Test Files:**
```
__tests__/
├── hooks/
│   ├── useAnalysis.test.js
│   ├── useTemplates.test.js
│   └── useMonacoEditor.test.js
├── components/
│   ├── MonacoEditor.test.jsx
│   ├── TemplateGallery.test.jsx
│   └── ResultsViewer.test.jsx
├── api/
│   ├── analyze.test.js
│   ├── templates.test.js
│   └── intelligence.test.js
└── utils/
    ├── qualityScore.test.js
    └── languageDetection.test.js
```

### Integration Tests

- Full analysis flow (input → config → results)
- Template creation and usage
- Export functionality
- Compare mode

### E2E Tests (Playwright)

```javascript
// analyze.spec.js
test('complete analysis flow', async ({ page }) => {
  await page.goto('/analyze');

  // Paste code
  await page.fill('[data-testid="code-editor"]', sampleCode);

  // Configure
  await page.click('[data-testid="preset-security"]');

  // Run analysis
  await page.click('[data-testid="analyze-button"]');

  // Wait for results
  await expect(page.locator('[data-testid="results-viewer"]')).toBeVisible();

  // Check quality score
  await expect(page.locator('[data-testid="quality-score"]')).toHaveText(/[A-F]/);
});
```

---

## Part 6: Deployment & Migration

### Migration Steps

1. **Database Migrations**
   - Run schema updates (new tables, columns)
   - Seed initial template categories
   - Seed curated templates

2. **Route Migration**
   - Deploy new routes alongside existing
   - Add feature flag for new dashboard
   - Gradual rollout (10% → 50% → 100%)

3. **Redirect Setup**
   - `/dashboard` → `/analyze` (after full rollout)
   - Preserve old URLs for bookmarks

### Feature Flags

```javascript
const FEATURE_FLAGS = {
  NEW_DASHBOARD: process.env.NEXT_PUBLIC_FF_NEW_DASHBOARD === 'true',
  TEMPLATES: process.env.NEXT_PUBLIC_FF_TEMPLATES === 'true',
  COMPARE_MODE: process.env.NEXT_PUBLIC_FF_COMPARE === 'true',
  EXPLAIN_MODE: process.env.NEXT_PUBLIC_FF_EXPLAIN === 'true',
  QUALITY_SCORE: process.env.NEXT_PUBLIC_FF_QUALITY_SCORE === 'true'
};
```

### Rollback Plan

1. Feature flags allow instant disable
2. Database migrations are additive (no column drops)
3. Old dashboard code preserved in `/dashboard/legacy`
4. Monitoring for errors/issues post-deploy

---

## Part 7: Success Metrics

### Phase 1 Success Criteria
- [ ] New routes working correctly
- [ ] Monaco Editor loads in < 3 seconds
- [ ] Onboarding wizard completion rate > 70%
- [ ] Sample analysis works flawlessly
- [ ] Zero critical bugs

### Phase 2 Success Criteria
- [ ] 15 curated templates live
- [ ] Template gallery search works
- [ ] 50%+ of analyses use templates
- [ ] Template submission flow working

### Phase 3 Success Criteria
- [ ] Rich results viewer rendering correctly
- [ ] All export formats working
- [ ] Compare mode functional
- [ ] Coverage heatmap displaying

### Phase 4 Success Criteria
- [ ] Explain mode providing useful insights
- [ ] Quality scores correlate with actual quality
- [ ] Smart suggestions improving configurations

### Phase 5 Success Criteria
- [ ] New dashboard showing accurate analytics
- [ ] Token usage tracking accurate
- [ ] Cost estimates within 10% of actual

### Phase 6 Success Criteria
- [ ] Projects integration working end-to-end
- [ ] API access functional with documentation
- [ ] CI/CD integration usable

---

## Part 8: Open Items & Future Considerations

### Post-MVP Enhancements
- Team workspaces and collaboration
- Custom AI model fine-tuning
- Self-hosted deployment option
- Plugin/extension system
- Mobile app (React Native)

### Technical Debt to Address
- Migrate remaining components to design system
- Add comprehensive error boundaries
- Implement proper caching strategy
- Optimize bundle size (code splitting)

### Monitoring & Observability
- Error tracking (Sentry)
- Analytics (Mixpanel/Amplitude)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring (Pingdom/StatusPage)

---

## Appendix A: Component Specifications

[Detailed component specs would go here - props, events, styling]

## Appendix B: API Documentation

[Full API documentation would go here - endpoints, request/response schemas]

## Appendix C: Template Content

[Full content of all 15 curated templates would go here]

---

**Document Status:** FINAL - Ready for Implementation
**Approved By:** [User]
**Approval Date:** 2025-12-02
**Implementation Start:** Ready when you are

---

**Next Steps:**
1. Create database migration scripts
2. Set up feature flags in environment
3. Begin Phase 1 implementation
4. Schedule regular progress reviews
