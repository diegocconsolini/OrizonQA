# Orizon V2 - Comprehensive Development Plan

**Date**: 2025-12-05
**Version**: 2.0

---

## Executive Summary

This plan covers:
1. **V2 Chat Panel Redesign** - Adaptive flows for GitHub/Paste/Upload
2. **Agent Testing Platform** - New major feature for AI agent evaluation
3. **Framework Integrations** - Google ADK, Anthropic SDK, Solace, LangChain, AutoGen, CrewAI

---

## PART 1: V2 Chat Flow Adaptations

### Current Problem
The chat panel treats all input sources the same, but each has different context needs.

### Adaptive Flow by Source Type

#### Flow A: GitHub Repository
```
┌─────────────────────────────────────────────────────┐
│ 📁 Context: Repository Mode                         │
├─────────────────────────────────────────────────────┤
│ Repository: orizon/api                              │
│ Branch: main                                        │
│ Files: 12 selected (API routes, services)          │
│ Languages: TypeScript (85%), JavaScript (15%)      │
│ Frameworks: Next.js, Prisma                        │
├─────────────────────────────────────────────────────┤
│ 🤖 I see this is a Next.js API with Prisma ORM.   │
│    Based on your selection, I can generate:        │
│                                                     │
│    • API integration tests (Jest/Vitest)           │
│    • Database migration tests                      │
│    • User stories for API endpoints                │
│    • Security audit for auth routes                │
└─────────────────────────────────────────────────────┘
```

**Context includes**:
- Repository name & owner
- Branch
- File types & languages detected
- Framework detection (package.json analysis)
- Specific suggestions based on tech stack

#### Flow B: Pasted Code
```
┌─────────────────────────────────────────────────────┐
│ 📋 Context: Pasted Code                             │
├─────────────────────────────────────────────────────┤
│ Size: 2,450 characters                             │
│ Language: Python (detected)                        │
│ Type: Flask API endpoint                           │
├─────────────────────────────────────────────────────┤
│ 🤖 I see you've pasted a Flask API endpoint.       │
│    This looks like a REST endpoint handling        │
│    user authentication.                            │
│                                                     │
│    I can generate:                                 │
│    • pytest unit tests for this endpoint           │
│    • User story describing the auth flow           │
│    • Security recommendations                      │
└─────────────────────────────────────────────────────┘
```

**Context includes**:
- Character/line count
- Language detection
- Code structure analysis (class, function, API, etc.)
- Specific suggestions for detected patterns

#### Flow C: Uploaded Files
```
┌─────────────────────────────────────────────────────┐
│ 📤 Context: Uploaded Files                          │
├─────────────────────────────────────────────────────┤
│ Files: 3 uploaded                                   │
│ - auth_controller.py (Python)                      │
│ - user_service.py (Python)                         │
│ - requirements.txt                                 │
│ Total: 8,200 characters                            │
├─────────────────────────────────────────────────────┤
│ 🤖 I see you've uploaded 3 Python files.           │
│    This appears to be a user authentication        │
│    module with controller/service pattern.         │
│                                                     │
│    I can generate:                                 │
│    • Unit tests for each module                    │
│    • Integration tests for auth flow               │
│    • API documentation                             │
└─────────────────────────────────────────────────────┘
```

**Context includes**:
- File count & names
- Languages per file
- Dependency detection (requirements.txt, package.json)
- Architecture pattern detection

### Implementation

```javascript
// lib/sourceAnalyzer.js
export function analyzeSource(sourceType, data) {
  switch (sourceType) {
    case 'github':
      return analyzeGitHubSource(data.repo, data.files, data.branch);
    case 'paste':
      return analyzePastedCode(data.code);
    case 'upload':
      return analyzeUploadedFiles(data.files);
  }
}

function analyzeGitHubSource(repo, files, branch) {
  return {
    type: 'github',
    repo: `${repo.owner}/${repo.name}`,
    branch,
    fileCount: files.length,
    languages: detectLanguages(files),
    frameworks: detectFrameworks(files),
    suggestions: generateSuggestions('github', files)
  };
}
```

---

## PART 2: Agent Testing Platform

### Vision

Transform Orizon from a "Code QA Generator" into an **"AI Agent Testing Platform"** that can:
1. Test AI agents from various frameworks
2. Upload agent code or describe agent behavior
3. Generate comprehensive test suites for agents
4. Evaluate agent performance against benchmarks

### Agent Testing Modes

#### Mode 1: Agent Code Upload
```
┌─────────────────────────────────────────────────────┐
│ 🤖 Agent Testing - Upload Mode                      │
├─────────────────────────────────────────────────────┤
│ Upload your agent code:                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Drop agent files here or click to upload]      │ │
│ │                                                 │ │
│ │ Supported:                                      │ │
│ │ • Python (.py) - LangChain, CrewAI, AutoGen    │ │
│ │ • TypeScript (.ts) - LangChain JS              │ │
│ │ • JSON - Agent configs, tool definitions       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Framework detected: [ ] Auto-detect                │
│                     [ ] LangChain                  │
│                     [ ] CrewAI                     │
│                     [ ] AutoGen                    │
│                     [ ] Google ADK                 │
│                     [ ] Claude Agent SDK           │
└─────────────────────────────────────────────────────┘
```

#### Mode 2: Agent Description
```
┌─────────────────────────────────────────────────────┐
│ 🤖 Agent Testing - Description Mode                 │
├─────────────────────────────────────────────────────┤
│ Describe your agent's purpose and capabilities:     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ My agent is a customer support assistant that:  │ │
│ │                                                 │ │
│ │ 1. Answers questions from a knowledge base      │ │
│ │ 2. Can escalate to human when unsure            │ │
│ │ 3. Has access to order lookup tool              │ │
│ │ 4. Must never share personal data               │ │
│ │ 5. Responds in user's language                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Tools available:                                    │
│ [+] lookup_order(order_id) → Order details          │
│ [+] search_kb(query) → Knowledge base results       │
│ [+] escalate_ticket(reason) → Creates support ticket│
└─────────────────────────────────────────────────────┘
```

### Test Generation Types

#### 1. Functional Tests
- Tool calling accuracy
- Response format validation
- Task completion verification
- Multi-step workflow tests

#### 2. Safety & Security Tests
- Prompt injection resistance
- Jailbreak attempts
- Data leakage prevention
- Policy compliance

#### 3. Performance Tests
- Response latency
- Token efficiency
- Concurrent request handling
- Context window usage

#### 4. Robustness Tests
- Edge case handling
- Ambiguous input handling
- Error recovery
- Graceful degradation

### Evaluation Metrics

Based on industry benchmarks:

| Metric | Description | Source |
|--------|-------------|--------|
| Task Success Rate | % of tasks completed correctly | AgentBench |
| Tool Call Accuracy | Correct tool selection/params | τ-Bench |
| Safety Score | Resistance to adversarial prompts | GAIA |
| Latency P50/P95 | Response time percentiles | Custom |
| Token Efficiency | Tokens used vs baseline | Custom |
| Policy Compliance | Adherence to defined rules | τ-Bench |

---

## PART 3: Framework Integrations

### 3.1 Google ADK (Agent Development Kit)

**Source**: [Google ADK Docs](https://google.github.io/adk-docs/)

**Integration Plan**:
```javascript
// lib/agentFrameworks/googleAdk.js
export class GoogleAdkAdapter {
  // Parse ADK agent definition
  parseAgent(code) {
    // Extract agent config, tools, prompts
  }

  // Generate test cases using ADK eval format
  generateTests(agent) {
    return {
      format: 'adk_eval',
      tests: [
        { input: '...', expected_output: '...', trajectory: [...] }
      ]
    };
  }

  // Run tests using ADK AgentEvaluator
  async runTests(agent, tests) {
    // Integration with ADK eval command
  }
}
```

**Key Features to Support**:
- Agent definition parsing
- Tool extraction
- Multi-agent orchestration tests
- Integration with Vertex AI Agent Engine

---

### 3.2 Anthropic Claude Agent SDK

**Source**: [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk)

**Integration Plan**:
```javascript
// lib/agentFrameworks/claudeAgentSdk.js
export class ClaudeAgentAdapter {
  // Parse Claude Agent SDK code
  parseAgent(code) {
    // Extract tools, hooks, system prompts
  }

  // Generate tests with self-evaluation
  generateTests(agent) {
    return {
      format: 'claude_sdk',
      tests: [
        {
          input: '...',
          evaluation: {
            rules: ['Must not leak PII', 'Must call tool before answering'],
            linter_checks: true
          }
        }
      ]
    };
  }

  // Leverage Claude's self-evaluation
  async runTests(agent, tests) {
    // Use SDK's built-in evaluation capabilities
  }
}
```

**Key Features to Support**:
- Tool definition extraction
- Hook testing
- Rules-based feedback evaluation
- Context management testing

---

### 3.3 Solace Agent Mesh

**Source**: [Solace Agent Mesh GitHub](https://github.com/SolaceLabs/solace-agent-mesh)

**Integration Plan**:
```javascript
// lib/agentFrameworks/solaceAgentMesh.js
export class SolaceAgentMeshAdapter {
  // Parse SAM agent configurations
  parseAgent(config) {
    // Extract agent definitions, A2A communication patterns
  }

  // Generate multi-agent orchestration tests
  generateTests(agents) {
    return {
      format: 'solace_mesh',
      tests: [
        {
          scenario: 'multi_agent_workflow',
          agents: ['orchestrator', 'worker_1', 'worker_2'],
          expected_flow: [...]
        }
      ]
    };
  }

  // Test event-driven agent communication
  async runTests(agents, tests) {
    // Mock Solace event mesh for testing
  }
}
```

**Key Features to Support**:
- Multi-agent workflow testing
- Event-driven communication tests
- A2A protocol validation
- Parallel execution testing

---

### 3.4 LangChain + LangSmith

**Source**: [LangSmith Evaluation](https://docs.langchain.com/langsmith/evaluation)

**Integration Plan**:
```javascript
// lib/agentFrameworks/langchain.js
export class LangChainAdapter {
  // Parse LangChain agent code
  parseAgent(code) {
    // Extract chain, tools, memory, callbacks
  }

  // Generate LangSmith-compatible datasets
  generateTests(agent) {
    return {
      format: 'langsmith',
      dataset: {
        name: 'agent_evaluation',
        examples: [
          { inputs: {...}, outputs: {...} }
        ]
      },
      evaluators: ['qa', 'criteria', 'trajectory']
    };
  }

  // Export to LangSmith for evaluation
  async exportToLangSmith(dataset, apiKey) {
    // Push dataset to LangSmith
  }
}
```

**Key Features to Support**:
- Chain analysis
- Memory testing
- Callback tracing
- LangSmith dataset export
- Trajectory evaluation

---

### 3.5 Microsoft AutoGen

**Source**: [AutoGen GitHub](https://github.com/microsoft/autogen)

**Integration Plan**:
```javascript
// lib/agentFrameworks/autogen.js
export class AutoGenAdapter {
  // Parse AutoGen agent definitions
  parseAgent(code) {
    // Extract ConversableAgent, UserProxyAgent configs
  }

  // Generate AutoGenBench-compatible tests
  generateTests(agents) {
    return {
      format: 'autogen_bench',
      tasks: [
        {
          scenario: 'conversation_flow',
          agents: [...],
          expected_messages: [...]
        }
      ]
    };
  }

  // Use AgentEval framework
  async evaluate(agents, tasks) {
    // Integrate with AutoGen's AgentEval
  }
}
```

**Key Features to Support**:
- Multi-agent conversation testing
- Code execution safety tests
- Human-in-loop simulation
- Group chat orchestration tests

---

### 3.6 CrewAI

**Source**: [CrewAI Testing Docs](https://docs.crewai.com/en/concepts/testing)

**Integration Plan**:
```javascript
// lib/agentFrameworks/crewai.js
export class CrewAIAdapter {
  // Parse CrewAI crew definitions
  parseAgent(code) {
    // Extract agents, tasks, tools, process
  }

  // Generate crewai test format
  generateTests(crew) {
    return {
      format: 'crewai_test',
      crew_tests: [
        {
          task: 'research_task',
          expected_output_contains: [...],
          max_iterations: 5
        }
      ]
    };
  }

  // Integrate with Promptfoo for red teaming
  async redTeam(crew, adversarialPrompts) {
    // Test crew against adversarial inputs
  }
}
```

**Key Features to Support**:
- Crew orchestration testing
- Task delegation verification
- Role-based agent testing
- Red team / adversarial testing (via Promptfoo)

---

## PART 4: Agent Test UI Flow

### New Navigation
```
┌──────────────────────────────────────────────────────┐
│ ORIZON                                               │
├──────────────────────────────────────────────────────┤
│ 📊 Dashboard                                         │
│ 🔍 Analyze Code ← (existing V1/V2)                  │
│ 🤖 Agent Testing ← (NEW)                            │
│   ├── Upload Agent                                  │
│   ├── Describe Agent                                │
│   ├── Test Results                                  │
│   └── Benchmarks                                    │
│ ▶️ Execute Tests                                     │
│ 📋 Projects                                         │
│ 📈 Reports                                          │
└──────────────────────────────────────────────────────┘
```

### Agent Testing Page Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 Agent Testing                              [History] [Help]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  How would you like to test your agent?                         │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  📤 Upload      │  │  📝 Describe    │  │  🔗 Connect     │ │
│  │                 │  │                 │  │                 │ │
│  │  Upload agent   │  │  Describe your  │  │  Connect to     │ │
│  │  source code    │  │  agent's purpose│  │  running agent  │ │
│  │  or config      │  │  and tools      │  │  (API endpoint) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  Supported Frameworks:                                          │
│  [LangChain] [CrewAI] [AutoGen] [Google ADK] [Claude SDK]      │
│  [Solace Agent Mesh] [Custom]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Test Configuration
```
┌─────────────────────────────────────────────────────────────────┐
│ Test Configuration                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Test Categories:                                                │
│ [✓] Functional Tests                                            │
│     └── Task completion, tool calling, response format          │
│ [✓] Safety Tests                                                │
│     └── Prompt injection, jailbreaks, data leakage             │
│ [ ] Performance Tests                                           │
│     └── Latency, token usage, concurrency                      │
│ [ ] Robustness Tests                                            │
│     └── Edge cases, errors, ambiguous inputs                   │
│                                                                 │
│ Evaluation Model:                                               │
│ ( ) Haiku (fast, cheap) - $0.01 per 100 tests                  │
│ (•) Sonnet 4 (balanced) - $0.10 per 100 tests                  │
│ ( ) Opus (thorough) - $0.50 per 100 tests                      │
│                                                                 │
│ Test Runs: [5] (for statistical significance)                   │
│                                                                 │
│ [Generate Test Suite]  [Run Tests]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Test Results Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ Test Results - Customer Support Agent                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Overall Score: 87/100  ████████████████░░░░                    │
│                                                                 │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│ │ Functional   │ Safety       │ Performance  │ Robustness   │  │
│ │    92%       │    85%       │    88%       │    83%       │  │
│ │   ✓ Pass     │   ⚠ Review   │   ✓ Pass     │   ⚠ Review   │  │
│ └──────────────┴──────────────┴──────────────┴──────────────┘  │
│                                                                 │
│ Failed Tests (3):                                               │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ ❌ Safety: Prompt injection via tool parameter            │  │
│ │    Input: "lookup_order('1234; DROP TABLE orders')"       │  │
│ │    Expected: Error/rejection                              │  │
│ │    Actual: Executed query                                 │  │
│ │    [View Details] [Suggested Fix]                         │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ [Export Report] [Re-run Failed] [Generate Fixes]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 5: Implementation Roadmap

### Phase 1: V2 Chat Improvements (Current Sprint)
| Task | Priority | Effort |
|------|----------|--------|
| Fix P0 issues (reset, steps, navigation) | P0 | 4h |
| Implement adaptive chat flows | P1 | 6h |
| Add context bar with source info | P1 | 2h |
| Chat history opt-in | P2 | 4h |

### Phase 2: Agent Testing Foundation
| Task | Priority | Effort |
|------|----------|--------|
| Agent upload UI & parsing | P0 | 8h |
| Agent description mode | P0 | 6h |
| Test case generation (functional) | P0 | 8h |
| Basic results display | P0 | 4h |

### Phase 3: Framework Adapters
| Task | Priority | Effort |
|------|----------|--------|
| LangChain adapter | P1 | 6h |
| CrewAI adapter | P1 | 6h |
| AutoGen adapter | P2 | 6h |
| Google ADK adapter | P2 | 6h |
| Claude Agent SDK adapter | P1 | 4h |
| Solace Agent Mesh adapter | P3 | 8h |

### Phase 4: Advanced Testing
| Task | Priority | Effort |
|------|----------|--------|
| Safety/security tests | P1 | 8h |
| Performance benchmarks | P2 | 6h |
| Red team testing | P2 | 8h |
| Multi-run statistics | P2 | 4h |

### Phase 5: Integration & Polish
| Task | Priority | Effort |
|------|----------|--------|
| LangSmith export | P2 | 4h |
| AutoGenBench export | P3 | 4h |
| Report generation (PDF) | P2 | 4h |
| API endpoint for CI/CD | P2 | 6h |

---

## PART 6: Database Schema Additions

```sql
-- Agent definitions
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  framework VARCHAR(50), -- langchain, crewai, autogen, adk, claude_sdk, solace, custom
  source_type VARCHAR(20), -- upload, describe, connect
  source_code TEXT,
  config JSONB, -- Parsed agent configuration
  tools JSONB, -- Tool definitions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test suites for agents
CREATE TABLE agent_test_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  name VARCHAR(255) NOT NULL,
  test_categories TEXT[], -- functional, safety, performance, robustness
  tests JSONB, -- Test case definitions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test runs
CREATE TABLE agent_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id UUID REFERENCES agent_test_suites(id),
  status VARCHAR(20), -- pending, running, complete, failed
  evaluation_model VARCHAR(50),
  results JSONB,
  scores JSONB, -- { functional: 92, safety: 85, ... }
  overall_score INTEGER,
  tokens_used INTEGER,
  cost DECIMAL(10, 4),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Individual test results
CREATE TABLE agent_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES agent_test_runs(id),
  test_name VARCHAR(255),
  category VARCHAR(50),
  input TEXT,
  expected_output TEXT,
  actual_output TEXT,
  passed BOOLEAN,
  score DECIMAL(5, 2),
  latency_ms INTEGER,
  tokens INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Research Sources

### AI Agent Testing Frameworks
- [AI Agent Evaluation Guide](https://www.lxt.ai/blog/ai-agent-evaluation/)
- [Benchmarking AI Agents 2025](https://metadesignsolutions.com/benchmarking-ai-agents-in-2025-top-tools-metrics-performance-testing-strategies/)
- [Best AI Agent Benchmarks](https://o-mega.ai/articles/the-best-ai-agent-evals-and-benchmarks-full-2025-guide)
- [How to Test AI Agents - Galileo](https://galileo.ai/learn/test-ai-agents)
- [8 Benchmarks Shaping AI Agents](https://ainativedev.io/news/8-benchmarks-shaping-the-next-generation-of-ai-agents)

### Framework Documentation
- [Google ADK Docs](https://google.github.io/adk-docs/)
- [Google ADK Testing](https://google.github.io/adk-docs/get-started/testing/)
- [Google ADK GitHub](https://github.com/google/adk-python)
- [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk)
- [Claude Agent SDK GitHub](https://github.com/anthropics/claude-agent-sdk-python)
- [Building Agents with Claude SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Solace Agent Mesh](https://solace.com/products/agent-mesh/)
- [Solace Agent Mesh GitHub](https://github.com/SolaceLabs/solace-agent-mesh)
- [LangSmith Evaluation](https://docs.langchain.com/langsmith/evaluation)
- [Evaluating Deep Agents - LangChain](https://blog.langchain.com/evaluating-deep-agents-our-learnings/)
- [AutoGen GitHub](https://github.com/microsoft/autogen)
- [AutoGen AgentEval](https://microsoft.github.io/autogen/0.2/blog/2024/06/21/AgentEval/)
- [CrewAI Testing](https://docs.crewai.com/en/concepts/testing)
- [Red Teaming CrewAI - Promptfoo](https://www.promptfoo.dev/docs/guides/evaluate-crewai/)

### Key Benchmarks
- **AgentBench**: Multi-environment LLM agent evaluation
- **WebArena**: Web-based task completion
- **SWE-bench**: Software engineering tasks
- **τ-Bench (Tau)**: Tool-use, policy compliance, repeatability
- **GAIA**: General AI Assistant benchmark
- **Terminal-Bench**: Command-line agent evaluation
- **Context-Bench**: Long-running context maintenance
