# ORIZON Design System Migration Plan
**Date:** 2025-12-02
**Status:** In Progress
**Scope:** Projects section + Sidebar (authenticated areas only)

---

## Migration Strategy

### Approach
**Systematic, priority-based migration** with immediate testing after each file to ensure no visual regressions.

### Execution Order
1. **Quick Win First** - Fix Sidebar (1 min) for immediate improvement
2. **High-Impact Pages** - Migrate most-viewed pages first (Priority 1)
3. **Cascade Effect** - Fix reusable components next (Priority 2)
4. **Complete Coverage** - Finish detail pages and forms (Priority 3-4)

### Safety Measures
- ✅ Read entire file before editing
- ✅ Use exact string matching for replacements
- ✅ Reference coverage page as template
- ✅ Test visually after each file
- ✅ Commit after each priority level

---

## Replacement Patterns Reference

### Quick Reference Table

| Before (Legacy) | After (ORIZON) | Context |
|----------------|----------------|---------|
| `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900` | `bg-bg-dark` | Page backgrounds |
| `bg-slate-800` | `bg-surface-dark` | Cards, surfaces |
| `bg-slate-700` | `bg-surface-hover-dark` | Hover states, badges |
| `border-slate-700` | `border-white/10` | Borders |
| `border-slate-600` | `border-white/20` | Stronger borders |
| `text-slate-300` | `text-white` or `text-text-primary-dark` | Primary text |
| `text-slate-400` | `text-text-secondary-dark` | Secondary text |
| `text-slate-500` | `text-text-muted-dark` | Muted text |
| `text-slate-600` | `text-text-muted-dark` | Very muted text |
| `placeholder-slate-400` | `placeholder-text-muted-dark` | Input placeholders |
| `focus:border-cyan-500` | `focus:border-primary` | Focus states |
| `hover:bg-slate-600` | `hover:bg-surface-hover-dark` | Button hovers |

---

## Migration Checklist (20 Tasks)

### Priority 5 - Quick Fix (1 file, ~1 minute)

- [ ] **Task 1:** Sidebar
  - File: `/app/components/layout/Sidebar.jsx`
  - Line: 108
  - Change: `text-slate-300` → `text-text-secondary-dark`
  - Time: 1 minute

---

### Priority 1 - Critical Pages (4 files, ~5.5 hours)

- [ ] **Task 2:** Project Dashboard
  - File: `/app/projects/[id]/page.js`
  - Issues: 60+ slate instances
  - Key areas: Background gradients, cards, tabs, buttons, stats
  - Time: 2 hours

- [ ] **Task 3:** Projects List
  - File: `/app/projects/page.js`
  - Issues: 35+ slate instances
  - Key areas: Page background, search bar, filter buttons, project cards
  - Time: 1.5 hours

- [ ] **Task 4:** Requirements List
  - File: `/app/projects/[id]/requirements/page.js`
  - Issues: 20+ slate instances
  - Key areas: Header, filters, requirement cards, empty state
  - Time: 1 hour

- [ ] **Task 5:** Tests List
  - File: `/app/projects/[id]/tests/page.js`
  - Issues: 20+ slate instances
  - Key areas: Header, filters, test cards, status badges
  - Time: 1 hour

**Priority 1 Checkpoint:** Test all 4 pages visually, commit changes

---

### Priority 2 - Reusable Components (3 files, ~1.5 hours)

- [ ] **Task 6:** ProjectCard
  - File: `/app/projects/components/ProjectCard.jsx`
  - Issues: 13 slate instances
  - Key areas: Card background, borders, badges, icons, footer
  - Impact: Cascades to Projects List
  - Time: 30 minutes

- [ ] **Task 7:** RequirementCard
  - File: `/app/projects/[id]/requirements/components/RequirementCard.jsx`
  - Issues: 10 slate instances
  - Key areas: Card background, priority badge, metadata, footer
  - Impact: Cascades to Requirements List
  - Time: 30 minutes

- [ ] **Task 8:** TestCaseCard
  - File: `/app/projects/[id]/tests/components/TestCaseCard.jsx`
  - Issues: 10 slate instances
  - Key areas: Card background, status badge, steps, footer
  - Impact: Cascades to Tests List
  - Time: 30 minutes

**Priority 2 Checkpoint:** Verify components look correct in list views, commit changes

---

### Priority 3 - Detail Pages (2 files, ~2.5 hours)

- [ ] **Task 9:** Requirement Detail
  - File: `/app/projects/[id]/requirements/[reqId]/page.js`
  - Issues: 25+ slate instances
  - Key areas: Header, info cards, linked tests section, edit form
  - Time: 1 hour

- [ ] **Task 10:** Test Detail
  - File: `/app/projects/[id]/tests/[testId]/page.js`
  - Issues: 30+ slate instances
  - Key areas: Header, test info, steps section, results, actions
  - Time: 1.5 hours

**Priority 3 Checkpoint:** Test detail pages thoroughly, commit changes

---

### Priority 4 - Forms & Create Pages (7 files, ~4.5 hours)

- [ ] **Task 11:** RequirementForm
  - File: `/app/projects/[id]/requirements/components/RequirementForm.jsx`
  - Issues: 35+ slate instances
  - Key areas: All input fields, labels, help text, buttons
  - Impact: Used in create/edit requirement pages
  - Time: 1.5 hours

- [ ] **Task 12:** TestCaseForm
  - File: `/app/projects/[id]/tests/components/TestCaseForm.jsx`
  - Issues: 25+ slate instances
  - Key areas: Input fields, step repeater, expected results, buttons
  - Impact: Used in create/edit test pages
  - Time: 1 hour

- [ ] **Task 13:** ProjectForm
  - File: `/app/projects/components/ProjectForm.jsx`
  - Issues: 12 slate instances
  - Key areas: Input fields, labels, help text, buttons
  - Impact: Used in create/edit project pages
  - Time: 30 minutes

- [ ] **Task 14:** Create Project Page
  - File: `/app/projects/new/page.js`
  - Issues: 10+ slate instances
  - Key areas: Page wrapper, header, form container
  - Time: 30 minutes

- [ ] **Task 15:** Create Requirement Page
  - File: `/app/projects/[id]/requirements/new/page.js`
  - Issues: 8+ slate instances
  - Key areas: Page wrapper, header, breadcrumbs
  - Time: 20 minutes

- [ ] **Task 16:** Create Test Page
  - File: `/app/projects/[id]/tests/new/page.js`
  - Issues: 8+ slate instances
  - Key areas: Page wrapper, header, breadcrumbs
  - Time: 20 minutes

- [ ] **Task 17:** Integration Settings Page
  - File: `/app/projects/[id]/settings/integrations/page.js`
  - Issues: 15+ slate instances
  - Key areas: Page wrapper, integration cards, config forms
  - Time: 45 minutes

**Priority 4 Checkpoint:** Test all forms and create flows, commit changes

---

### Final Steps

- [ ] **Task 18:** Visual Testing
  - Test each migrated page in browser
  - Verify hover states work correctly
  - Check focus states on inputs
  - Verify responsive behavior
  - Time: 30 minutes

- [ ] **Task 19:** Update Audit Report
  - Mark all files as compliant in `DESIGN_SYSTEM_AUDIT.md`
  - Update compliance statistics
  - Add "Migration Completed" section
  - Time: 10 minutes

- [ ] **Task 20:** Final Commit & Push
  - Commit all remaining changes
  - Write comprehensive commit message
  - Push to GitHub
  - Deploy to Vercel
  - Time: 5 minutes

---

## Per-File Migration Process

For each file, follow these steps:

### 1. Preparation (1-2 minutes)
```bash
# Read entire file first
Read the file completely
# Identify all slate color instances
# Plan replacements systematically
```

### 2. Background Colors (Highest Priority)
Replace in this order:
1. Page-level backgrounds (`min-h-screen`, `h-screen`)
2. Header/sticky bars
3. Card/surface backgrounds
4. Modal/overlay backgrounds

### 3. Text Colors
Replace in this order:
1. Primary text (`text-slate-300`)
2. Secondary text (`text-slate-400`)
3. Muted text (`text-slate-500`, `text-slate-600`)
4. Placeholders

### 4. Borders & Accents
Replace in this order:
1. Border colors
2. Focus states
3. Hover states
4. Active states

### 5. Verification (2-3 minutes)
- [ ] No `slate-` strings remain in file
- [ ] All backgrounds use ORIZON colors
- [ ] All text uses ORIZON colors
- [ ] All borders use ORIZON colors
- [ ] File compiles without errors

### 6. Visual Testing (2-3 minutes)
- [ ] Page loads correctly
- [ ] Layout looks correct
- [ ] Colors match design system
- [ ] Hover states work
- [ ] Focus states work

---

## Common Gotchas & Solutions

### Issue 1: Gradient Backgrounds
**Problem:** Complex gradients with multiple slate colors
```jsx
// ❌ WRONG - Don't try to convert complex gradients
from-slate-900 via-slate-800 to-slate-900

// ✅ RIGHT - Simplify to solid dark background
bg-bg-dark

// OR for subtle variation
bg-gradient-to-br from-bg-dark to-surface-dark
```

### Issue 2: Hover State Chains
**Problem:** Multiple hover states in one className
```jsx
// ❌ WRONG - Missing a conversion
bg-slate-800 hover:bg-slate-600

// ✅ RIGHT - Convert both
bg-surface-dark hover:bg-surface-hover-dark
```

### Issue 3: Border + Background Combos
**Problem:** Forgetting to update both
```jsx
// ❌ WRONG - Only updated background
bg-surface-dark border border-slate-700

// ✅ RIGHT - Both updated
bg-surface-dark border border-white/10
```

### Issue 4: Conditional Classes
**Problem:** Dynamic classes with slate colors
```jsx
// ❌ WRONG
${active ? 'bg-slate-700' : 'bg-slate-800'}

// ✅ RIGHT
${active ? 'bg-surface-hover-dark' : 'bg-surface-dark'}
```

### Issue 5: Text Color Hierarchy
**Problem:** Choosing wrong text color replacement
```jsx
// Labels and input text - use primary
text-slate-300 → text-white or text-text-primary-dark

// Descriptions and help text - use secondary
text-slate-400 → text-text-secondary-dark

// Very subtle text (timestamps, etc.) - use muted
text-slate-500, text-slate-600 → text-text-muted-dark
```

---

## Testing Protocol

After each file migration, check:

### Visual Tests
1. **Load the page** - Does it render without errors?
2. **Check backgrounds** - Are all dark backgrounds correct?
3. **Read text** - Is all text readable and properly colored?
4. **Hover elements** - Do hover states work correctly?
5. **Focus inputs** - Do focus states show primary color?
6. **Check borders** - Are borders visible but subtle?

### Functional Tests
1. **Click buttons** - Do they respond correctly?
2. **Fill forms** - Do inputs work properly?
3. **Navigate tabs** - Do tab switches work?
4. **Open modals** - Do overlays appear correctly?
5. **Test filters** - Do dropdowns and filters work?

### Consistency Tests
1. **Compare to coverage page** - Does it match the reference?
2. **Compare to dashboard** - Is styling consistent?
3. **Compare to settings** - Do patterns match?
4. **Check responsive** - Does it work on mobile?

---

## Rollback Plan

If issues occur during migration:

### Minor Issues (Wrong color choice)
- Fix immediately with correct replacement
- Re-test
- Continue

### Major Issues (Page breaks)
```bash
# Revert the file
git checkout HEAD -- /path/to/file

# Review the file again
# Identify the breaking change
# Apply fix more carefully
```

### Critical Issues (Multiple pages broken)
```bash
# Revert entire commit
git revert HEAD

# Review plan
# Identify systematic error
# Re-apply with corrections
```

---

## Success Criteria

Migration is complete when:

- [ ] All 17 files migrated successfully
- [ ] Zero `slate-` color references in Projects section
- [ ] All pages visually tested and working
- [ ] All forms functional
- [ ] All navigation working
- [ ] No console errors
- [ ] Consistent with coverage page design
- [ ] Audit report updated
- [ ] Changes committed and pushed
- [ ] Deployed to production

---

## Timeline Estimate

| Phase | Tasks | Time | Cumulative |
|-------|-------|------|------------|
| Quick Fix | Task 1 | 1 min | 1 min |
| Priority 1 | Tasks 2-5 | 5.5 hrs | 5.5 hrs |
| Priority 2 | Tasks 6-8 | 1.5 hrs | 7 hrs |
| Priority 3 | Tasks 9-10 | 2.5 hrs | 9.5 hrs |
| Priority 4 | Tasks 11-17 | 4.5 hrs | 14 hrs |
| Testing | Task 18 | 0.5 hrs | 14.5 hrs |
| Finalization | Tasks 19-20 | 0.25 hrs | 14.75 hrs |
| **TOTAL** | **20 tasks** | **~15 hours** | - |

---

## Progress Tracking

**Started:** 2025-12-02
**Estimated Completion:** TBD
**Actual Completion:** TBD

### Completion Status
- [ ] Priority 5 - Quick Fix (1/1)
- [ ] Priority 1 - Critical (0/4)
- [ ] Priority 2 - High (0/3)
- [ ] Priority 3 - Medium (0/2)
- [ ] Priority 4 - Low (0/7)
- [ ] Finalization (0/3)

**Overall Progress:** 0/20 tasks (0%)

---

## Notes & Observations

*This section will be updated during migration with any issues, patterns, or learnings.*

---

**Plan Version:** 1.0
**Last Updated:** 2025-12-02
