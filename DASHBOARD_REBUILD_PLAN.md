# ORIZON Dashboard Rebuild - Comprehensive Plan

**Date:** 2025-12-02
**Status:** DRAFT - Awaiting Review & Refinement
**Priority:** CRITICAL - Core Product Feature

---

## Executive Summary

The current Dashboard (`/app/dashboard/page.js`) is the **core product feature** of ORIZON - the AI-assisted Code-to-QA/Test analysis system. Despite being the most important functionality, it currently has a basic, minimal interface that doesn't reflect its significance or provide the optimal user experience for a professional QA tool.

### The Problem

1. **Basic Tabbed Interface**: Simple 3-tab layout (Input → Configure → Results) doesn't showcase the power of the tool
2. **Hidden in Plain Sight**: The dashboard URL `/dashboard` doesn't emphasize this is the PRIMARY feature
3. **Minimal UX**: No visual hierarchy, limited guidance, basic workflow
4. **Poor Discovery**: Users might not realize this is the main value proposition
5. **Limited Context**: No templates, examples, or quick-start workflows
6. **Basic Results Display**: Output section lacks advanced features like comparison, versioning, export options
7. **No Workflow Memory**: Doesn't save user preferences, recent configs, or favorite settings
8. **Missing Analytics**: No insights on token usage trends, cost estimation, or analysis history

### The Vision

Transform the Dashboard into a **premium AI-assisted QA analysis platform** with:
- Professional, modern interface that reflects enterprise-grade quality
- Multi-step guided workflows for different use cases
- Rich templates and examples to accelerate adoption
- Advanced result management (save, compare, export, share)
- Smart context awareness (remember settings, suggest improvements)
- Visual analytics and insights dashboard
- Seamless integration with Projects module

---

## Current State Analysis

### File Structure (As-Is)

```
app/
├── dashboard/page.js              # Main dashboard (318 lines)
├── components/
│   ├── input/
│   │   └── InputSection.jsx      # Code input (paste/GitHub/upload)
│   ├── config/
│   │   ├── ConfigSection.jsx     # Analysis configuration
│   │   └── ApiKeyInput.jsx       # API key management
│   ├── output/
│   │   └── OutputSection.jsx     # Results display
│   └── shared/
│       └── Alert.jsx             # Notifications
├── hooks/
│   ├── useAnalysis.js            # API calls & result management
│   ├── useFileUpload.js          # File processing
│   └── useGitHubFetch.js         # GitHub integration
└── api/
    └── analyze/route.js          # Backend API endpoint
```

### Current Features Inventory

**Input Methods** (3 types):
1. ✅ Direct code paste
2. ✅ GitHub repository fetch (with branch selection, OAuth integration)
3. ✅ File upload (single files + .zip archives)

**Analysis Configuration**:
- ✅ User Stories generation (on/off)
- ✅ Test Cases generation (on/off)
- ✅ Acceptance Criteria (on/off)
- ✅ Edge Cases (on/off)
- ✅ Security Tests (on/off)
- ✅ Output Format (Markdown/JSON/Jira)
- ✅ Test Framework (Jest/Pytest/JUnit/Generic)
- ✅ Additional Context (free text)

**AI Providers**:
- ✅ Claude API (Anthropic) - `claude-sonnet-4-20250514`
- ✅ LM Studio (local LLMs) - OpenAI-compatible API

**API Key Management**:
- ✅ Per-session API key input
- ✅ Saved encrypted keys (user settings)
- ✅ Auto-load saved keys on dashboard

**Results Display**:
- ✅ Tabbed output (User Stories / Test Cases / Acceptance Criteria)
- ✅ Token usage display
- ✅ Copy to clipboard
- ✅ Download as file

**Database Integration**:
- ✅ Analysis records saved to PostgreSQL
- ✅ Linked to user accounts (if authenticated)
- ✅ Content hash for deduplication
- ✅ Token usage tracking
- ✅ History page with search/filter

**Prompt System**:
- ✅ Modular template-based prompts (`prompts/templates/`)
- ✅ Dynamic prompt builder (`lib/promptBuilder.js`)
- ✅ Framework-specific instructions
- ✅ Format-specific output instructions

### Key Strengths (To Preserve)

1. **Solid Architecture**: Clean separation with hooks, components, API routes
2. **Multiple Input Methods**: Flexible for different user workflows
3. **AI Provider Flexibility**: Claude + LM Studio support
4. **Template System**: Professional, well-structured prompts
5. **Database Integration**: Analysis history already working
6. **Security**: Encrypted API keys, secure session handling

### Major Gaps (To Address)

1. **No Onboarding**: First-time users don't know where to start
2. **No Templates**: Users must provide code every time, no quick examples
3. **No Workflow Guidance**: Unclear what configurations are best for what scenarios
4. **Basic Results UI**: Just tabs with text, no rich formatting or actions
5. **No Result Management**: Can't save favorites, compare versions, or organize
6. **No Visual Analytics**: Token usage shown but no trends or cost insights
7. **Missing Collaboration**: Can't share configs or results with team
8. **No Smart Defaults**: Doesn't learn from user behavior or suggest optimizations

---

## Competitive Analysis & Industry Research

### Reference: Modern AI Development Tools

**GitHub Copilot Workspace**:
- Natural language to code workflow
- Side-by-side input/output views
- Real-time streaming responses
- Version comparison
- Context-aware suggestions

**Cursor IDE**:
- Inline AI assistance
- Multi-file context awareness
- Command palette for quick actions
- AI chat with codebase context
- Diff views for changes

**Replit AI**:
- Project templates gallery
- Guided onboarding flows
- Collaborative features
- Export & deployment options

**v0.dev (Vercel)**:
- Prompt-first UI generation
- Multiple design variations
- Real-time preview
- One-click export

### Key Learnings

1. **Templates First**: Show examples/templates before asking for input
2. **Guided Workflows**: Step-by-step for common use cases
3. **Rich Previews**: Visual, formatted results with syntax highlighting
4. **Version Control**: Compare different runs, save favorites
5. **Context Persistence**: Remember user preferences and history
6. **Smart Suggestions**: AI-powered config recommendations

---

## Proposed Solution: Dashboard 2.0

### New Dashboard Structure

```
app/
├── analyze/                       # 🆕 RENAMED from /dashboard
│   ├── page.js                   # Main analysis interface (redesigned)
│   ├── templates/page.js         # 🆕 Template gallery
│   ├── [id]/page.js              # 🆕 Analysis result detail view
│   ├── [id]/edit/page.js         # 🆕 Re-run with modifications
│   └── components/
│       ├── AnalysisWizard.jsx    # 🆕 Step-by-step guided flow
│       ├── TemplateCard.jsx      # 🆕 Template selection
│       ├── InputPanel.jsx        # ♻️ Enhanced input section
│       ├── ConfigPanel.jsx       # ♻️ Enhanced configuration
│       ├── ResultsViewer.jsx     # 🆕 Rich results display
│       ├── TokenAnalytics.jsx    # 🆕 Usage insights
│       └── ComparisonView.jsx    # 🆕 Side-by-side comparison
├── dashboard/                     # 🆕 NEW - Overview dashboard
│   └── page.js                   # Analytics, recent activity, quick actions
```

### Route Changes

**Before:**
- `/dashboard` - Main analysis interface
- `/history` - Analysis history list

**After:**
- `/dashboard` - **New overview page** (analytics, recent analyses, quick actions)
- `/analyze` - **Renamed** analysis interface with enhanced UX
- `/analyze/templates` - Template gallery for quick start
- `/analyze/[id]` - View past analysis with full details
- `/analyze/[id]/edit` - Re-run analysis with modifications
- `/history` - Keep existing history list (or merge into dashboard)

---

## Feature Roadmap

### Phase 1: Foundation (Week 1)

**Goal**: Restructure and improve core analysis experience

#### 1.1 Route Restructuring
- [ ] Create new `/dashboard` page (overview)
- [ ] Rename `/dashboard` → `/analyze`
- [ ] Update all navigation links
- [ ] Add redirects for backward compatibility
- [ ] Update middleware for route protection

#### 1.2 Enhanced Input Experience
- [ ] Add code editor with syntax highlighting (Monaco Editor or CodeMirror)
- [ ] Add language detection
- [ ] Show file structure preview for uploads
- [ ] Add drag-and-drop file zones with visual feedback
- [ ] Support for multiple file selection with preview

#### 1.3 Smart Configuration Panel
- [ ] Add preset configurations ("Quick Scan", "Deep Analysis", "Security Focus")
- [ ] Add tooltips and help text for each option
- [ ] Show estimated token usage based on config
- [ ] Add "Remember my settings" toggle
- [ ] Visual indicators for selected options

#### 1.4 Database Schema Updates
```sql
-- New tables needed

-- Analysis templates
CREATE TABLE analysis_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),  -- 'web', 'api', 'mobile', 'backend'
  code_sample TEXT NOT NULL,
  config JSONB NOT NULL,  -- Default configuration
  language VARCHAR(50),
  is_public BOOLEAN DEFAULT true,
  user_id INTEGER REFERENCES users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE,
  default_config JSONB,  -- Default analysis settings
  favorite_templates INTEGER[],  -- Array of template IDs
  preferred_provider VARCHAR(50),  -- 'claude' or 'lmstudio'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analysis comparisons
CREATE TABLE analysis_comparisons (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255),
  analysis_ids INTEGER[],  -- Array of analysis IDs to compare
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Phase 2: Template Gallery (Week 2)

**Goal**: Accelerate user onboarding with ready-to-use templates

#### 2.1 Template System
- [ ] Create template gallery page (`/analyze/templates`)
- [ ] Design template cards with preview
- [ ] Add categories: Web Apps, APIs, Mobile, Backend, ML/AI, Blockchain
- [ ] Create 10-15 starter templates covering common use cases
- [ ] Add template search and filtering
- [ ] Track template usage analytics

#### 2.2 Sample Templates

**Template Examples**:

1. **REST API Authentication** (Express.js)
   - Config: Security Tests ON, Test Framework: Jest
   - Sample: JWT auth middleware + user routes

2. **React Component Testing** (React + TypeScript)
   - Config: User Stories ON, Test Framework: Jest
   - Sample: Form component with validation

3. **Python Data Pipeline** (Python)
   - Config: Edge Cases ON, Test Framework: Pytest
   - Sample: ETL script with error handling

4. **Database Query Optimization** (SQL)
   - Config: Acceptance Criteria ON
   - Sample: Complex joins with indexes

5. **GraphQL Resolver** (Node.js)
   - Config: All options ON
   - Sample: Nested resolver with authentication

#### 2.3 Template Management
- [ ] "Use Template" button → pre-fills analysis form
- [ ] "Customize & Run" workflow
- [ ] Save custom templates (for authenticated users)
- [ ] Share templates with team (future: team accounts)

---

### Phase 3: Results Enhancement (Week 3)

**Goal**: Transform results from text tabs to rich, interactive experience

#### 3.1 Rich Results Viewer
- [ ] Syntax-highlighted code snippets in output
- [ ] Collapsible sections for better navigation
- [ ] Search within results
- [ ] Print-friendly view
- [ ] Full-screen mode
- [ ] Side-by-side view (input on left, results on right)

#### 3.2 Export & Sharing
- [ ] Export as Markdown (existing)
- [ ] Export as PDF with styling
- [ ] Export to Jira (formatted for direct import)
- [ ] Export to Notion, Confluence
- [ ] Generate shareable link (public or private)
- [ ] Copy individual sections (not just whole result)

#### 3.3 Result Actions
- [ ] Save as favorite
- [ ] Re-run with same config
- [ ] Re-run with modifications
- [ ] Compare with previous run
- [ ] Add to project (if linked to Projects module)
- [ ] Share with team member

#### 3.4 Visual Enhancements
- [ ] Syntax highlighting for code blocks
- [ ] Formatted tables for test cases
- [ ] Icons for test types (unit, integration, e2e)
- [ ] Status badges (passed/failed) if running tests
- [ ] Collapsible nested lists
- [ ] Mermaid diagram support for flows

---

### Phase 4: Analytics & Insights (Week 4)

**Goal**: Provide visibility into usage patterns and costs

#### 4.1 New Dashboard Overview (`/dashboard`)

**Hero Section**:
- Quick analysis button (prominent CTA)
- Recent analyses (last 5)
- Usage stats widget

**Analytics Grid**:
1. **Token Usage This Month**
   - Input tokens: 125,450
   - Output tokens: 89,320
   - Total cost: ~$4.50 (estimated)
   - Trend graph (last 30 days)

2. **Analysis Stats**
   - Total analyses: 47
   - This month: 12
   - Avg tokens per analysis: 4,500
   - Most used input method: GitHub (60%)

3. **Popular Templates**
   - REST API Testing (15 uses)
   - React Component (12 uses)
   - Python ETL (8 uses)

4. **Quick Actions**
   - New Analysis button
   - Browse Templates
   - View History
   - Settings

#### 4.2 Token Analytics Page
- [ ] Detailed token usage breakdown
- [ ] Cost calculator (Claude pricing tiers)
- [ ] Usage trends over time (charts)
- [ ] Token usage by provider (Claude vs LM Studio)
- [ ] Token usage by analysis type
- [ ] Export usage report (CSV)

#### 4.3 Insights Engine
- [ ] "You save X tokens by using LM Studio instead of Claude"
- [ ] "Your avg analysis uses Y tokens, typical is Z"
- [ ] "Consider breaking large files into smaller chunks"
- [ ] "Security tests add ~500 tokens on average"

---

### Phase 5: Workflow Optimization (Week 5)

**Goal**: Make repeated analyses faster and smarter

#### 5.1 Analysis Wizard (Guided Mode)
- [ ] Step 1: Select use case (Web App / API / Mobile / Data / Security Audit)
- [ ] Step 2: Choose template or paste code
- [ ] Step 3: Auto-configure based on use case
- [ ] Step 4: Review and run
- [ ] Step 5: View results with recommended next steps

#### 5.2 Smart Defaults
- [ ] Learn from user's past analyses
- [ ] Auto-detect language and framework
- [ ] Suggest test framework based on language
- [ ] Suggest config based on code patterns (e.g., if auth code → enable security tests)
- [ ] Remember last-used settings per language

#### 5.3 Batch Analysis (Future)
- [ ] Upload multiple files/repos
- [ ] Run same config on all
- [ ] View aggregated results
- [ ] Compare results across projects

#### 5.4 Keyboard Shortcuts
- [ ] `Cmd/Ctrl + K`: Quick analysis
- [ ] `Cmd/Ctrl + T`: Open templates
- [ ] `Cmd/Ctrl + H`: View history
- [ ] `Cmd/Ctrl + Enter`: Run analysis
- [ ] `Cmd/Ctrl + S`: Save result

---

### Phase 6: Integration & Collaboration (Week 6+)

**Goal**: Connect analysis workflow with Projects module and team features

#### 6.1 Projects Integration
- [ ] "Add to Project" button on results page
- [ ] Auto-create test cases in Projects module
- [ ] Link analysis to requirements
- [ ] Coverage tracking (which requirements have tests)

#### 6.2 Collaboration Features (Future)
- [ ] Share analysis with team members
- [ ] Comments on results
- [ ] Review workflow (approve/request changes)
- [ ] Team templates library
- [ ] Usage quotas by team

#### 6.3 API Access (Future)
- [ ] REST API for programmatic access
- [ ] Webhooks for completed analyses
- [ ] CLI tool (`npx orizon analyze file.js`)
- [ ] GitHub Action integration
- [ ] CI/CD pipeline integration

---

## UI/UX Design Principles

### Visual Hierarchy

**Dashboard (Overview)**:
1. **Hero**: Large "New Analysis" CTA + recent activity
2. **Analytics**: 3-4 key metrics cards
3. **Quick Access**: Templates, History, Settings

**Analysis Interface** (`/analyze`):
1. **Left Panel** (40%): Input + Configuration
2. **Right Panel** (60%): Live preview + Results
3. **Top Bar**: Template selector, Save, Export, Share
4. **Bottom Bar**: Token estimate, Run button

### Color Coding

- **Primary (Cyan #00D4FF)**: Main actions (Run Analysis, New Template)
- **Accent (Orange #FF9500)**: Warnings, token usage alerts
- **Success (Green)**: Completed analyses, saved items
- **Quantum (Purple)**: Premium features, AI insights
- **Error (Red)**: Validation errors, API failures

### Responsive Design

- **Desktop (1200px+)**: Side-by-side panels, full analytics
- **Tablet (768px-1199px)**: Stacked panels, condensed analytics
- **Mobile (< 768px)**: Single column, wizard-style flow

---

## Technical Implementation Details

### New Components Library

```jsx
// Analysis Wizard
<AnalysisWizard
  steps={['Input', 'Configure', 'Review', 'Results']}
  onComplete={handleAnalysisComplete}
/>

// Template Card
<TemplateCard
  template={template}
  onUse={handleUseTemplate}
  onPreview={handlePreview}
/>

// Results Viewer (Enhanced)
<ResultsViewer
  results={results}
  mode="split | tabs | fullscreen"
  onExport={handleExport}
  onSave={handleSave}
  onCompare={handleCompare}
/>

// Token Analytics
<TokenAnalytics
  usage={tokenUsage}
  period="day | week | month"
  showTrends={true}
/>

// Comparison View
<ComparisonView
  analyses={[analysis1, analysis2]}
  highlightDiffs={true}
/>
```

### State Management

**Current**: All state in dashboard page.js (useState hooks)

**Proposed**: Introduce Context API for shared state

```javascript
// contexts/AnalysisContext.js
export const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [preferences, setPreferences] = useState({});

  return (
    <AnalysisContext.Provider value={{...}}>
      {children}
    </AnalysisContext.Provider>
  );
}
```

### API Enhancements

```javascript
// New API endpoints needed

// Templates
GET    /api/templates              // List all templates
GET    /api/templates/:id          // Get template details
POST   /api/templates              // Create custom template
PUT    /api/templates/:id          // Update template
DELETE /api/templates/:id          // Delete template

// Preferences
GET    /api/user/preferences       // Get user preferences
PUT    /api/user/preferences       // Update preferences

// Comparisons
POST   /api/analyses/compare       // Compare multiple analyses
GET    /api/analyses/compare/:id   // Get saved comparison

// Analytics
GET    /api/analytics/usage        // Token usage stats
GET    /api/analytics/insights     // AI-generated insights

// Exports
POST   /api/analyses/:id/export    // Export to various formats
POST   /api/analyses/:id/share     // Generate shareable link
```

---

## Migration Strategy

### Backward Compatibility

1. **Phase 1**: Keep `/dashboard` working as-is
2. **Add** new `/analyze` route with enhanced features
3. **Add** banner on old dashboard: "Try our new analysis experience"
4. **Phase 2**: Redirect `/dashboard` → `/analyze` after 2 weeks
5. **Keep** old dashboard accessible at `/dashboard/legacy` for 1 month

### Data Migration

- Existing `analyses` table compatible with new features
- Add new columns incrementally (non-breaking)
- Use feature flags for gradual rollout

### User Communication

- In-app notification about new dashboard
- Email to active users highlighting improvements
- Blog post / changelog entry
- Video walkthrough of new features

---

## Success Metrics

### Key Performance Indicators (KPIs)

**Adoption Metrics**:
- % of users trying new dashboard
- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- Template usage rate
- Avg analyses per user

**Engagement Metrics**:
- Time spent on analysis page
- Repeat analysis rate
- Template creation rate
- Result save/favorite rate

**Quality Metrics**:
- Analysis success rate (no errors)
- Token usage efficiency (tokens per analysis trending down)
- User satisfaction (NPS score)

**Business Metrics**:
- Conversion rate (free → paid, if applicable)
- Retention rate (30-day, 90-day)
- Feature adoption rate (which features most used)

---

## Risks & Mitigation

### Technical Risks

**Risk**: Performance degradation with rich UI components
- **Mitigation**: Code splitting, lazy loading, virtual scrolling for large results

**Risk**: Increased API costs from analytics queries
- **Mitigation**: Caching, aggregated stats, efficient indexes

**Risk**: Breaking changes affect existing users
- **Mitigation**: Feature flags, gradual rollout, legacy mode

### UX Risks

**Risk**: Too many features → overwhelming users
- **Mitigation**: Progressive disclosure, onboarding tour, simple mode vs advanced mode

**Risk**: Loss of simplicity that made tool easy to use
- **Mitigation**: Keep "Quick Analysis" one-click option, wizard for guided experience

### Business Risks

**Risk**: Development takes longer than estimated
- **Mitigation**: MVP approach, release phase by phase, iterate based on feedback

---

## Resources & Dependencies

### Design Resources Needed

- [ ] Wireframes for new dashboard layout
- [ ] Mockups for analysis interface
- [ ] Template gallery design
- [ ] Results viewer redesign
- [ ] Analytics dashboard design

### External Libraries (Consideration)

**Code Editor**:
- Monaco Editor (VS Code's editor) - 2.5MB gzipped
- CodeMirror 6 - Lighter, 500KB gzipped
- **Recommendation**: CodeMirror 6 (better bundle size, sufficient features)

**Charts for Analytics**:
- Recharts - React-native, 400KB
- Chart.js + react-chartjs-2 - Battle-tested, 200KB
- **Recommendation**: Chart.js (lighter, proven)

**Diff Viewer**:
- react-diff-viewer-continued - 50KB
- **Recommendation**: Use this for comparison views

**Markdown Rendering**:
- react-markdown (already using?)
- remark-gfm for GitHub-flavored markdown
- **Recommendation**: Keep existing solution

### Team Requirements

- 1 Full-stack developer (you/me)
- UI/UX designer (for mockups) - can use existing design system
- QA tester (optional, for testing workflows)

### Timeline Estimate

- **Phase 1**: 1 week (Foundation)
- **Phase 2**: 1 week (Templates)
- **Phase 3**: 1 week (Results Enhancement)
- **Phase 4**: 1 week (Analytics)
- **Phase 5**: 1 week (Workflow Optimization)
- **Phase 6**: 2+ weeks (Integration & Collaboration)

**Total MVP (Phases 1-4)**: 4 weeks
**Full Feature Set (Phases 1-6)**: 7+ weeks

---

## Open Questions for Discussion

1. **Routing**: Do we rename `/dashboard` to `/analyze` and create new `/dashboard`? Or keep URLs and just redesign?

2. **Templates**: Should templates be user-generated (UGC) or curated by us initially?

3. **Analytics**: How detailed should token usage tracking be? Per-analysis breakdown vs aggregated?

4. **Pricing**: If we add premium features (team templates, API access), what's pricing model?

5. **Projects Integration**: How tightly should analysis integrate with Projects module? Auto-create vs manual linking?

6. **Collaboration**: Priority for team features? Or focus on individual power-user features first?

7. **Mobile Experience**: How much should we optimize for mobile? Analysis likely desktop-heavy.

8. **Onboarding**: Mandatory tutorial/wizard for first-time users, or optional?

---

## References & Sources

### Codebase Files Analyzed

1. `/app/dashboard/page.js` - Current dashboard implementation (318 lines)
2. `/app/api/analyze/route.js` - Analysis API endpoint (185 lines)
3. `/app/hooks/useAnalysis.js` - Analysis hook (91 lines)
4. `/lib/promptBuilder.js` - Prompt construction system (279 lines)
5. `/prompts/templates/*.md` - Prompt templates (4 files)
6. `/CLAUDE.md` - Project documentation

### External Research

- GitHub Copilot Workspace UX patterns
- Cursor IDE analysis interface
- Replit AI template system
- v0.dev prompt-to-UI workflow
- Modern SaaS dashboard best practices
- AI tool pricing models (Claude, OpenAI, etc.)

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Refine** based on feedback and priorities
3. **Create** detailed wireframes for Phase 1
4. **Prototype** key UI components
5. **Start implementation** phase by phase
6. **Iterate** based on user feedback

---

**Plan Status**: DRAFT
**Last Updated**: 2025-12-02
**Next Review**: After stakeholder feedback
