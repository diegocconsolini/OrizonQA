# Next Session - Continue Phase 2 Refactoring

## What's Done ✅

**Phase 1: Critical Bug Fix (COMPLETED)**
- Fixed API route to accept `{apiKey, content, config}`
- Created prompt builder with Codebase-Digest templates
- Deployed working app to https://orizon-qa.vercel.app
- App now generates actual QA artifacts!

## What's Next 🚀

**Phase 2: Component Refactoring**

### Directory Structure Created
```
app/
├── components/
│   ├── shared/         # Tab, Alert, Header, HelpModal
│   ├── input/          # FileTree, InputSection, CodeInputTab, etc.
│   ├── config/         # AnalysisOptions, OutputSettings, ApiKeyInput
│   └── output/         # ResultsTabs, ResultActions
├── hooks/              # useAnalysis, useFileUpload, useGitHubFetch
└── page.js             # Main page (715 lines - needs refactoring)
```

### To Do (Estimated: 3-4 hours)

1. **Extract Simple Components** (30 min)
   - Tab.jsx ✓ (already created)
   - FileTree.jsx ✓ (already created)
   - Alert.jsx ✓ (already created)
   - Header.jsx + HelpModal.jsx

2. **Create Custom Hooks** (1 hour)
   - `useAnalysis.js` - Main analysis logic
   - `useFileUpload.js` - File handling
   - `useGitHubFetch.js` - GitHub integration

3. **Extract Feature Components** (1.5 hours)
   - InputSection + sub-components
   - ConfigSection components
   - OutputSection components

4. **Refactor page.js** (1 hour)
   - Import all components
   - Reduce to ~150 lines
   - Test thoroughly

## Quick Start Commands

```bash
# Resume work
cd /home/diegocc/OrizonQA

# Start dev server
npm run dev

# Create components (example)
# Edit app/components/shared/Header.jsx
# Edit app/hooks/useAnalysis.js

# Test changes
# Visit http://localhost:3000

# Deploy when ready
git add .
git commit -m "Phase 2: Component refactoring"
git push origin main
```

## Key Files to Extract From

**Source:** `/home/diegocc/OrizonQA/app/page.js` (715 lines)

**Sections to extract:**
- Lines 11-25: Tab component ✓
- Lines 28-81: FileTree component ✓
- Lines 84-244: Input methods (paste/github/upload)
- Lines 247-300: Analysis logic → hook
- Lines 344-385: Header + Help modal
- Lines 522-587: Config panel
- Lines 658-705: Output section

## Partial Completions

These files were created but not integrated yet:
- `/home/diegocc/OrizonQA/app/components/shared/Tab.jsx` ✓
- `/home/diegocc/OrizonQA/app/components/input/FileTree.jsx` ✓
- `/home/diegocc/OrizonQA/app/components/shared/Alert.jsx` ✓

## Success Criteria

- [ ] page.js under 200 lines
- [ ] All components in separate files
- [ ] App still works (test all 3 input methods)
- [ ] No regressions
- [ ] Deployed to production

## After Phase 2

**Phase 3:** User value features (history, exports, free tier)
**Phase 4:** CLI development
**Phase 5:** Integrations (GitHub Actions, Jira)
**Phase 6:** User accounts & persistence

## Notes

- Keep UI unchanged for now (rebuild later)
- Test after each component extraction
- Commit frequently
- Keep existing functionality 100% intact
