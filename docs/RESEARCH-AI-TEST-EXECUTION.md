# AI Test Execution Research: Arize & Galileo Integration

## Executive Summary

Research conducted on December 4, 2025, investigating Arize Phoenix and Galileo AI platforms for implementing real test execution capabilities in OrizonQA.

**Key Finding**: Both platforms are **LLM evaluation and observability tools**, not traditional test execution frameworks. They evaluate AI/LLM outputs for quality, hallucinations, relevance, and safety rather than running unit tests or integration tests.

---

## Platform Comparison

| Feature | Arize Phoenix | Galileo AI |
|---------|---------------|------------|
| **Type** | Open-source LLM observability | SaaS LLM evaluation |
| **Free Tier** | Self-hosted: Unlimited / Cloud: 25K traces/mo | 5K traces/month |
| **TypeScript SDK** | `@arizeai/phoenix-client` | `galileo` |
| **Python SDK** | `arize-phoenix`, `arize-phoenix-evals` | `promptquality` |
| **Self-Hosting** | Yes (FREE, Docker/K8s) | No (SaaS only) |
| **Best For** | Tracing, observability, self-hosted | Quick evaluation, managed service |

---

## Arize Phoenix

### Overview
Phoenix is an open-source AI observability platform built on OpenTelemetry. It provides tracing, evaluation, and experimentation capabilities for LLM applications.

### Key Features
- **Tracing**: End-to-end visibility into LLM calls, RAG pipelines, agents
- **Evaluations**: Built-in evaluators (hallucination, relevance, toxicity, QA correctness)
- **Datasets & Experiments**: Test different prompts/models against datasets
- **Prompt Management**: Version control for prompts
- **Human Annotation**: Attach ground truth labels

### Pricing
- **Self-hosted**: FREE (Elastic License 2.0)
- **Cloud Free**: 25K traces/mo, 1 user, 7-day retention
- **Cloud Paid**: $50/mo for 100K traces, 3 users

### TypeScript SDK Installation
```bash
npm install @arizeai/phoenix-client
```

### Basic Usage
```typescript
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient({
  options: {
    baseUrl: process.env.PHOENIX_HOST || "http://localhost:6006",
    headers: {
      Authorization: `Bearer ${process.env.PHOENIX_API_KEY}`,
    },
  },
});

// Get all datasets
const datasets = await phoenix.GET("/v1/datasets");

// Create evaluation run
const evalRun = await phoenix.POST("/v1/experiments", {
  body: {
    name: "test-run-1",
    dataset_id: "dataset-123",
  }
});
```

### Python Evaluation Example
```python
import phoenix as px
from phoenix.evals import HallucinationEvaluator, QAEvaluator, run_evals
from phoenix.evals.models import OpenAIModel

# Initialize model for evaluations
eval_model = OpenAIModel(model="gpt-4")

# Run evaluations on dataframe
hallucination_eval = HallucinationEvaluator(eval_model)
qa_eval = QAEvaluator(eval_model)

# Execute evaluations
results = run_evals(
    dataframe=df,  # Must have 'input', 'output', 'reference' columns
    evaluators=[hallucination_eval, qa_eval],
    provide_explanation=True
)
```

### Available Evaluators
- `HallucinationEvaluator` - Detects factually incorrect outputs
- `QAEvaluator` - Evaluates Q&A correctness
- `RelevanceEvaluator` - Measures context relevance
- `ToxicityEvaluator` - Detects harmful content
- `SummarizationEvaluator` - Evaluates summary quality
- Custom evaluators via `create_classifier`

### Documentation Links
- [Phoenix Docs](https://arize.com/docs/phoenix)
- [GitHub](https://github.com/Arize-ai/phoenix)
- [TypeScript SDK](https://www.npmjs.com/package/@arizeai/phoenix-client)
- [Python Evals](https://pypi.org/project/arize-phoenix-evals/)

---

## Galileo AI

### Overview
Galileo Evaluate is a dedicated evaluation platform within Galileo GenAI Studio for systematic testing of LLM outputs with built-in guardrails and custom metrics.

### Key Features
- **Evaluate**: Run experiments over datasets with automated scoring
- **Scorers**: Pre-built metrics (context adherence, prompt injection, PII)
- **Luna Models**: Low-latency evaluation models
- **Protect**: Real-time guardrails for production
- **Custom Metrics**: Define custom scoring functions

### Pricing
- **Free**: 5K traces/month
- **Enterprise**: Custom pricing with advanced features

### TypeScript SDK Installation
```bash
npm install galileo
```

### Environment Variables
```bash
GALILEO_API_KEY=your-api-key
GALILEO_PROJECT=my-project
GALILEO_LOG_STREAM=my-stream
GALILEO_CONSOLE_URL=https://console.galileo.ai  # optional
```

### Basic Usage (TypeScript)
```typescript
import { init, flush, wrapOpenAI } from 'galileo';
import OpenAI from 'openai';

// Initialize
await init({
  projectName: 'orizon-qa-tests',
  logStreamName: 'test-execution'
});

// Wrap OpenAI client for automatic logging
const openai = wrapOpenAI(new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}));

// Make calls - automatically logged to Galileo
const result = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Test prompt' }]
});

// Flush logs
await flush();
```

### Running Experiments
```typescript
import { runExperiment, createDataset } from 'galileo';

// Create dataset from test cases
const dataset = await createDataset({
  name: 'user-story-tests',
  rows: [
    { input: 'Test input 1', expected: 'Expected output 1' },
    { input: 'Test input 2', expected: 'Expected output 2' },
  ]
});

// Run experiment with custom runner
await runExperiment({
  name: 'Story Generation Test',
  datasetName: 'user-story-tests',
  runner: async (row) => {
    // Your test logic here
    const result = await yourLLMCall(row.input);
    return { output: result };
  },
  metrics: ['output_tone', 'context_adherence'],
  projectName: 'orizon-qa'
});
```

### Python SDK (promptquality)
```python
import promptquality as pq

pq.login('https://console.galileo.ai')

# Simple template testing
pq.run(
    project_name='orizon-tests',
    template="Generate user story for: {{feature}}",
    dataset={'feature': ['Login', 'Checkout', 'Profile']},
    settings=pq.Settings(
        model_alias='ChatGPT (16K context)',
        temperature=0.7
    )
)

# Advanced: EvaluateRun for existing applications
from promptquality import EvaluateRun

evaluate_run = EvaluateRun(
    run_name="test-suite-1",
    project_name="orizon-qa",
    scorers=[
        pq.Scorers.context_adherence_plus,
        pq.Scorers.prompt_injection,
        pq.Scorers.pii
    ]
)

# Log your test execution
evaluate_run.add_workflow(
    input="Generate test case for login",
    output="Test case: User should be able to...",
    metadata={"test_id": "TC-001"}
)

evaluate_run.finish()
```

### Available Scorers
- `context_adherence_plus` - Output adheres to context
- `prompt_injection` - Detects injection attacks
- `pii` - Detects personally identifiable information
- `completeness_luna` - Output completeness
- `toxicity` - Harmful content detection
- Custom scorers via Metrics IDE

### Documentation Links
- [Galileo Evaluate Docs](https://docs.galileo.ai/galileo/gen-ai-studio-products/galileo-evaluate)
- [GitHub SDK Examples](https://github.com/rungalileo/sdk-examples)
- [TypeScript SDK](https://github.com/rungalileo/galileo-js)
- [Python SDK (promptquality)](https://pypi.org/project/promptquality/)

---

## Integration Strategy for OrizonQA

### What These Platforms Actually Do

**Important Clarification**: Neither Arize nor Galileo runs traditional tests like Jest or Pytest. They evaluate LLM outputs. For OrizonQA, the integration would:

1. **Transform Generated Test Cases** → Evaluation Datasets
2. **Execute LLM Prompts** → Generate actual outputs
3. **Evaluate Outputs** → Score quality, detect issues
4. **Track Results** → Observability dashboard

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORIZONQA TEST EXECUTION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. ORIZONQA GENERATES                                           │
│     ├─> User Stories                                             │
│     ├─> Test Cases                                               │
│     └─> Acceptance Criteria                                      │
│                                                                   │
│  2. CONVERT TO EVALUATION DATASET                                │
│     └─> Transform test cases into input/expected pairs           │
│                                                                   │
│  3. EXECUTE WITH AI                                              │
│     ├─> Run prompts through LLM (Claude/GPT)                     │
│     └─> Collect actual outputs                                   │
│                                                                   │
│  4. EVALUATE WITH ARIZE/GALILEO                                  │
│     ├─> Check for hallucinations                                 │
│     ├─> Measure correctness                                      │
│     ├─> Detect safety issues                                     │
│     └─> Track quality metrics                                    │
│                                                                   │
│  5. DISPLAY RESULTS IN ORIZONQA                                  │
│     ├─> Pass/Fail status                                         │
│     ├─> Quality scores                                           │
│     └─> Detailed evaluations                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Approach

**Option A: Arize Phoenix (Self-Hosted)**
- Pros: Free, full control, open-source, good TypeScript SDK
- Cons: Requires infrastructure (Docker)
- Best for: Teams wanting data control, cost savings

**Option B: Galileo AI (SaaS)**
- Pros: Quick setup, managed service, good experiment features
- Cons: 5K free traces limit, paid at scale
- Best for: Quick prototyping, managed experience

**Option C: Hybrid Custom Solution**
- Use LLM to evaluate test cases directly
- Build custom evaluation logic
- Store results in OrizonQA's PostgreSQL
- No external dependency

### Implementation Files Needed

```
lib/
├── testExecution/
│   ├── phoenixClient.js      # Arize Phoenix integration
│   ├── galileoClient.js      # Galileo integration
│   ├── evaluator.js          # Unified evaluation interface
│   └── datasetConverter.js   # Convert test cases to datasets

app/api/
├── execute-tests/
│   └── route.js              # API endpoint for test execution

app/analyze/components/
├── TestExecutionPanel.jsx    # UI for test execution
├── EvaluationResults.jsx     # Display evaluation results
└── TestRunHistory.jsx        # Historical test runs
```

### Sample API Implementation

```javascript
// app/api/execute-tests/route.js
import { createClient } from "@arizeai/phoenix-client";

export async function POST(request) {
  const { testCases, provider = 'phoenix' } = await request.json();

  // Convert test cases to evaluation dataset format
  const dataset = testCases.map(tc => ({
    input: tc.steps.join('\n'),
    expected: tc.expectedResult,
    metadata: { id: tc.id, type: tc.type }
  }));

  if (provider === 'phoenix') {
    const phoenix = createClient();

    // Create dataset
    const { data: ds } = await phoenix.POST("/v1/datasets", {
      body: { name: `orizon-${Date.now()}`, examples: dataset }
    });

    // Create experiment
    const { data: exp } = await phoenix.POST("/v1/experiments", {
      body: { dataset_id: ds.id, name: "test-run" }
    });

    // Run evaluations...
    return NextResponse.json({ experimentId: exp.id, status: 'running' });
  }

  // Galileo implementation...
}
```

---

## Comparison: LLM Evaluation vs Traditional Testing

| Aspect | Traditional Testing (Jest/Pytest) | LLM Evaluation (Arize/Galileo) |
|--------|-----------------------------------|--------------------------------|
| **What it tests** | Code behavior | AI output quality |
| **Test format** | Assertions, mocks | Input/output pairs |
| **Metrics** | Pass/fail, coverage | Scores, explanations |
| **Execution** | Deterministic | Probabilistic |
| **Use case** | Code correctness | AI reliability |

### For OrizonQA

OrizonQA generates **test specifications** (user stories, test cases). These can be:

1. **Exported to traditional test frameworks** (current approach)
   - User copies generated Jest/Pytest tests
   - Runs them locally

2. **Executed as LLM evaluations** (new capability with Arize/Galileo)
   - Tests become evaluation prompts
   - AI generates actual outputs
   - Platform scores quality

3. **Hybrid approach**
   - Generate both traditional tests AND evaluation datasets
   - Support both execution methods

---

## Next Steps

1. **Decide on platform**: Phoenix (self-hosted) vs Galileo (SaaS)
2. **Set up integration**: Install SDK, configure environment
3. **Build converter**: Transform OrizonQA test cases → evaluation datasets
4. **Create execution API**: New endpoint for running evaluations
5. **Build UI**: Panel for triggering execution, viewing results
6. **Track history**: Store evaluation results in PostgreSQL

---

## Sources

### Arize Phoenix
- [Arize AI Platform](https://arize.com/)
- [Phoenix Documentation](https://arize.com/docs/phoenix)
- [GitHub Repository](https://github.com/Arize-ai/phoenix)
- [TypeScript SDK](https://www.npmjs.com/package/@arizeai/phoenix-client)
- [Python Evals Package](https://pypi.org/project/arize-phoenix-evals/)
- [Pricing](https://phoenix.arize.com/pricing/)

### Galileo AI
- [Galileo Platform](https://galileo.ai/)
- [Evaluate Documentation](https://docs.galileo.ai/galileo/gen-ai-studio-products/galileo-evaluate)
- [TypeScript SDK](https://github.com/rungalileo/galileo-js)
- [SDK Examples](https://github.com/rungalileo/sdk-examples)
- [Python SDK (promptquality)](https://pypi.org/project/promptquality/)
- [Pricing](https://galileo.ai/pricing)
