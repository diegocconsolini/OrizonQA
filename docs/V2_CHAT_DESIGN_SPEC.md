# V2 Chat Panel - Design Specification

**Based on**: Gamma AI (GammaScreenshot1.jpg), Skiff Mail (6-3.png)

---

## Chat Panel Structure

```
┌─────────────────────────────────────────────────┐
│ ✨ ORIZON Assistant              [Clear] [─]    │  HEADER
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📁 12 files from orizon/api • main branch   │ │  CONTEXT BAR
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🤖 I can see your code selection. What      │ │
│ │    would you like me to generate?           │ │
│ │                                             │ │  ASSISTANT MSG
│ │    • API integration tests                  │ │  (Suggestions as
│ │    • User stories & requirements            │ │   bullet list)
│ │    • Full QA suite with acceptance criteria │ │
│ │    • Security vulnerability tests           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │  ⚡ GENERATE FULL QA SUITE                  │ │  PRIMARY ACTION
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ─ Recent ─────────────────────────────────────  │
│ ← Selected API Tests                            │  ACTION HISTORY
│ ← Changed format to Markdown                    │
│                                                 │
│ ─ Preview ────────────────────────────────────  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Tests    │ │ Stories  │ │ Full ✓   │        │  CONFIG PREVIEW
│ │ only     │ │ only     │ │ Suite    │        │
│ └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
├─────────────────────────────────────────────────┤
│ Ask me anything about your code...              │
│ [/] Commands  [⚡ Quick]                   [→] │  INPUT AREA
├─────────────────────────────────────────────────┤
│ 💬 Haiku • 🤖 Sonnet 4 for analysis            │  FOOTER
└─────────────────────────────────────────────────┘
```

---

## Element Specifications

### 1. Header

```jsx
<div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
  <div className="flex items-center gap-2">
    <Sparkles className="w-4 h-4 text-primary" />
    <span className="text-sm font-medium text-white">ORIZON Assistant</span>
  </div>
  <div className="flex items-center gap-1">
    <button className="p-1.5 hover:bg-white/5 rounded text-text-secondary">
      Clear
    </button>
    <button className="p-1.5 hover:bg-white/5 rounded text-text-secondary">
      <Minimize2 className="w-4 h-4" />
    </button>
  </div>
</div>
```

**Features**:
- Icon + Title left-aligned
- Clear button to reset conversation
- Minimize/collapse option (optional)
- No model indicators in header (moved to footer)

---

### 2. Context Bar

```jsx
<div className="mx-4 mt-3 p-2 bg-white/5 rounded-lg border border-white/10">
  <div className="flex items-center gap-2 text-xs">
    <FolderOpen className="w-3.5 h-3.5 text-primary" />
    <span className="text-white font-medium">12 files</span>
    <span className="text-text-secondary">from</span>
    <span className="text-primary">orizon/api</span>
    <span className="text-text-secondary">•</span>
    <span className="text-text-secondary">main branch</span>
  </div>
</div>
```

**Shows**:
- File count
- Repository name
- Branch (if GitHub)
- OR "Pasted code (2,450 chars)"
- OR "3 uploaded files"

**When empty**: Don't show context bar

---

### 3. Assistant Messages

**Style**: Full-width cards, not chat bubbles

```jsx
<div className="mx-4 mt-3 p-4 bg-surface-dark rounded-xl border border-white/10">
  <div className="flex gap-3">
    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-cyan-500
                    flex items-center justify-center flex-shrink-0">
      <Bot className="w-3.5 h-3.5 text-white" />
    </div>
    <div className="flex-1 space-y-2">
      <p className="text-sm text-white">
        I can see your code selection. What would you like me to generate?
      </p>
      <ul className="space-y-1.5 text-sm text-text-secondary">
        <li className="flex items-center gap-2 hover:text-white cursor-pointer">
          <span className="text-primary">•</span>
          API integration tests
        </li>
        <li className="flex items-center gap-2 hover:text-white cursor-pointer">
          <span className="text-primary">•</span>
          User stories & requirements
        </li>
        {/* ... */}
      </ul>
    </div>
  </div>
</div>
```

**Key differences from current**:
- Suggestions are **clickable bullet points**, not button grid
- Full-width card design
- More conversational tone
- Clicking bullet → selects that action

---

### 4. Primary Action Button

```jsx
<div className="mx-4 mt-3">
  <button className="w-full py-3 bg-gradient-to-r from-primary to-cyan-500
                     text-white font-semibold rounded-xl
                     hover:shadow-lg hover:shadow-primary/25 transition-all
                     flex items-center justify-center gap-2">
    <Zap className="w-5 h-5" />
    GENERATE FULL QA SUITE
  </button>
</div>
```

**Shows when**: Action is selected and ready to generate
**Hides when**: No action selected or during analysis

---

### 5. Action History

```jsx
<div className="mx-4 mt-4">
  <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
    Recent
  </div>
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-xs text-text-secondary
                    hover:text-white cursor-pointer">
      <ArrowLeft className="w-3 h-3" />
      Selected API Tests
    </div>
    <div className="flex items-center gap-2 text-xs text-text-secondary
                    hover:text-white cursor-pointer">
      <ArrowLeft className="w-3 h-3" />
      Changed format to Markdown
    </div>
  </div>
</div>
```

**Tracks**:
- Action selections
- Config changes
- Analysis completions
- Clickable to undo/revisit

---

### 6. Config Preview Cards

```jsx
<div className="mx-4 mt-4">
  <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
    Output Type
  </div>
  <div className="flex gap-2">
    {['Tests', 'Stories', 'Full Suite'].map(option => (
      <button
        key={option}
        className={`flex-1 p-3 rounded-lg border text-center text-xs transition-all
          ${selected === option
            ? 'bg-primary/10 border-primary text-white'
            : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'
          }`}
      >
        {option}
        {selected === option && <Check className="w-3 h-3 ml-1 inline" />}
      </button>
    ))}
  </div>
</div>
```

**Features**:
- Visual preview of options
- Single selection (radio behavior)
- Checkmark on selected

---

### 7. Input Area

```jsx
<div className="mt-auto border-t border-white/10 p-3">
  <div className="flex items-center gap-2 bg-bg-dark rounded-lg border border-white/10
                  focus-within:border-primary/50">
    <input
      type="text"
      placeholder="Ask me anything about your code..."
      className="flex-1 px-3 py-2.5 bg-transparent text-sm text-white
                 placeholder-text-secondary focus:outline-none"
    />
    <button className="p-2 hover:bg-white/5 rounded text-text-secondary">
      <Send className="w-4 h-4" />
    </button>
  </div>

  <div className="flex items-center justify-between mt-2 text-[10px]">
    <div className="flex items-center gap-2">
      <button className="px-2 py-1 bg-white/5 rounded hover:bg-white/10
                         text-text-secondary flex items-center gap-1">
        <Command className="w-3 h-3" />
        Commands
      </button>
      <button className="px-2 py-1 bg-white/5 rounded hover:bg-white/10
                         text-text-secondary flex items-center gap-1">
        <Zap className="w-3 h-3" />
        Quick
      </button>
    </div>
    <span className="text-text-secondary">
      Press <kbd className="px-1 bg-white/10 rounded">Enter</kbd> to send
    </span>
  </div>
</div>
```

**Features**:
- Clean single-line input (not textarea)
- Commands button for slash commands
- Quick actions shortcut
- Keyboard hint

---

### 8. Footer (Model Indicator)

```jsx
<div className="px-4 py-2 border-t border-white/10 bg-bg-dark/50">
  <div className="flex items-center justify-between text-[10px]">
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1 text-cyan-400">
        <MessageSquare className="w-3 h-3" />
        Haiku for chat
      </span>
      <span className="flex items-center gap-1 text-primary">
        <Bot className="w-3 h-3" />
        Sonnet 4 for analysis
      </span>
    </div>
    {chatTokens > 0 && (
      <span className="text-text-secondary">
        {chatTokens} tokens • ${cost.toFixed(4)}
      </span>
    )}
  </div>
</div>
```

---

## State-Based Rendering

### Idle State (No source selected)
- Show: Welcome message
- Hide: Context bar, action button, history
- Input: Enabled (can ask questions)

### Source Selected
- Show: Context bar, suggestions, config preview
- Hide: Action button (until action chosen)
- Input: Enabled

### Action Configured
- Show: Context bar, primary action button, config preview
- Hide: Suggestions (already chose)
- Input: Enabled

### Analyzing
- Show: Progress indicator, cancel button
- Hide: Input, action button
- Disable: All interactions except cancel

### Complete
- Show: Results summary, action buttons (copy/download/view)
- Show: "New analysis" option
- Input: Enabled for follow-up

---

## Chat History (Opt-In Feature)

### User Consent Flow

```jsx
// First time chat is used
<ConsentModal>
  <h3>Enable Chat History?</h3>
  <p>Would you like to save your conversations?</p>
  <ul>
    <li>✓ Review past interactions</li>
    <li>✓ Continue conversations later</li>
    <li>✓ Export chat history</li>
  </ul>
  <p className="text-xs text-text-secondary">
    Your conversations are stored securely. You can delete them anytime.
  </p>
  <div className="flex gap-2">
    <button onClick={enableHistory}>Enable</button>
    <button onClick={skipForNow}>Skip for now</button>
  </div>
</ConsentModal>
```

### History Toggle in Settings

```
Settings > Chat
├── [ ] Save chat history
├── [ ] Include code context in messages
└── [Clear History] button
```

---

## Summary of Changes from Current

| Current | Recommended |
|---------|-------------|
| 50/50 split layout | 65/35 split (source gets more space) |
| Button grid for actions | Bullet list (clickable) |
| Chat bubbles | Full-width cards |
| Models in header | Models in footer |
| No context bar | Show selected source summary |
| No history | Action history list |
| No clear button | Clear button in header |
| Input always visible | Hide during analysis |
| No consent | Opt-in for history |
