# Analyze V2 Investigation Report

**Date**: 2025-12-05
**Status**: Multiple Issues Found

---

## Executive Summary

The V2 analyze page has significant architectural and UX issues that prevent it from working as intended. The main problems are:
1. Disconnected flow states between header and chat panel
2. Chat messages don't persist across flow state changes
3. Source detection has race conditions
4. Missing reset functionality
5. No way to go back to previous steps
6. Results don't display in V2 (redirects to V1)

---

## Issue #1: Dual Step Indicators Out of Sync

**Severity**: HIGH
**Location**: `page.js:259-280` (header) vs `AIChatPanel.jsx:386-424` (chat)

**Problem**: There are TWO separate step indicator systems:
1. Header has `StepIndicator` components with their own logic
2. Chat panel has `StepItem` components with different logic

These are NOT connected and show different states.

**Header Logic** (page.js):
```javascript
<StepIndicator
  num={1}
  active={streamStatus === AnalysisStatus.IDLE && !selectedFiles.length}
  complete={selectedFiles.length > 0 || codeInput || uploadedFiles.length > 0}
/>
```

**Chat Logic** (AIChatPanel.jsx):
```javascript
flowState === 'idle' // Shows step 1 as current
flowState === 'source-selected' // Shows step 1 as complete
```

**Impact**: User sees conflicting progress indicators.

---

## Issue #2: Chat Messages Disappear on Flow State Change

**Severity**: HIGH
**Location**: `AIChatPanel.jsx:365-427`

**Problem**: When `flowState` changes from `idle` to `source-selected`, the entire chat content changes. Any chat messages the user sent while in `idle` state are still in `chatMessages` array but the context message changes completely.

**Root Cause**: Each flow state renders a different static "system message" but these aren't actual chat messages - they're JSX blocks that replace each other.

**Expected**: Chat should be a continuous conversation. System messages should be added to `chatMessages` array, not rendered conditionally.

---

## Issue #3: Source Detection Race Condition

**Severity**: MEDIUM
**Location**: `AIChatPanel.jsx:93-111`

**Problem**: The source detection effect uses a string key comparison:
```javascript
const currentSourceKey = hasSource
  ? `${selectedFiles.length}-${codeInput?.length || 0}-${uploadedFiles?.length || 0}`
  : null;
```

This can cause issues when:
- User types in paste tab (codeInput changes rapidly)
- Multiple file selections happen quickly
- The effect runs before `prevSourceRef.current` is updated

---

## Issue #4: No Way to Change Action After Selection

**Severity**: HIGH
**Location**: `AIChatPanel.jsx:456-532`

**Problem**: Once user clicks an action (e.g., "API Tests"), they transition to `configuring` state. There's no UI to:
1. Go back to `source-selected` state
2. Change the selected action
3. Clear the selection and start over

The only option is to refresh the page.

---

## Issue #5: Reset Doesn't Reset Flow State

**Severity**: HIGH
**Location**: `page.js:221-224` and `AIChatPanel.jsx`

**Problem**: The `handleReset` function only calls `resetStream()` which resets the analysis hook, but:
1. `flowState` is NOT reset to `idle`
2. `selectedAction` is NOT cleared
3. `chatMessages` are NOT cleared

```javascript
const handleReset = () => {
  resetStream();  // Only resets analysis hook
  // Missing: setFlowState('idle')
  // Missing: setSelectedAction(null)
  // Missing: setChatMessages([])
};
```

---

## Issue #6: Results Don't Show in V2

**Severity**: HIGH
**Location**: `AIChatPanel.jsx:688-694`

**Problem**: After analysis completes, the "View Full Results" button links to V1:
```javascript
<a href="/analyze?tab=results" ...>
  View Full Results
</a>
```

V2 should display results in its own panel, not redirect to V1.

---

## Issue #7: Model Costs Are Hardcoded and Incorrect

**Severity**: LOW
**Location**: `AIChatPanel.jsx:16-31`

**Problem**: The MODELS config has incorrect/outdated pricing:
```javascript
const MODELS = {
  chat: {
    costPer1kInput: 0.001,   // Actually $0.25/1M = $0.00025/1K
    costPer1kOutput: 0.005,  // Actually $1.25/1M = $0.00125/1K
  },
  analysis: {
    costPer1kInput: 0.003,   // Sonnet 4 is $3/1M = $0.003/1K ✓
    costPer1kOutput: 0.015,  // Sonnet 4 is $15/1M = $0.015/1K ✓
  }
};
```

Haiku costs are wrong by 4x.

---

## Issue #8: Unused Props and Dead Code

**Severity**: LOW
**Location**: Various

**Unused props in AIChatPanel**:
- `plan` - never used
- `chunks` - never used
- `provider` - never used (always shows "Sonnet 4")
- `claudeModel` - never used (hardcoded to MODELS.analysis.name)

**Unused imports in page.js**:
- `useSearchParams` - imported but never used
- `useRouter` - imported but never used
- `Beaker` - imported but never used

---

## Issue #9: Header Step Progress Uses Different Logic

**Severity**: MEDIUM
**Location**: `page.js:259-280`

**Problem**: Header step indicators use `streamStatus` and props directly, while chat uses `flowState`. They can show different states:

| Scenario | Header Shows | Chat Shows |
|----------|-------------|------------|
| Files selected, no action | Step 2 active | Step 2 current |
| Action clicked | Step 2 active | Step 3 pending |
| Analysis running | Step 3 active | Analyzing state |

---

## Issue #10: Chat Doesn't Know About Analysis Config

**Severity**: MEDIUM
**Location**: `AIChatPanel.jsx:196-269`

**Problem**: The chat API receives limited context:
```javascript
const context = {
  hasSource: !!source,
  sourceType: source?.type,
  sourceName: source?.name,
  fileCount: source?.fileCount || 0,
  currentConfig: config,
  selectedAction: selectedAction?.label
};
```

Missing:
- Actual file names/paths selected
- Repository branch
- Previous analysis results
- User's conversation history

---

## Issue #11: SourcePanel filterTree Mutates Original Data

**Severity**: MEDIUM
**Location**: `SourcePanel.jsx:100-116`

**Problem**: The `filterTree` function mutates `item.children` in place:
```javascript
const filterTree = (items, search) => {
  return items.filter(item => {
    // ...
    const filteredChildren = filterTree(item.children || [], search);
    item.children = filteredChildren;  // MUTATION!
    // ...
  });
};
```

This can cause stale tree data when search is cleared.

---

## Issue #12: Missing Error Handling for API Key

**Severity**: MEDIUM
**Location**: `AIChatPanel.jsx:202-210`

**Problem**: When API key is missing, the error is shown but:
1. The message is added to chat, but user might not notice
2. No visual indication in the chat input area
3. The "Connected" indicator still shows green if `hasApiKey` is stale

---

## Recommended Fixes (Priority Order)

### P0 - Critical
1. **Unify step indicators** - Remove header steps or sync with flowState
2. **Fix reset functionality** - Reset all state on reset
3. **Add navigation** - Let users go back to previous steps
4. **Show results in V2** - Don't redirect to V1

### P1 - High
5. **Make chat stateful** - System messages should be in chatMessages array
6. **Fix source detection** - Use debounce or more reliable detection
7. **Fix filterTree mutation** - Use spread operator to clone

### P2 - Medium
8. **Fix model costs** - Update Haiku pricing
9. **Remove dead code** - Clean up unused imports/props
10. **Improve chat context** - Send more useful info to AI

---

## Architecture Recommendation

The current architecture mixes:
- Static JSX for flow states
- Dynamic chat messages
- Multiple step indicator systems

**Recommended approach**: Single source of truth

```javascript
// All messages in one array
const [messages, setMessages] = useState([
  { type: 'system', flowState: 'idle', content: '...' }
]);

// Flow state derived from messages and analysis status
const flowState = useMemo(() => {
  if (isComplete) return 'complete';
  if (isAnalyzing) return 'analyzing';
  // ... derive from state
}, [isComplete, isAnalyzing, selectedFiles, selectedAction]);

// Render messages in order
{messages.map(msg => <ChatMessage {...msg} />)}
```

This ensures:
- Chat history is preserved
- Flow is visible in message history
- No duplicate state to sync
