# Analyze Page UX Redesign Plan

## Executive Summary

The Analyze page is the core value proposition of OrizonQA. After thorough UX analysis, I've identified significant usability issues that create friction and confusion. This plan proposes a complete visual redesign while preserving 100% of existing functionality.

---

## Current State Analysis

### User Journey (Current)

```
1. Land on page → See tabs (Input, Configure, Results, Cache)
2. Input tab → Choose mode (GitHub/Paste/Upload)
3. If GitHub → Select repo → Select branch → Pick files manually
4. See GoalSelector appear AFTER file tree loads
5. Go to Configure tab → See AI Provider → See SmartConfigPanel (3 modes!)
6. Click Analyze → See AnalysisDashboard
7. Go to Results tab → See output
```

### Identified UX Problems

#### 1. **Cognitive Overload**
- **4 tabs** competing for attention
- **3 input modes** (GitHub/Paste/Upload) within Input tab
- **3 configuration modes** (Easy/Guided/Expert) within Configure tab
- Users don't know where to start

#### 2. **Inverted Flow**
- GoalSelector appears AFTER user manually selects files
- Should be: Choose GOAL first → Files auto-selected
- Current: Pick files → Then see goals (backwards!)

#### 3. **Hidden Primary Action**
- "Analyze" button is at bottom of page, below tabs
- Changes based on which tab you're on
- Users often miss it or are confused

#### 4. **Information Architecture Issues**
- "Local Cache" tab is a power feature but takes equal visual weight as core tabs
- Configure tab mixes AI settings with analysis settings
- Results tab is empty until analysis runs (dead space)

#### 5. **Disconnected Feedback**
- Analysis progress appears outside tabs (good)
- But relationship between input → config → output is unclear
- Token estimate hidden in footer

#### 6. **Visual Hierarchy Problems**
- All elements have similar visual weight
- No clear "happy path" for new users
- Privacy badge competes with action buttons

---

## Proposed Redesign

### Design Philosophy

1. **Progressive Disclosure** - Show complexity only when needed
2. **Linear Flow** - Guide users through a clear sequence
3. **Single Primary Action** - One obvious "next step" at each stage
4. **Contextual Information** - Show relevant info at the right time

### New User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: SOURCE                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   GitHub    │  │    Paste    │  │   Upload    │                 │
│  │   (●)       │  │    ( )      │  │    ( )      │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                      │
│  [Repository Selector - Full Width]                                  │
│  user/repo ▼   branch: main ▼                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: GOAL (appears after repo selected)                         │
│  What do you want to generate?                                       │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  API     │ │Frontend  │ │ Backend  │ │  Full    │ │ Custom   │ │
│  │  Tests   │ │  Tests   │ │  Tests   │ │ Coverage │ │ Select   │ │
│  │ 12 files │ │ 8 files  │ │ 15 files │ │ 35 files │ │          │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                      │
│  [✓] API Tests selected - 12 files will be analyzed                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: REVIEW & RUN                                                │
│                                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  Summary                 │  │  AI Provider                    │  │
│  │  • 12 files selected     │  │  Claude Sonnet 4 ✓              │  │
│  │  • ~15K tokens           │  │  API Key saved ✓                │  │
│  │  • Est. cost: $0.05      │  │                                 │  │
│  │  • Tests: Executable     │  │  [Advanced Options ▼]           │  │
│  └─────────────────────────┘  └─────────────────────────────────┘  │
│                                                                      │
│           ┌─────────────────────────────────────────┐               │
│           │        ✨ ANALYZE CODE                   │               │
│           │        Generate QA Artifacts             │               │
│           └─────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ANALYSIS RUNNING (replaces above content)                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ████████████████░░░░░░░░░░  65%                            │   │
│  │                                                              │   │
│  │  Processing: src/api/users.js                               │   │
│  │  Chunks: 2/5 complete                                        │   │
│  │  Time: 00:45                                                 │   │
│  │                                                              │   │
│  │  [Cancel]                                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  RESULTS (full page takeover)                                        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [User Stories] [Test Cases] [Acceptance Criteria]          │   │
│  │                                                              │   │
│  │  Generated content here...                                   │   │
│  │                                                              │   │
│  │  [Copy] [Download] [Execute Tests] [New Analysis]           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Redesign Details

### 1. Page Header (Simplified)

**Current**: Header + Privacy badge + Connect GitHub button
**Proposed**:
```jsx
<header className="sticky top-0 z-50 border-b border-white/10 bg-surface-dark/80 backdrop-blur-lg">
  <div className="px-6 py-4">
    <div className="flex items-center justify-between">
      {/* Left: Title + Step Indicator */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold text-white">Code Analysis</h1>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center gap-2">
          <StepBadge step={1} current={currentStep} label="Source" />
          <ChevronRight className="w-4 h-4 text-white/20" />
          <StepBadge step={2} current={currentStep} label="Goal" />
          <ChevronRight className="w-4 h-4 text-white/20" />
          <StepBadge step={3} current={currentStep} label="Analyze" />
        </div>
      </div>

      {/* Right: Minimal actions */}
      <div className="flex items-center gap-3">
        <PrivacyBadge minimal />
        {!isConnected && <ConnectGitHubButton />}
      </div>
    </div>
  </div>
</header>
```

### 2. Step 1: Source Selection (Redesigned)

**Current**: 3 mode tabs inside a card with nested content
**Proposed**: Clean radio-style selector with immediate content switch

```jsx
<section className="space-y-6">
  {/* Source Type Selector - Horizontal pills */}
  <div className="flex items-center gap-4 p-2 bg-surface-dark rounded-xl border border-white/10">
    <SourceOption
      icon={Github}
      label="GitHub Repository"
      active={mode === 'github'}
      badge={isConnected ? "Connected" : null}
      onClick={() => setMode('github')}
    />
    <SourceOption
      icon={FileText}
      label="Paste Code"
      active={mode === 'paste'}
      onClick={() => setMode('paste')}
    />
    <SourceOption
      icon={Upload}
      label="Upload Files"
      active={mode === 'upload'}
      onClick={() => setMode('upload')}
    />
  </div>

  {/* Content Area - No nested card, clean layout */}
  {mode === 'github' && (
    <div className="space-y-4">
      {/* Repository + Branch in one row */}
      <div className="flex gap-4">
        <RepositoryDropdown className="flex-1" />
        <BranchDropdown className="w-48" />
      </div>

      {/* Goal Selector appears immediately after repo selected */}
      {selectedRepo && <GoalSelector />}

      {/* File preview - collapsed by default for non-custom goals */}
      {selectedGoal?.id !== 'custom' && (
        <FileSummary files={selectedFiles} onExpand={() => setShowFiles(true)} />
      )}

      {/* Full file picker only for custom goal */}
      {selectedGoal?.id === 'custom' && <FileFolderPicker />}
    </div>
  )}

  {mode === 'paste' && <CodePasteArea />}
  {mode === 'upload' && <FileDropZone />}
</section>
```

### 3. Step 2: Goal Selection (Elevated Importance)

**Current**: Appears after file tree loads, easy to miss
**Proposed**: Primary decision point, prominent placement

```jsx
<section className="bg-gradient-to-br from-primary/5 to-cyan-500/5
                    border border-primary/20 rounded-2xl p-6">
  <div className="text-center mb-6">
    <h2 className="text-lg font-semibold text-white mb-2">
      What do you want to generate?
    </h2>
    <p className="text-sm text-text-secondary-dark">
      Select a goal and we'll configure everything automatically
    </p>
  </div>

  {/* Goal Cards - Larger, more visual */}
  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
    {goals.map(goal => (
      <GoalCard
        key={goal.id}
        icon={goal.icon}
        name={goal.name}
        fileCount={goal.fileCount}
        executable={goal.executable}
        selected={selectedGoal?.id === goal.id}
        onClick={() => selectGoal(goal)}
        colorClass={goal.color}
      />
    ))}
  </div>

  {/* Selected Goal Confirmation */}
  {selectedGoal && (
    <div className="mt-6 p-4 bg-white/5 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Check className="w-5 h-5 text-green-400" />
        <div>
          <p className="text-sm font-medium text-white">
            {selectedGoal.name} - {selectedGoal.fileCount} files
          </p>
          <p className="text-xs text-text-secondary-dark">
            {selectedGoal.executable
              ? "Tests will be executable in browser"
              : "Documentation output"}
          </p>
        </div>
      </div>
      <button className="text-xs text-primary hover:underline">
        Customize files
      </button>
    </div>
  )}
</section>
```

### 4. Step 3: Review Panel (Before Analysis)

**Current**: Configure tab with nested SmartConfigPanel + 3 modes
**Proposed**: Single review panel with expandable advanced options

```jsx
<section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Summary Card */}
  <div className="lg:col-span-2 bg-surface-dark border border-white/10 rounded-xl p-6">
    <h3 className="text-sm font-medium text-text-secondary-dark mb-4">
      Analysis Summary
    </h3>

    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard icon={File} label="Files" value={selectedFiles.length} />
      <StatCard icon={Zap} label="Tokens" value="~15K" />
      <StatCard icon={DollarSign} label="Est. Cost" value="$0.05" />
    </div>

    {/* File Categories */}
    <div className="space-y-2">
      {categories.map(cat => (
        <div key={cat.id} className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <cat.icon className="w-4 h-4 text-primary" />
            <span className="text-sm text-white">{cat.name}</span>
          </div>
          <span className="text-sm text-text-secondary-dark">{cat.count} files</span>
        </div>
      ))}
    </div>
  </div>

  {/* AI Provider + Actions */}
  <div className="space-y-4">
    <AIProviderCard
      provider={provider}
      model={model}
      hasApiKey={hasApiKey}
      onConfigure={() => router.push('/settings?tab=llm')}
    />

    {/* THE Primary Action */}
    <button
      onClick={handleAnalyze}
      disabled={!canAnalyze}
      className="w-full py-4 bg-gradient-to-r from-primary to-cyan-500
                 text-white font-semibold rounded-xl
                 hover:shadow-lg hover:shadow-primary/25
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-300"
    >
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="w-5 h-5" />
        <span>Analyze Code</span>
      </div>
    </button>

    {/* Expandable Advanced Options */}
    <details className="group">
      <summary className="flex items-center justify-between p-3
                          bg-white/5 rounded-lg cursor-pointer
                          hover:bg-white/10 transition-colors">
        <span className="text-sm text-text-secondary-dark">Advanced Options</span>
        <ChevronDown className="w-4 h-4 text-text-secondary-dark
                                 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="mt-2 p-4 bg-surface-dark border border-white/10 rounded-lg">
        <OutputFormatSelector />
        <TestFrameworkSelector />
        <AdditionalContextInput />
      </div>
    </details>
  </div>
</section>
```

### 5. Analysis Running State (Full-Width Takeover)

**Current**: AnalysisDashboard above tabs, tabs still visible
**Proposed**: Analysis takes over entire content area

```jsx
{isAnalyzing && (
  <div className="fixed inset-0 bg-bg-dark/95 backdrop-blur-sm z-40
                  flex items-center justify-center p-6">
    <div className="w-full max-w-2xl">
      <AnalysisProgressCard
        status={status}
        progress={progress}
        currentFile={currentFile}
        elapsed={elapsed}
        chunks={chunks}
        onCancel={handleCancel}
      />
    </div>
  </div>
)}
```

### 6. Results View (Full-Page Mode)

**Current**: Results tab with OutputSection
**Proposed**: Full-page results with clear actions

```jsx
{hasResults && (
  <div className="space-y-6">
    {/* Success Header */}
    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Analysis Complete</h2>
            <p className="text-sm text-text-secondary-dark">
              Generated in {elapsed} • {tokenUsage.total.toLocaleString()} tokens
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleNewAnalysis}>
            New Analysis
          </Button>
          {hasExecutableTests && (
            <Button variant="primary" onClick={handleExecuteTests}>
              <Play className="w-4 h-4 mr-2" />
              Execute Tests
            </Button>
          )}
        </div>
      </div>
    </div>

    {/* Output Tabs */}
    <div className="bg-surface-dark border border-white/10 rounded-xl overflow-hidden">
      <div className="flex border-b border-white/10">
        <OutputTab label="User Stories" count={results.userStories?.length} />
        <OutputTab label="Test Cases" count={results.testCases?.length} />
        <OutputTab label="Acceptance Criteria" count={results.criteria?.length} />
      </div>

      <div className="p-6">
        <OutputContent content={activeOutput} />
      </div>

      {/* Actions Footer */}
      <div className="px-6 py-4 bg-bg-dark/50 border-t border-white/10
                      flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CopyButton content={activeOutput} />
          <DownloadButton content={activeOutput} format={outputFormat} />
        </div>
        <ShareButton analysisId={analysisId} />
      </div>
    </div>
  </div>
)}
```

---

## Removed/Hidden Elements

### Move to Settings Page
- AI Provider configuration (currently in AIProviderStatus)
- LM Studio URL configuration

### Move to Expandable "Advanced" Section
- SmartConfigPanel 3-mode selector (Easy/Guided/Expert)
- Per-card file selection (CardFileSelector)
- Edge cases toggle
- Security tests toggle

### Remove from Main View
- "Local Cache" tab → Move to floating button or Settings
- CacheStatusBar at bottom → Move to Settings or minimal indicator
- Multiple "Analyze" buttons → Single prominent button

---

## New Component Structure

```
app/analyze/
├── page.js                    # Main orchestrator (simplified)
├── components/
│   ├── AnalyzeWizard.jsx      # NEW: Main wizard container
│   ├── steps/
│   │   ├── SourceStep.jsx     # Step 1: GitHub/Paste/Upload
│   │   ├── GoalStep.jsx       # Step 2: Goal selection
│   │   └── ReviewStep.jsx     # Step 3: Review & run
│   ├── SourceSelector.jsx     # NEW: Clean source mode picker
│   ├── GoalCard.jsx           # NEW: Individual goal card
│   ├── ReviewSummary.jsx      # NEW: Pre-analysis summary
│   ├── AnalysisOverlay.jsx    # NEW: Full-screen analysis progress
│   ├── ResultsView.jsx        # NEW: Results with actions
│   └── (existing components)  # Kept but refactored
```

---

## Migration Strategy

### Phase 1: Layout Restructure (Low Risk)
1. Create AnalyzeWizard.jsx as wrapper
2. Move existing components into steps
3. Add step indicator to header
4. No functionality changes

### Phase 2: Flow Optimization (Medium Risk)
1. Move GoalSelector to appear BEFORE file picker
2. Auto-collapse file picker for goal-based selection
3. Consolidate action buttons
4. Add review panel

### Phase 3: Visual Polish (Low Risk)
1. Apply new card styles
2. Add transitions between steps
3. Improve progress visualization
4. Add success animations

### Phase 4: Advanced Features (Optional)
1. Move cache to Settings
2. Add keyboard shortcuts
3. Add quick-action floating button
4. Remember last used goal

---

## Success Metrics

1. **Time to First Analysis**: < 60 seconds for new users
2. **Step Completion Rate**: > 90% of users who start reach results
3. **Confusion Points**: 0 questions about "where is the analyze button"
4. **Mobile Usability**: Full flow works on tablet/phone

---

## Preserved Functionality Checklist

- [x] GitHub OAuth repository selection
- [x] Branch switching
- [x] File/folder picking with patterns
- [x] Goal-based auto-configuration
- [x] Manual file selection (Custom goal)
- [x] Paste code input
- [x] File upload with drag-drop
- [x] ZIP file extraction
- [x] AI provider selection (Claude/LM Studio)
- [x] Model selection
- [x] Output format options
- [x] Test framework selection
- [x] Edge cases toggle
- [x] Security tests toggle
- [x] Streaming analysis with progress
- [x] Token estimation
- [x] Cost estimation
- [x] Results with copy/download
- [x] Execute tests button
- [x] Analysis history integration
- [x] Session persistence
- [x] Local cache management

---

## Visual Style Guide (Aligned with App)

### Colors
- Primary actions: `bg-gradient-to-r from-primary to-cyan-500`
- Secondary actions: `bg-surface-dark border border-white/10`
- Success states: `bg-green-500/10 border-green-500/20`
- Warnings: `bg-amber-500/10 border-amber-500/20`

### Cards
- Container: `bg-surface-dark border border-white/10 rounded-xl`
- Elevated: Add `shadow-lg shadow-black/20`
- Interactive: Add `hover:border-white/20 transition-all`

### Typography
- Page title: `text-xl font-bold text-white`
- Section title: `text-sm font-medium text-text-secondary-dark uppercase tracking-wide`
- Body: `text-sm text-white`
- Secondary: `text-xs text-text-secondary-dark`

### Spacing
- Page padding: `px-6 py-8`
- Section gaps: `space-y-6` or `gap-6`
- Card padding: `p-6`
- Compact padding: `p-4`
