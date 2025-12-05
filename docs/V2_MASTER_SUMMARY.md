# Orizon V2 - Master Summary

**Date**: 2025-12-05
**Purpose**: Consolidated reference for all V2 planning work

---

## Documents Created

| Document | Purpose |
|----------|---------|
| `V2_INVESTIGATION_REPORT.md` | Original 12 issues found |
| `V2_REFINED_INVESTIGATION.md` | Expanded to 22 issues |
| `V2_CHAT_DESIGN_SPEC.md` | Chat UI specifications (Gamma-inspired) |
| `V2_COMPREHENSIVE_PLAN.md` | Full implementation plan |
| `V2_MASTER_SUMMARY.md` | This consolidated summary |

---

## Key Problems Identified

### Critical Issues (P0)
1. **Reset broken** - `handleReset()` only calls `resetStream()`, doesn't reset flowState/action/messages
2. **Step indicators out of sync** - Header uses `streamStatus`, chat uses `flowState`
3. **No back navigation** - Can't return to previous steps once action selected
4. **Results redirect to V1** - Links to `/analyze?tab=results` instead of V2 display

### UI/UX Issues
5. Chat panel too big (50% of screen, should be ~30-35%)
6. No chat history persistence
7. No user consent/opt-in for AI chat
8. Chat bubbles inconsistent sizing
9. No clear chat button

---

## Design References

| Reference | Key Insight |
|-----------|-------------|
| `mocks/GammaScreenshot1.jpg` | Right sidebar agent panel with context awareness, suggestions as bullet list, action history, variation chooser |
| `mocks/6-3.png` (Skiff Mail) | Split panel with floating compose modal |
| Notion AI | Multiple access points: floating widget + sidebar + keyboard shortcuts |
| GitHub Copilot | Sidebar chat + inline chat, dockable positions |

---

## Architecture Decisions

### Global Floating Assistant
- **NOT** page-specific, available on ALL pages
- Three view modes: Collapsed (button) → Floating (panel) → Sidebar (docked)
- Context-aware: understands current page and data
- Uses Zustand for global state management
- Keyboard shortcuts: `⌘J` toggle, `⌘⇧J` sidebar, `Esc` close

### Chat Flow States
```
idle → source-selected → configuring → analyzing → complete/error
```

### Adaptive Flows
- **GitHub**: Shows repo, branch, detected frameworks
- **Paste**: Language detection, code structure analysis
- **Upload**: Multi-file analysis, dependency detection

---

## New Feature: Agent Testing Platform

### Test Modes
1. **Upload Agent** - Upload LangChain/CrewAI/AutoGen/ADK code
2. **Describe Agent** - Natural language + tools definition
3. **Connect Agent** - API endpoint to running agent

### Test Categories
- Functional (tool calling, task completion)
- Safety (prompt injection, jailbreaks)
- Performance (latency, tokens)
- Robustness (edge cases, errors)

### Framework Integrations
| Framework | Key Features |
|-----------|--------------|
| Google ADK | Multi-agent, Vertex AI |
| Claude Agent SDK | Self-evaluation, rules feedback |
| Solace Agent Mesh | Event-driven, A2A protocol |
| LangChain/LangSmith | Trajectory eval, datasets |
| AutoGen | AgentEval, AutoGenBench |
| CrewAI | Role-based, Promptfoo red teaming |

---

## Implementation Files

### Global Assistant (Phase 0)
```
app/
├── stores/assistantStore.js          # Zustand global state
├── providers/AssistantProvider.jsx   # Context provider
├── hooks/
│   ├── useAssistant.js               # Interact with assistant
│   └── usePageContext.js             # Pages provide context
└── components/assistant/
    ├── FloatingAssistant.jsx         # Main component
    ├── CollapsedButton.jsx           # Trigger button
    ├── FloatingPanel.jsx             # Chat window
    ├── SidebarPanel.jsx              # Docked version
    ├── ContextBar.jsx                # Page context
    ├── ChatMessages.jsx              # Messages
    ├── ChatInput.jsx                 # Input
    └── QuickActions.jsx              # Suggestions
```

### Agent Testing (Phase 2-4)
```
app/
├── agent-testing/
│   ├── page.js                       # Main agent testing page
│   ├── upload/page.js                # Upload mode
│   ├── describe/page.js              # Describe mode
│   └── results/[id]/page.js          # Test results
├── api/
│   ├── agent-testing/
│   │   ├── parse/route.js            # Parse uploaded agent
│   │   ├── generate-tests/route.js   # Generate test suite
│   │   └── run-tests/route.js        # Execute tests
└── lib/
    └── agentFrameworks/
        ├── langchain.js
        ├── crewai.js
        ├── autogen.js
        ├── googleAdk.js
        ├── claudeAgentSdk.js
        └── solaceAgentMesh.js
```

---

## Database Additions

```sql
-- Chat history (opt-in)
CREATE TABLE chat_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id UUID,
  message_type VARCHAR(20),
  content TEXT,
  model VARCHAR(50),
  page_context JSONB,
  created_at TIMESTAMPTZ
);

-- Agent definitions
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  framework VARCHAR(50),
  source_type VARCHAR(20),
  source_code TEXT,
  config JSONB,
  tools JSONB
);

-- Agent test suites & runs
CREATE TABLE agent_test_suites (id, agent_id, tests JSONB);
CREATE TABLE agent_test_runs (id, suite_id, results JSONB, scores JSONB);
CREATE TABLE agent_test_results (id, run_id, test_name, passed, score);
```

---

## Implementation Roadmap

| Phase | Focus | Effort | Status |
|-------|-------|--------|--------|
| 0 | Global Floating Assistant | ~20h | Planned |
| 1 | V2 Chat Improvements | ~19h | Planned |
| 2 | Agent Testing Foundation | ~26h | Planned |
| 3 | Framework Adapters | ~36h | Planned |
| 4 | Advanced Testing | ~26h | Planned |
| 5 | Integration & Polish | ~18h | Planned |
| **Total** | | **~145h** | |

---

## Key Files to Modify

### Existing Files
- `app/analyze-v2/components/AIChatPanel.jsx` - Fix P0 issues, integrate with global assistant
- `app/analyze-v2/page.js` - Remove embedded chat, use global assistant
- `app/components/layout/AppLayout.jsx` - Add AssistantProvider wrapper
- `app/components/layout/Sidebar.jsx` - Add Agent Testing nav item

### Dependencies to Add
```json
{
  "zustand": "^4.5.0"
}
```

---

## Research Sources

### Agent Testing
- [Benchmarking AI Agents 2025](https://metadesignsolutions.com/benchmarking-ai-agents-in-2025-top-tools-metrics-performance-testing-strategies/)
- [How to Test AI Agents - Galileo](https://galileo.ai/learn/test-ai-agents)
- [τ-Bench (Tau benchmark)](https://ainativedev.io/news/8-benchmarks-shaping-the-next-generation-of-ai-agents)

### Framework Docs
- [Google ADK](https://google.github.io/adk-docs/)
- [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk)
- [Solace Agent Mesh](https://github.com/SolaceLabs/solace-agent-mesh)
- [LangSmith Evaluation](https://docs.langchain.com/langsmith/evaluation)
- [AutoGen](https://github.com/microsoft/autogen)
- [CrewAI Testing](https://docs.crewai.com/en/concepts/testing)

### UI Patterns
- [Notion AI](https://www.notion.com/help/guides/everything-you-can-do-with-notion-ai)
- [GitHub Copilot Chat](https://code.visualstudio.com/docs/copilot/chat/copilot-chat)
- [assistant-ui React](https://github.com/assistant-ui/assistant-ui)

---

## Quick Reference: Next Steps

1. **Install Zustand**: `npm install zustand`
2. **Create store**: `app/stores/assistantStore.js`
3. **Build floating button**: `app/components/assistant/CollapsedButton.jsx`
4. **Build floating panel**: `app/components/assistant/FloatingPanel.jsx`
5. **Integrate in layout**: Wrap app with `AssistantProvider`
6. **Add page contexts**: Use `usePageContext` hook in each page
