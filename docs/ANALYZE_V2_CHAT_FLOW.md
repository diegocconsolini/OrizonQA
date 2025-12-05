# Analyze V2 Chat Flow Plan

## Current Problems
1. Static welcome message mixed with dynamic chat
2. AI suggestions auto-select actions causing UI to jump
3. "Ready to analyze" appears without proper context
4. Flow states are implicit, not explicit

## Intended User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         STEP 1: IDLE                            │
│  - No source selected                                           │
│  - Chat: "Welcome! Select code from the left panel to begin."   │
│  - User can ask questions (Haiku answers)                       │
│  - Quick actions are HIDDEN                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (user selects files)
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 2: SOURCE SELECTED                      │
│  - Files/code/upload detected                                   │
│  - Chat: "Great! I see {X files} from {repo}."                 │
│  - Chat: "What would you like to generate?"                    │
│  - Quick action buttons appear: [API Tests] [User Stories] etc │
│  - User can ask questions OR click action                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (user clicks action)
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 3: ACTION SELECTED                      │
│  - Action chosen (e.g., "Full QA Suite")                       │
│  - Chat: Shows config summary (files, outputs, cost)           │
│  - [Generate with Sonnet 4] button                             │
│  - User can change action or ask questions                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (user clicks Generate)
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 4: ANALYZING                            │
│  - Analysis in progress                                         │
│  - Chat: Shows progress, stages, tokens                        │
│  - [Cancel] button                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (analysis completes)
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 5: COMPLETE                             │
│  - Results ready                                                │
│  - Chat: "Analysis complete! Generated in X seconds"           │
│  - [View Results] [Copy] [Download] buttons                    │
│  - [New Analysis] to reset                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture Changes

### 1. Explicit Flow State
```javascript
const [flowState, setFlowState] = useState('idle');
// Values: 'idle' | 'source-selected' | 'configuring' | 'analyzing' | 'complete' | 'error'
```

### 2. Effect to Detect Source Changes
```javascript
useEffect(() => {
  const hasSource = selectedFiles.length > 0 || codeInput || uploadedFiles?.length > 0;

  if (!hasSource && flowState !== 'idle') {
    setFlowState('idle');
    setSelectedAction(null);
  } else if (hasSource && flowState === 'idle') {
    setFlowState('source-selected');
    // Add system message about source selection
  }
}, [selectedFiles, codeInput, uploadedFiles]);
```

### 3. Sync with Analysis Status
```javascript
useEffect(() => {
  if (isAnalyzing) setFlowState('analyzing');
  if (isComplete) setFlowState('complete');
  if (status === AnalysisStatus.ERROR) setFlowState('error');
}, [isAnalyzing, isComplete, status]);
```

### 4. Chat Messages as System Events
Instead of mixing static JSX with chat, ALL messages go through `chatMessages`:

```javascript
// Message types:
{ type: 'system', content: 'Welcome!', actions: [...] }
{ type: 'user', content: 'Hello' }
{ type: 'assistant', content: 'Response...', model: 'Haiku' }
{ type: 'action-summary', action: selectedAction, source: {...} }
{ type: 'progress', percentage: 50, activity: '...' }
{ type: 'results', results: {...} }
```

### 5. Remove AI Auto-Actions
The chat assistant should NOT auto-trigger actions. Remove this code:
```javascript
// REMOVE:
if (data.suggestedAction) {
  const action = quickActions.find(a => a.id === data.suggestedAction);
  if (action) handleSelectAction(action);
}
```

Instead, AI can suggest but user must click:
```javascript
// Chat response shows suggestion text only
// User sees: "I recommend generating API Tests for this codebase"
// User must manually click [API Tests] button
```

## Implementation Steps

1. Add `flowState` state variable
2. Add effects to sync flowState with source/analysis changes
3. Remove static welcome JSX, use system messages
4. Render chat based on flowState
5. Remove auto-action triggering from AI responses
6. Test each flow state transition
