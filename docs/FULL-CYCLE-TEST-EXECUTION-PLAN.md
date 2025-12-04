# Full-Cycle Test Execution Plan for OrizonQA

## Executive Summary

Transform OrizonQA from a **test generation tool** into a **full-cycle QA platform** that can generate, execute, and report on tests across all supported frameworks.

---

## Current State: What OrizonQA Generates

### Test Frameworks (11 total)
| Framework | Language | Type | File Extension |
|-----------|----------|------|----------------|
| Jest | JavaScript/TypeScript | Unit | `.test.js` |
| Vitest | JavaScript/TypeScript | Unit | `.test.ts` |
| Mocha+Chai | JavaScript | Unit | `.test.js` |
| Playwright | JavaScript/TypeScript | E2E | `.spec.ts` |
| Cypress | JavaScript | E2E | `.cy.js` |
| Pytest | Python | Unit | `test_*.py` |
| JUnit 5 | Java | Unit | `*Test.java` |
| xUnit | C#/.NET | Unit | `*Tests.cs` |
| RSpec | Ruby | Unit | `*_spec.rb` |
| Go Test | Go | Unit | `*_test.go` |
| PHPUnit | PHP | Unit | `*Test.php` |
| Generic | Any | Manual | `.md` |

### Output Formats (12 total)
| Format | Category | Purpose |
|--------|----------|---------|
| Markdown | Docs | Human-readable |
| HTML | Docs | Styled reports |
| JSON | Data | API integration |
| YAML | Data | Configuration |
| CSV | Data | Spreadsheets |
| Jira | Integration | Jira import |
| TestRail | Integration | TestRail import |
| Xray | Integration | Jira Xray import |
| Azure DevOps | Integration | Azure import |
| Gherkin | BDD | Cucumber feature files |
| Robot Framework | BDD | Robot test files |

---

## Architecture: Full-Cycle Test Execution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ORIZONQA FULL-CYCLE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   GENERATE  │───▶│   PREPARE   │───▶│   EXECUTE   │───▶│   REPORT    │   │
│  │  Test Cases │    │  Environment │   │  Run Tests  │    │  Results    │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│         │                 │                  │                  │           │
│         ▼                 ▼                  ▼                  ▼           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │ AI Analysis │    │   Docker    │    │  Framework  │    │   Allure    │   │
│  │ (Claude/LLM)│    │  Containers │    │   Runners   │    │   Report    │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        EXECUTION ENGINES                                 │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  JavaScript: Jest, Vitest, Mocha, Playwright, Cypress                   │ │
│  │  Python: Pytest, Robot Framework, Behave (Cucumber)                     │ │
│  │  Java: JUnit 5, Maven Surefire                                          │ │
│  │  BDD: Cucumber-JS, Cucumber-Java, Behave                                │ │
│  │  E2E: Playwright (cross-browser), Cypress                               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Open Source Tools Per Test Type

### 1. JavaScript/TypeScript Unit Tests

#### Jest Execution
```javascript
// Direct execution via Node.js child_process
const { execSync } = require('child_process');

// Save generated tests to temp directory
fs.writeFileSync('/tmp/tests/auth.test.js', generatedJestCode);

// Execute Jest
const result = execSync('npx jest /tmp/tests --json --outputFile=results.json', {
  cwd: '/tmp/tests',
  env: { ...process.env, CI: 'true' }
});

// Parse results
const jestResults = JSON.parse(fs.readFileSync('/tmp/tests/results.json'));
```

**Open Source Tools:**
- **Jest** (MIT) - Direct execution with JSON reporter
- **Vitest** (MIT) - Drop-in Jest replacement, faster
- **c8** (ISC) - Code coverage for Node.js

---

### 2. JavaScript/TypeScript E2E Tests

#### Playwright Execution
```javascript
import { chromium } from 'playwright';

// Programmatic execution
const { exec } = require('child_process');

// Save generated Playwright tests
fs.writeFileSync('/tmp/e2e/login.spec.ts', generatedPlaywrightCode);

// Execute Playwright
exec('npx playwright test /tmp/e2e --reporter=json > results.json', {
  cwd: projectDir
}, (error, stdout, stderr) => {
  const results = JSON.parse(fs.readFileSync('results.json'));
});
```

**Open Source Tools:**
- **Playwright** (Apache 2.0) - Cross-browser testing by Microsoft
- **Cypress** (MIT) - E2E testing with time-travel debugging
- **Playwright Test Runner** - Built-in parallel execution

#### Cypress Execution
```javascript
// cypress.config.js
module.exports = {
  e2e: {
    specPattern: '/tmp/cypress/**/*.cy.js',
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'results',
      overwrite: false,
      html: false,
      json: true
    }
  }
};

// Execute programmatically
const cypress = require('cypress');
const results = await cypress.run({
  spec: '/tmp/cypress/login.cy.js'
});
```

---

### 3. Python Unit Tests (Pytest)

#### Pytest Execution
```python
import pytest
import json

# Save generated tests
with open('/tmp/tests/test_auth.py', 'w') as f:
    f.write(generated_pytest_code)

# Execute with JSON output
exit_code = pytest.main([
    '/tmp/tests',
    '--json-report',
    '--json-report-file=/tmp/results.json',
    '-v'
])

# Parse results
with open('/tmp/results.json') as f:
    results = json.load(f)
```

**Open Source Tools:**
- **Pytest** (MIT) - Python testing framework
- **pytest-json-report** (MIT) - JSON output for results
- **pytest-html** (MPL 2.0) - HTML reports
- **pytest-cov** (MIT) - Coverage reporting

---

### 4. BDD/Gherkin Tests

#### Cucumber-JS Execution
```javascript
const Cucumber = require('@cucumber/cucumber');
const { Cli } = Cucumber;

// Save feature file
fs.writeFileSync('/tmp/features/login.feature', generatedGherkinCode);

// Generate step definitions (AI can help here too)
fs.writeFileSync('/tmp/features/steps/login.steps.js', generatedStepDefs);

// Execute
const cli = new Cli({
  argv: ['node', 'cucumber-js', '/tmp/features', '--format', 'json:results.json'],
  cwd: process.cwd(),
  stdout: process.stdout
});
await cli.run();
```

**Open Source Tools:**
- **Cucumber-JS** (MIT) - JavaScript BDD runner
- **Cucumber-Java** (MIT) - Java BDD runner
- **Behave** (BSD) - Python BDD runner
- **cucumber-reporting** - HTML report generation

#### Robot Framework Execution
```python
from robot import run_cli

# Save generated Robot test
with open('/tmp/robot/login.robot', 'w') as f:
    f.write(generated_robot_code)

# Execute
exit_code = run_cli([
    '--outputdir', '/tmp/results',
    '--output', 'output.xml',
    '--report', 'report.html',
    '/tmp/robot'
])

# Parse results from XML
import xml.etree.ElementTree as ET
tree = ET.parse('/tmp/results/output.xml')
```

**Open Source Tools:**
- **Robot Framework** (Apache 2.0) - Generic automation framework
- **robotframework-browser** - Playwright integration for Robot
- **robotframework-requests** - HTTP/REST testing

---

### 5. Java Unit Tests (JUnit)

#### JUnit + Maven Execution
```java
// pom.xml with Surefire plugin
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.5</version>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
        </includes>
    </configuration>
</plugin>
```

```bash
# Execute via Maven
mvn test -Dtest=AuthenticationTest -DfailIfNoTests=false
mvn surefire-report:report
```

**Open Source Tools:**
- **JUnit 5** (EPL 2.0) - Java testing framework
- **Maven Surefire** (Apache 2.0) - Test execution plugin
- **Allure JUnit** - Rich test reporting

---

### 6. Containerized Execution (All Languages)

#### Docker-Based Test Runner
```dockerfile
# Dockerfile.test-runner
FROM node:20-slim AS js-runner
RUN npm install -g jest vitest playwright cypress
WORKDIR /tests

FROM python:3.12-slim AS py-runner
RUN pip install pytest pytest-json-report robot-framework behave
WORKDIR /tests

FROM maven:3.9-eclipse-temurin-21 AS java-runner
WORKDIR /tests
```

```javascript
// lib/testExecutor.js
import Docker from 'dockerode';

const docker = new Docker();

async function executeTests(testCode, framework) {
  const container = await docker.createContainer({
    Image: `orizon-runner-${framework}`,
    Cmd: getExecutionCommand(framework),
    HostConfig: {
      Binds: [`${tempDir}:/tests:rw`],
      Memory: 512 * 1024 * 1024, // 512MB limit
      CpuPeriod: 100000,
      CpuQuota: 50000 // 50% CPU
    }
  });

  await container.start();
  const result = await container.wait();
  const logs = await container.logs({ stdout: true, stderr: true });
  await container.remove();

  return parseResults(framework, logs);
}
```

**Open Source Tools:**
- **Testcontainers** (MIT) - Container management for tests
- **Docker SDK** - Programmatic container control
- **dockerode** (Apache 2.0) - Docker API for Node.js

---

## Reporting: Allure Integration

### Allure Report Setup
```javascript
// Generate Allure-compatible results
const allureResults = {
  uuid: crypto.randomUUID(),
  historyId: generateHistoryId(testCase),
  name: testCase.title,
  status: result.passed ? 'passed' : 'failed',
  stage: 'finished',
  steps: result.steps.map(s => ({
    name: s.description,
    status: s.passed ? 'passed' : 'failed',
    start: s.startTime,
    stop: s.endTime
  })),
  attachments: [],
  labels: [
    { name: 'framework', value: framework },
    { name: 'severity', value: testCase.priority },
    { name: 'feature', value: testCase.feature }
  ]
};

// Save as Allure result file
fs.writeFileSync(
  `/tmp/allure-results/${allureResults.uuid}-result.json`,
  JSON.stringify(allureResults)
);

// Generate HTML report
execSync('allure generate /tmp/allure-results -o /tmp/allure-report --clean');
```

**Open Source Tools:**
- **Allure Report** (Apache 2.0) - Multi-language test reporting
- **allure-commandline** - CLI for report generation
- **allure-js-commons** - JavaScript integration

---

## Implementation Plan

### Phase 1: Core Execution Engine
**Files to Create:**
```
lib/
├── testExecution/
│   ├── executor.js           # Main execution orchestrator
│   ├── runners/
│   │   ├── jestRunner.js     # Jest test execution
│   │   ├── vitestRunner.js   # Vitest execution
│   │   ├── playwrightRunner.js
│   │   ├── cypressRunner.js
│   │   ├── pytestRunner.js
│   │   ├── cucumberRunner.js
│   │   ├── robotRunner.js
│   │   └── junitRunner.js
│   ├── sandbox/
│   │   ├── dockerExecutor.js # Container-based isolation
│   │   └── tempWorkspace.js  # Temp file management
│   └── parsers/
│       ├── jestResultParser.js
│       ├── pytestResultParser.js
│       └── allureConverter.js
```

### Phase 2: API Endpoints
```
app/api/
├── execute-tests/
│   ├── route.js              # Start test execution
│   └── [executionId]/
│       ├── status/route.js   # Get execution status
│       └── results/route.js  # Get results
├── execution-history/
│   └── route.js              # List past executions
```

### Phase 3: UI Components
```
app/
├── execute/
│   ├── page.js               # Test execution page
│   └── components/
│       ├── ExecutionPanel.jsx
│       ├── TestSelector.jsx
│       ├── EnvironmentConfig.jsx
│       ├── LiveOutput.jsx
│       └── ResultsViewer.jsx
├── reports/
│   ├── page.js               # Allure reports viewer
│   └── [executionId]/page.js # Individual report
```

### Phase 4: Database Schema
```sql
-- Test executions
CREATE TABLE test_executions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  analysis_id INTEGER REFERENCES analyses(id),
  framework VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_tests INTEGER,
  passed_tests INTEGER,
  failed_tests INTEGER,
  skipped_tests INTEGER,
  duration_ms INTEGER,
  allure_report_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual test results
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  execution_id INTEGER REFERENCES test_executions(id) ON DELETE CASCADE,
  test_name VARCHAR(500),
  test_id VARCHAR(100),
  status VARCHAR(20), -- passed, failed, skipped, broken
  duration_ms INTEGER,
  error_message TEXT,
  stack_trace TEXT,
  steps JSONB,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Framework-Specific Execution Matrix

| Framework | Execution Method | Result Format | Report Tool |
|-----------|-----------------|---------------|-------------|
| Jest | `npx jest --json` | JSON | Allure-Jest |
| Vitest | `npx vitest run --reporter=json` | JSON | Allure-Vitest |
| Playwright | `npx playwright test --reporter=json` | JSON | Allure-Playwright |
| Cypress | `cypress.run()` API | JSON | Mochawesome |
| Pytest | `pytest --json-report` | JSON | Allure-Pytest |
| Cucumber-JS | `cucumber-js --format json` | JSON | Allure-Cucumber |
| Robot | `robot --output xml` | XML | Robot HTML |
| JUnit | Maven Surefire | XML | Allure-JUnit |

---

## Security Considerations

### Sandbox Execution
```javascript
// Docker security settings
const containerConfig = {
  HostConfig: {
    // Resource limits
    Memory: 512 * 1024 * 1024,    // 512MB max
    CpuQuota: 50000,              // 50% CPU

    // Security
    NetworkMode: 'none',          // No network access
    ReadonlyRootfs: true,         // Read-only filesystem
    CapDrop: ['ALL'],             // Drop all capabilities
    SecurityOpt: ['no-new-privileges'],

    // Timeout
    StopTimeout: 60               // 60 second max execution
  }
};
```

### Test Code Validation
```javascript
// Validate generated test code before execution
function validateTestCode(code, framework) {
  const dangerous = [
    /require\(['"]child_process['"]\)/,
    /require\(['"]fs['"]\)/,
    /process\.env/,
    /eval\(/,
    /Function\(/,
    /exec\(/,
    /spawn\(/
  ];

  for (const pattern of dangerous) {
    if (pattern.test(code)) {
      throw new Error(`Dangerous pattern detected: ${pattern}`);
    }
  }
}
```

---

## NPM Dependencies to Add

```json
{
  "dependencies": {
    "dockerode": "^4.0.2",
    "allure-js-commons": "^2.15.0",
    "allure-commandline": "^2.27.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "cypress": "^13.6.0",
    "jest": "^29.7.0",
    "vitest": "^1.0.0"
  }
}
```

---

## Cost & Performance Estimates

| Execution Type | Avg Duration | Resource Usage |
|----------------|--------------|----------------|
| Jest (10 tests) | 2-5 seconds | 128MB RAM |
| Playwright E2E (5 tests) | 30-60 seconds | 512MB RAM |
| Cypress E2E (5 tests) | 45-90 seconds | 1GB RAM |
| Pytest (10 tests) | 3-8 seconds | 128MB RAM |
| Cucumber (10 scenarios) | 10-30 seconds | 256MB RAM |

---

---

## REFINEMENTS (v2)

### 1. Missing Framework Runners

#### xUnit (.NET) Execution
```csharp
// Run via dotnet CLI
// Save generated test to temp directory
File.WriteAllText("/tmp/tests/AuthTests.cs", generatedXunitCode);
```

```bash
# Execute xUnit via dotnet
cd /tmp/tests
dotnet new xunit -n TempTests
dotnet add package xunit
dotnet add package xunit.runner.visualstudio
dotnet test --logger "json;LogFilePath=results.json"
```

**Open Source Tools:**
- **xUnit.net** (Apache 2.0) - .NET testing framework
- **dotnet test** - Built-in test runner
- **ReportGenerator** - Coverage reports

#### RSpec (Ruby) Execution
```ruby
# Save generated spec
File.write('/tmp/specs/auth_spec.rb', generated_rspec_code)

# Execute RSpec with JSON formatter
require 'rspec'
RSpec.configure do |c|
  c.formatter = :json
  c.out = '/tmp/results.json'
end

RSpec::Core::Runner.run(['/tmp/specs'])
```

```bash
# CLI execution
rspec /tmp/specs --format json --out results.json
```

**Open Source Tools:**
- **RSpec** (MIT) - Ruby BDD/TDD framework
- **rspec-json_formatter** - JSON output
- **SimpleCov** (MIT) - Coverage

#### Go Test Execution
```go
// Generated test saved to /tmp/tests/auth_test.go
```

```bash
# Execute Go tests with JSON output
cd /tmp/tests
go mod init temptest
go test -json ./... > results.json

# Parse with gotestsum for better output
gotestsum --format testname --jsonfile results.json
```

**Open Source Tools:**
- **Go Test** (BSD) - Built-in testing
- **gotestsum** (MIT) - Enhanced test output
- **go-cover** - Coverage reporting

#### PHPUnit Execution
```php
<?php
// Save generated test
file_put_contents('/tmp/tests/AuthTest.php', $generatedPhpunitCode);
```

```bash
# Execute PHPUnit with JSON log
cd /tmp/tests
composer require --dev phpunit/phpunit
./vendor/bin/phpunit --log-junit results.xml --testdox-html report.html
```

**Open Source Tools:**
- **PHPUnit** (BSD-3) - PHP testing framework
- **phpunit-json-log** - JSON output extension
- **php-code-coverage** - Coverage

---

### 2. BDD Step Definition Generation

**Problem**: Gherkin/Cucumber tests require step definitions. AI generates feature files but not the glue code.

**Solution**: AI-Assisted Step Definition Generation

```javascript
// lib/testExecution/stepDefinitionGenerator.js

export async function generateStepDefinitions(featureFile, targetFramework) {
  const steps = parseGherkinSteps(featureFile);

  const prompt = `
Generate ${targetFramework} step definitions for these Gherkin steps:

${steps.map(s => `- ${s.keyword} ${s.text}`).join('\n')}

Requirements:
- Use ${targetFramework === 'cucumber-js' ? 'JavaScript' : 'Python'} syntax
- Include common assertions
- Add TODO comments for implementation details
- Follow best practices for step reusability
`;

  const definitions = await callAI(prompt);
  return definitions;
}

// Usage flow:
// 1. User generates Gherkin tests (existing OrizonQA)
// 2. User clicks "Execute"
// 3. System detects Gherkin format
// 4. AI generates step definitions
// 5. Both files passed to Cucumber runner
```

**Step Definition Templates by Language:**

```javascript
// Cucumber-JS
const { Given, When, Then } = require('@cucumber/cucumber');

Given('I am on the login page', async function() {
  // TODO: Navigate to login page
});

When('I enter valid credentials', async function() {
  // TODO: Enter username and password
});

Then('I should be redirected to dashboard', async function() {
  // TODO: Assert dashboard URL
});
```

```python
# Behave (Python)
from behave import given, when, then

@given('I am on the login page')
def step_impl(context):
    # TODO: Navigate to login page
    pass

@when('I enter valid credentials')
def step_impl(context):
    # TODO: Enter username and password
    pass

@then('I should be redirected to dashboard')
def step_impl(context):
    # TODO: Assert dashboard URL
    pass
```

---

### 3. Execution Strategy Options

#### Option A: Browser-Based (WebContainers)
**Best for**: JavaScript tests (Jest, Vitest, Playwright)

```javascript
// Using StackBlitz WebContainers
import { WebContainer } from '@webcontainer/api';

const webcontainer = await WebContainer.boot();

// Write test files
await webcontainer.mount({
  'package.json': {
    file: { contents: JSON.stringify({ /* ... */ }) }
  },
  'tests': {
    directory: {
      'auth.test.js': { file: { contents: testCode } }
    }
  }
});

// Install and run
await webcontainer.spawn('npm', ['install']);
const process = await webcontainer.spawn('npm', ['test']);
```

**Pros**: No backend infrastructure, instant startup, free
**Cons**: Limited to Node.js ecosystem, browser memory limits

#### Option B: Serverless Backend (Vercel/AWS Lambda)
**Best for**: Quick unit tests with limited dependencies

```javascript
// Vercel Edge Function with timeout extension
export const config = {
  runtime: 'edge',
  maxDuration: 60 // 60 seconds max
};

export async function POST(request) {
  const { testCode, framework } = await request.json();

  // Limited execution environment
  // Good for: parsing, validation, small tests
  // Bad for: Docker, Playwright, complex setups
}
```

**Pros**: Managed infrastructure, scales automatically
**Cons**: 60s timeout, no Docker, limited packages

#### Option C: Docker Host (Recommended for Full Execution)
**Best for**: All frameworks, complex tests, E2E

```
┌─────────────────────────────────────────────────────────────┐
│                 DOCKER EXECUTION OPTIONS                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. USER-PROVIDED DOCKER HOST                                │
│     └─> User runs Docker locally or on their server          │
│     └─> OrizonQA connects via Docker API                     │
│     └─> Zero infrastructure cost for us                      │
│                                                               │
│  2. CLOUD DOCKER-AS-A-SERVICE                                │
│     ├─> AWS Fargate (pay-per-use containers)                 │
│     ├─> Google Cloud Run (serverless containers)             │
│     ├─> Fly.io (edge containers)                             │
│     └─> Railway.app (easy Docker deployment)                 │
│                                                               │
│  3. HYBRID (Recommended)                                      │
│     ├─> Simple tests → WebContainer (free)                   │
│     ├─> Complex tests → User's Docker (free for us)          │
│     └─> On-demand → Cloud containers (paid)                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Hybrid Strategy Implementation:**

```javascript
// lib/testExecution/strategySelector.js

export function selectExecutionStrategy(tests, framework, config) {
  // WebContainer: Simple JS tests
  if (framework in ['jest', 'vitest'] && !tests.needsNetwork && !tests.needsDocker) {
    return {
      strategy: 'webcontainer',
      cost: 0,
      estimatedTime: tests.count * 0.5 // 0.5s per test
    };
  }

  // User Docker: E2E or complex tests
  if (config.userDockerHost) {
    return {
      strategy: 'user-docker',
      host: config.userDockerHost,
      cost: 0,
      estimatedTime: tests.count * 5
    };
  }

  // Cloud: Fallback for users without Docker
  return {
    strategy: 'cloud-docker',
    provider: 'fly.io', // or 'railway', 'fargate'
    cost: calculateCloudCost(tests, framework),
    estimatedTime: tests.count * 3
  };
}
```

---

### 4. Test Environment Configuration

#### Mock API Servers
```javascript
// lib/testExecution/mocks/mockServer.js
import { setupServer } from 'msw/node';
import { rest } from 'msw';

export function createMockServer(apiMocks) {
  const handlers = apiMocks.map(mock =>
    rest[mock.method](mock.url, (req, res, ctx) => {
      return res(ctx.json(mock.response));
    })
  );

  return setupServer(...handlers);
}

// In test execution
const mockConfig = {
  mocks: [
    { method: 'get', url: '/api/users', response: { users: [] } },
    { method: 'post', url: '/api/login', response: { token: 'test-token' } }
  ]
};

const server = createMockServer(mockConfig.mocks);
server.listen();
// Run tests
server.close();
```

#### Database Fixtures (Testcontainers)
```javascript
// lib/testExecution/fixtures/database.js
import { PostgreSqlContainer } from '@testcontainers/postgresql';

export async function setupTestDatabase(fixtures) {
  const container = await new PostgreSqlContainer()
    .withDatabase('testdb')
    .start();

  // Load fixtures
  const pool = new Pool({ connectionString: container.getConnectionUri() });
  for (const fixture of fixtures) {
    await pool.query(fixture.sql);
  }

  return {
    connectionUri: container.getConnectionUri(),
    cleanup: () => container.stop()
  };
}
```

#### Environment Variable Injection
```javascript
// lib/testExecution/environment.js

export function prepareEnvironment(testConfig) {
  const env = {
    // Safe defaults
    NODE_ENV: 'test',
    CI: 'true',

    // User-provided (validated)
    ...sanitizeEnvVars(testConfig.environment),

    // Mock service URLs
    API_URL: 'http://localhost:3001',
    DB_URL: testConfig.databaseUri || 'mock://testdb'
  };

  return env;
}

function sanitizeEnvVars(vars) {
  // Block dangerous variables
  const blocked = ['PATH', 'HOME', 'USER', 'SHELL', 'PWD'];
  return Object.fromEntries(
    Object.entries(vars).filter(([k]) => !blocked.includes(k))
  );
}
```

---

### 5. Integration with OrizonQA Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  USER JOURNEY: FULL CYCLE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. ANALYZE PAGE (/analyze)                                      │
│     └─> Upload code / Connect GitHub                             │
│     └─> AI generates test cases                                  │
│     └─> Results displayed in tabs                                │
│                                                                   │
│  2. RESULTS PAGE (new tab or /analyze/results/[id])             │
│     └─> View generated tests                                     │
│     └─> [NEW] "Execute Tests" button                             │
│     └─> Select which tests to run                                │
│     └─> Configure execution (mocks, env vars)                    │
│                                                                   │
│  3. EXECUTION PAGE (/execute/[id]) [NEW]                        │
│     └─> Live progress (SSE stream)                               │
│     └─> Per-test status updates                                  │
│     └─> Log output viewer                                        │
│     └─> Abort/retry controls                                     │
│                                                                   │
│  4. RESULTS PAGE (/reports/[executionId]) [NEW]                 │
│     └─> Allure-style report                                      │
│     └─> Pass/fail breakdown                                      │
│     └─> Error details with stack traces                          │
│     └─> Re-run failed tests button                               │
│     └─> Export to Jira/TestRail                                  │
│                                                                   │
│  5. HISTORY PAGE (/history) [ENHANCED]                          │
│     └─> Show analysis + execution pairs                          │
│     └─> Filter by: all, analyzed, executed, passed, failed       │
│     └─> Quick actions: re-analyze, re-execute                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**New UI Components:**

```
app/
├── analyze/
│   └── components/
│       └── ExecuteButton.jsx     # [NEW] Trigger execution from results
│
├── execute/                       # [NEW] Execution flow
│   ├── page.js                   # Execution configuration
│   ├── [id]/
│   │   └── page.js               # Live execution view
│   └── components/
│       ├── TestSelector.jsx      # Select tests to run
│       ├── EnvironmentConfig.jsx # Mocks, env vars
│       ├── ExecutionStrategy.jsx # WebContainer vs Docker
│       ├── LiveProgress.jsx      # Real-time status
│       └── LogViewer.jsx         # Terminal output
│
├── reports/                       # [NEW] Results viewing
│   ├── page.js                   # Execution history list
│   └── [id]/
│       └── page.js               # Individual execution report
│       └── components/
│           ├── SummaryCard.jsx
│           ├── TestList.jsx
│           ├── FailureDetails.jsx
│           └── AllureReport.jsx  # Embedded Allure
```

---

### 6. Pricing/Credits Model

**Execution costs money** (Docker compute time). Options:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRICING MODELS                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  OPTION A: Credit System                                     │
│  ├─> Free tier: 100 execution minutes/month                 │
│  ├─> Pro tier: 1000 minutes ($10/mo)                        │
│  ├─> Enterprise: Unlimited (bring your own Docker)          │
│  └─> Pay-as-you-go: $0.01/minute                            │
│                                                               │
│  OPTION B: Bring Your Own Compute (BYOC)                    │
│  ├─> User provides Docker host                               │
│  ├─> We provide the orchestration                           │
│  └─> Zero execution cost for OrizonQA                       │
│                                                               │
│  OPTION C: Hybrid (Recommended)                              │
│  ├─> WebContainer: Always free (JS only)                    │
│  ├─> User Docker: Free (user's compute)                     │
│  ├─> Cloud Docker: Credit-based                             │
│  └─> Encourages self-hosting for power users                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 7. AI-Assisted Execution Features

#### Auto-Fix Failing Tests
```javascript
// When a test fails, offer AI fix suggestions
async function suggestTestFix(failedTest, error) {
  const prompt = `
This test is failing:
\`\`\`javascript
${failedTest.code}
\`\`\`

Error:
${error.message}
${error.stack}

Suggest a fix for this test. Consider:
1. Is the assertion correct?
2. Is there a timing issue (async/await)?
3. Is the test targeting the right element?
4. Is the expected value correct?
`;

  return await callAI(prompt);
}
```

#### Failure Pattern Analysis
```javascript
// Analyze patterns across multiple test failures
async function analyzeFailurePatterns(failures) {
  const patterns = {
    timeout: failures.filter(f => f.error.includes('timeout')),
    assertion: failures.filter(f => f.error.includes('expect')),
    network: failures.filter(f => f.error.includes('ECONNREFUSED')),
    missing: failures.filter(f => f.error.includes('not found'))
  };

  const insights = `
Failure Analysis:
- ${patterns.timeout.length} timeout errors (consider longer waits)
- ${patterns.assertion.length} assertion failures (check expected values)
- ${patterns.network.length} network errors (check mock server)
- ${patterns.missing.length} element not found (check selectors)
`;

  return insights;
}
```

---

### 8. MVP Definition: Minimum Viable Execution

**Goal**: Ship the simplest useful execution feature first, then iterate.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MVP SCOPE (v1.0)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  INCLUDED (Must Have):                                           │
│  ├─> Jest/Vitest execution (WebContainer, browser-based)        │
│  ├─> Basic pass/fail results                                     │
│  ├─> Console output display                                      │
│  ├─> "Execute" button on analysis results                       │
│  └─> Simple results page (no Allure yet)                        │
│                                                                   │
│  EXCLUDED (Later):                                               │
│  ├─> Docker execution (requires infrastructure)                 │
│  ├─> Python/Java/Ruby/Go/PHP runners                            │
│  ├─> Allure reports                                              │
│  ├─> Mock server configuration                                   │
│  ├─> Database fixtures                                           │
│  ├─> Pricing/credits                                             │
│  └─> Step definition generation for BDD                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**MVP Technical Stack:**
- **WebContainers API** (StackBlitz) - Free, browser-based Node.js
- **Jest** - Most popular JS test framework
- **Simple JSON output** - Parse jest --json results
- **SSE** - Real-time progress (already have `analyze-stream`)

**MVP User Flow:**
1. User analyzes code → Gets Jest test cases
2. User clicks "Execute Tests"
3. WebContainer boots (2-3 seconds)
4. Tests run in browser sandbox
5. Results displayed (pass/fail/console)

---

### 9. Implementation Phases (Refined)

```
┌─────────────────────────────────────────────────────────────────┐
│                 IMPLEMENTATION ROADMAP                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PHASE 1: MVP (Jest in Browser) ──────────────── ~2-3 weeks    │
│  ├─> Install @webcontainer/api                                   │
│  ├─> Create lib/testExecution/webContainerRunner.js             │
│  ├─> Add "Execute" button to analyze results                    │
│  ├─> Create /execute/[id]/page.js with live progress           │
│  ├─> Parse Jest JSON results                                     │
│  └─> Display pass/fail with console output                      │
│                                                                   │
│  PHASE 2: Multi-Framework JS ─────────────────── ~1-2 weeks    │
│  ├─> Add Vitest runner (same WebContainer)                      │
│  ├─> Add Playwright runner (WebContainer + headless)           │
│  ├─> Add Cypress runner (if possible in WebContainer)          │
│  └─> Framework auto-detection                                    │
│                                                                   │
│  PHASE 3: Docker Execution ───────────────────── ~2-3 weeks    │
│  ├─> Create Docker images for each runtime                      │
│  ├─> Add lib/testExecution/dockerRunner.js                      │
│  ├─> Implement security sandbox                                  │
│  ├─> Add Python (Pytest) runner                                 │
│  ├─> Add Java (JUnit) runner                                     │
│  └─> User Docker host connection (Settings page)                │
│                                                                   │
│  PHASE 4: Advanced Reporting ─────────────────── ~2 weeks      │
│  ├─> Allure integration                                          │
│  ├─> Test history tracking                                       │
│  ├─> Failure trend analysis                                      │
│  └─> Export to Jira/TestRail                                    │
│                                                                   │
│  PHASE 5: AI-Powered Features ────────────────── ~2 weeks      │
│  ├─> Auto-fix suggestions for failures                          │
│  ├─> Step definition generation (BDD)                           │
│  ├─> Failure pattern analysis                                    │
│  └─> Test optimization suggestions                               │
│                                                                   │
│  PHASE 6: Enterprise Features ────────────────── ~3+ weeks     │
│  ├─> Credit/pricing system                                       │
│  ├─> Team execution sharing                                      │
│  ├─> CI/CD integration                                           │
│  ├─> Parallel execution                                          │
│  └─> Cloud Docker hosting option                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 10. Decision Matrix: What to Build First

| Feature | Impact | Effort | Risk | Priority |
|---------|--------|--------|------|----------|
| Jest WebContainer | HIGH | LOW | LOW | **P0** |
| Vitest WebContainer | MED | LOW | LOW | **P1** |
| Playwright WebContainer | HIGH | MED | MED | **P1** |
| Docker Jest | MED | HIGH | MED | P2 |
| Pytest Docker | MED | MED | MED | P2 |
| Allure Reports | MED | MED | LOW | P2 |
| JUnit Docker | LOW | HIGH | MED | P3 |
| BDD Step Gen | MED | HIGH | HIGH | P3 |
| Cloud Execution | HIGH | HIGH | HIGH | P4 |
| Pricing System | MED | HIGH | MED | P4 |

**Recommendation**: Start with Jest WebContainer (P0), then Vitest + Playwright (P1).

---

### 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WebContainer doesn't support all Jest features | MED | MED | Fall back to Docker, document limitations |
| Playwright too heavy for browser | HIGH | MED | Use lightweight mode, limit browser count |
| Docker security vulnerabilities | LOW | HIGH | Strict sandbox, resource limits, no network |
| AI-generated tests have syntax errors | HIGH | LOW | Validate before execution, show preview |
| High cloud execution costs | MED | MED | BYOC option, credit limits, free tier caps |
| User's Docker misconfigured | MED | LOW | Health check endpoint, clear error messages |

---

### 12. Database Schema (Complete)

```sql
-- Extend existing analyses table
ALTER TABLE analyses ADD COLUMN execution_status VARCHAR(20) DEFAULT NULL;
ALTER TABLE analyses ADD COLUMN last_execution_id INTEGER;

-- Test executions
CREATE TABLE test_executions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  analysis_id INTEGER REFERENCES analyses(id) ON DELETE CASCADE,

  -- Execution config
  framework VARCHAR(50) NOT NULL,
  strategy VARCHAR(20) NOT NULL, -- 'webcontainer', 'docker', 'cloud'
  environment JSONB DEFAULT '{}', -- env vars, mocks

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Results summary
  total_tests INTEGER,
  passed_tests INTEGER,
  failed_tests INTEGER,
  skipped_tests INTEGER,
  duration_ms INTEGER,

  -- Artifacts
  console_output TEXT,
  allure_report_url VARCHAR(500),
  raw_results JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual test results
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  execution_id INTEGER REFERENCES test_executions(id) ON DELETE CASCADE,

  -- Test identification
  test_name VARCHAR(500) NOT NULL,
  test_file VARCHAR(500),
  test_suite VARCHAR(500),

  -- Result
  status VARCHAR(20) NOT NULL, -- passed, failed, skipped, broken
  duration_ms INTEGER,

  -- Failure details
  error_message TEXT,
  error_type VARCHAR(100),
  stack_trace TEXT,

  -- AI analysis
  ai_fix_suggestion TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Execution credits (for future billing)
CREATE TABLE execution_credits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  credits_remaining INTEGER DEFAULT 100, -- Free tier: 100 minutes
  credits_used INTEGER DEFAULT 0,
  plan VARCHAR(20) DEFAULT 'free', -- free, pro, enterprise
  reset_at TIMESTAMP, -- Monthly reset
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_executions_user ON test_executions(user_id);
CREATE INDEX idx_executions_analysis ON test_executions(analysis_id);
CREATE INDEX idx_executions_status ON test_executions(status);
CREATE INDEX idx_results_execution ON test_results(execution_id);
CREATE INDEX idx_results_status ON test_results(status);
```

---

### 13. API Endpoints (Complete)

```
POST   /api/execute-tests                 # Start execution
       Body: { analysisId, framework, strategy, environment }
       Response: { executionId, status: 'pending' }

GET    /api/execute-tests/[id]/stream     # SSE for live progress
       Response: SSE events (progress, output, done, error)

GET    /api/execute-tests/[id]            # Get execution details
       Response: { execution, results[] }

POST   /api/execute-tests/[id]/cancel     # Cancel running execution
       Response: { success: true }

POST   /api/execute-tests/[id]/retry      # Retry failed tests only
       Response: { newExecutionId }

GET    /api/execution-history             # User's execution history
       Query: ?limit=20&offset=0&status=failed
       Response: { executions[], total }

POST   /api/execute-tests/validate        # Validate test code before run
       Body: { testCode, framework }
       Response: { valid: true, errors: [] }

GET    /api/user/execution-credits        # Check remaining credits
       Response: { remaining: 85, used: 15, plan: 'free' }
```

---

### 14. Files to Create (Priority Order)

```
## Phase 1 (MVP)

lib/testExecution/
├── webContainerRunner.js          # P0: Core WebContainer execution
├── jestRunner.js                  # P0: Jest-specific logic
├── resultParser.js                # P0: Parse JSON results
└── testValidator.js               # P0: Validate code before run

app/api/execute-tests/
├── route.js                       # P0: Start execution endpoint
└── [id]/
    ├── route.js                   # P0: Get execution status
    └── stream/route.js            # P0: SSE progress stream

app/execute/
├── page.js                        # P0: Execute configuration page
└── [id]/
    └── page.js                    # P0: Live execution view

app/execute/components/
├── ExecuteButton.jsx              # P0: Button for analyze results
├── LiveProgress.jsx               # P0: Real-time status
├── ConsoleOutput.jsx              # P0: Terminal-style output
└── ResultsSummary.jsx             # P0: Pass/fail counts

## Phase 2 (Multi-Framework)

lib/testExecution/
├── vitestRunner.js                # P1: Vitest execution
├── playwrightRunner.js            # P1: Playwright execution
└── frameworkDetector.js           # P1: Auto-detect framework

## Phase 3 (Docker)

lib/testExecution/
├── dockerRunner.js                # P2: Docker execution
├── runners/
│   ├── pytestRunner.js            # P2: Python tests
│   ├── junitRunner.js             # P2: Java tests
│   └── rspecRunner.js             # P3: Ruby tests
└── sandbox/
    ├── containerConfig.js         # P2: Security settings
    └── imageManager.js            # P2: Docker image mgmt

docker/
├── Dockerfile.node                # P2: Node.js runner
├── Dockerfile.python              # P2: Python runner
├── Dockerfile.java                # P3: Java runner
└── docker-compose.test.yml        # P2: Local testing
```

---

### 15. WebContainer Implementation (MVP Deep Dive)

This is the critical path for MVP. WebContainers run Node.js in the browser.

#### Installation
```bash
npm install @webcontainer/api
```

#### Core Implementation
```javascript
// lib/testExecution/webContainerRunner.js
import { WebContainer } from '@webcontainer/api';

let webcontainerInstance = null;

export async function getWebContainer() {
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainer.boot();
  }
  return webcontainerInstance;
}

export async function runJestTests(testCode, options = {}) {
  const webcontainer = await getWebContainer();

  // Create project structure
  const files = {
    'package.json': {
      file: {
        contents: JSON.stringify({
          name: 'orizon-test-runner',
          type: 'module',
          scripts: {
            test: 'jest --json --outputFile=results.json'
          },
          devDependencies: {
            jest: '^29.7.0',
            '@babel/preset-env': '^7.23.0'
          }
        }, null, 2)
      }
    },
    'jest.config.js': {
      file: {
        contents: `
export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['**/*.test.js']
};
`
      }
    },
    '__tests__': {
      directory: {
        'generated.test.js': {
          file: { contents: testCode }
        }
      }
    }
  };

  // Mount files
  await webcontainer.mount(files);

  // Install dependencies
  const installProcess = await webcontainer.spawn('npm', ['install']);

  const installExitCode = await installProcess.exit;
  if (installExitCode !== 0) {
    throw new Error('Failed to install dependencies');
  }

  // Run tests
  const testProcess = await webcontainer.spawn('npm', ['test']);

  // Collect output
  let output = '';
  testProcess.output.pipeTo(new WritableStream({
    write(chunk) {
      output += chunk;
      options.onOutput?.(chunk);
    }
  }));

  const testExitCode = await testProcess.exit;

  // Read results file
  let results = null;
  try {
    const resultsFile = await webcontainer.fs.readFile('/results.json', 'utf-8');
    results = JSON.parse(resultsFile);
  } catch (e) {
    // Results file might not exist if tests crashed
  }

  return {
    exitCode: testExitCode,
    output,
    results,
    success: testExitCode === 0
  };
}
```

#### React Hook for Execution
```javascript
// app/hooks/useTestExecution.js
'use client';

import { useState, useCallback, useRef } from 'react';
import { runJestTests } from '@/lib/testExecution/webContainerRunner';

export const ExecutionStatus = {
  IDLE: 'idle',
  BOOTING: 'booting',
  INSTALLING: 'installing',
  RUNNING: 'running',
  COMPLETE: 'complete',
  FAILED: 'failed'
};

export function useTestExecution() {
  const [status, setStatus] = useState(ExecutionStatus.IDLE);
  const [output, setOutput] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  const execute = useCallback(async (testCode, framework = 'jest') => {
    setStatus(ExecutionStatus.BOOTING);
    setOutput('');
    setResults(null);
    setError(null);
    abortRef.current = false;

    try {
      setStatus(ExecutionStatus.INSTALLING);

      const result = await runJestTests(testCode, {
        onOutput: (chunk) => {
          if (!abortRef.current) {
            setOutput(prev => prev + chunk);
            setStatus(ExecutionStatus.RUNNING);
          }
        }
      });

      if (abortRef.current) return;

      setResults(result.results);
      setStatus(result.success ? ExecutionStatus.COMPLETE : ExecutionStatus.FAILED);

    } catch (err) {
      if (!abortRef.current) {
        setError(err.message);
        setStatus(ExecutionStatus.FAILED);
      }
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
    setStatus(ExecutionStatus.IDLE);
  }, []);

  return {
    status,
    output,
    results,
    error,
    execute,
    abort,
    isRunning: [ExecutionStatus.BOOTING, ExecutionStatus.INSTALLING, ExecutionStatus.RUNNING].includes(status)
  };
}
```

#### Execute Button Component
```jsx
// app/execute/components/ExecuteButton.jsx
'use client';

import { Play, Loader2 } from 'lucide-react';
import { useTestExecution, ExecutionStatus } from '@/app/hooks/useTestExecution';

export default function ExecuteButton({ testCode, framework, onComplete }) {
  const { status, execute, isRunning } = useTestExecution();

  const handleExecute = async () => {
    const result = await execute(testCode, framework);
    onComplete?.(result);
  };

  const statusText = {
    [ExecutionStatus.BOOTING]: 'Starting environment...',
    [ExecutionStatus.INSTALLING]: 'Installing dependencies...',
    [ExecutionStatus.RUNNING]: 'Running tests...',
  };

  return (
    <button
      onClick={handleExecute}
      disabled={isRunning}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
        isRunning
          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700 text-white'
      }`}
    >
      {isRunning ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {statusText[status] || 'Running...'}
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          Execute Tests
        </>
      )}
    </button>
  );
}
```

#### WebContainer Limitations

| Feature | Supported | Notes |
|---------|-----------|-------|
| Node.js | YES | Full support |
| npm/pnpm | YES | Package installation works |
| File system | YES | Virtual FS in browser |
| Network requests | PARTIAL | Only to allowed origins |
| Child processes | PARTIAL | Limited subprocess support |
| Native modules | NO | No native binaries |
| Playwright | PARTIAL | Headless mode only, limited |
| Cypress | NO | Requires real browser |

**When to fall back to Docker:**
- Tests require native modules (canvas, sharp, etc.)
- Tests need real browser automation
- Tests require network access to external services
- Tests need more than 1GB memory

---

### 16. Architecture Decisions (Finalized)

**Decisions made on 2025-12-04:**

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Storage** | Redis + PostgreSQL | Redis for live progress & recent results (TTL: 1hr). PostgreSQL for permanent history. Best for real-time SSE updates. |
| **Test Scope** | Generated + User + GitHub | Full flexibility. AI-generated tests, user-pasted tests, AND tests fetched from GitHub repos. |
| **Code Access** | User uploads + GitHub | Tests CAN access real source code via user upload OR GitHub fetch. Most realistic test execution. |
| **Authentication** | Always required | Must be logged in to execute. Easier to track usage, prevent abuse, and link results to user history. |

---

#### Storage Architecture (Redis + PostgreSQL)

```
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  REDIS (Vercel KV) - Live & Recent                              │
│  ├─> execution:{id}:status     → "running" / "complete"         │
│  ├─> execution:{id}:progress   → { current: 3, total: 10 }      │
│  ├─> execution:{id}:output     → Streaming console output       │
│  └─> TTL: 1 hour (auto-expire)                                  │
│                                                                   │
│  POSTGRESQL (Vercel Postgres) - Permanent                       │
│  ├─> test_executions           → Execution metadata & results   │
│  ├─> test_results              → Individual test outcomes       │
│  └─> No TTL (permanent history)                                 │
│                                                                   │
│  FLOW:                                                           │
│  1. Start execution → Write to Redis (status: running)          │
│  2. Stream progress → Update Redis (SSE reads from here)        │
│  3. Complete → Copy to PostgreSQL, delete from Redis            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

```javascript
// lib/testExecution/storage.js
import { kv } from '@vercel/kv';
import { pool } from '@/lib/db';

// Live execution state (Redis)
export async function updateExecutionProgress(executionId, progress) {
  await kv.hset(`execution:${executionId}`, {
    status: progress.status,
    current: progress.current,
    total: progress.total,
    output: progress.output
  });
  await kv.expire(`execution:${executionId}`, 3600); // 1 hour TTL
}

export async function getExecutionProgress(executionId) {
  return await kv.hgetall(`execution:${executionId}`);
}

// Permanent storage (PostgreSQL)
export async function saveExecutionResult(execution) {
  const result = await pool.query(`
    INSERT INTO test_executions
    (user_id, analysis_id, framework, strategy, status,
     total_tests, passed_tests, failed_tests, duration_ms, raw_results)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `, [
    execution.userId,
    execution.analysisId,
    execution.framework,
    execution.strategy,
    execution.status,
    execution.totalTests,
    execution.passedTests,
    execution.failedTests,
    execution.durationMs,
    JSON.stringify(execution.results)
  ]);

  // Clean up Redis
  await kv.del(`execution:${execution.id}`);

  return result.rows[0].id;
}
```

---

#### Test Scope: Multiple Sources

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEST SOURCE OPTIONS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SOURCE 1: AI-Generated Tests                                   │
│  ├─> From OrizonQA analysis results                             │
│  ├─> "Execute" button on analysis page                          │
│  └─> Pre-validated, ready to run                                │
│                                                                   │
│  SOURCE 2: User-Provided Tests                                  │
│  ├─> Paste test code directly                                   │
│  ├─> Upload test files (.test.js, etc.)                        │
│  └─> Requires validation before execution                       │
│                                                                   │
│  SOURCE 3: GitHub Repository Tests                              │
│  ├─> Fetch from connected GitHub repo                           │
│  ├─> Select branch and test directory                           │
│  └─> Uses existing GitHub OAuth connection                      │
│                                                                   │
│  UI: Tab selector for test source                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Generated] [Paste/Upload] [From GitHub]                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Code Access: Real Source Code

```
┌─────────────────────────────────────────────────────────────────┐
│                 SOURCE CODE ACCESS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  OPTION A: User Upload (Simpler)                                │
│  ├─> User zips source code + tests                              │
│  ├─> Uploads to OrizonQA                                        │
│  ├─> Extracted in WebContainer/Docker                           │
│  └─> Tests can import real modules                              │
│                                                                   │
│  OPTION B: GitHub Fetch (More Integrated)                       │
│  ├─> Use existing GitHub OAuth connection                       │
│  ├─> Clone repo to execution environment                        │
│  ├─> Select branch (main, feature/*, etc.)                      │
│  └─> Full access to repo structure                              │
│                                                                   │
│  IMPLEMENTATION:                                                 │
│  ├─> MVP: User upload only (simpler)                            │
│  └─> Phase 2: Add GitHub fetch                                  │
│                                                                   │
│  SECURITY:                                                       │
│  ├─> Max upload size: 10MB (zip)                                │
│  ├─> Scan for sensitive files (.env, secrets)                   │
│  ├─> Sandbox execution (no network access)                      │
│  └─> Resource limits (512MB RAM, 60s timeout)                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

```javascript
// lib/testExecution/sourceCodeLoader.js

export async function loadSourceCode(config) {
  if (config.source === 'upload') {
    // Extract uploaded zip to temp directory
    return await extractUploadedZip(config.zipFile);
  }

  if (config.source === 'github') {
    // Fetch from GitHub using OAuth token
    return await fetchGitHubRepo({
      owner: config.owner,
      repo: config.repo,
      branch: config.branch,
      accessToken: config.accessToken
    });
  }

  // No source code - tests are standalone
  return null;
}

async function fetchGitHubRepo({ owner, repo, branch, accessToken }) {
  // Use GitHub API to get repo contents
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json'
      }
    }
  );

  const zip = await response.arrayBuffer();
  return await extractZipToTemp(zip);
}
```

---

#### Authentication: Required for All Execution

```javascript
// app/api/execute-tests/route.js
import { auth } from '@/auth';

export async function POST(request) {
  // ALWAYS require authentication
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required to execute tests' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // ... execution logic
}
```

```
┌─────────────────────────────────────────────────────────────────┐
│                 AUTH REQUIREMENTS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  REQUIRED FOR:                                                   │
│  ├─> Starting test execution                                    │
│  ├─> Viewing execution results                                  │
│  ├─> Accessing execution history                                │
│  └─> All /execute/* and /reports/* routes                      │
│                                                                   │
│  BENEFITS:                                                       │
│  ├─> Track usage per user (for credits)                        │
│  ├─> Prevent abuse (rate limiting)                              │
│  ├─> Link results to user history                               │
│  └─> Secure access to source code                               │
│                                                                   │
│  MIDDLEWARE:                                                     │
│  // middleware.js - add to protected routes                     │
│  matcher: ['/execute/:path*', '/reports/:path*']                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 17. Next Steps (Immediate Actions)

```
□ 1. Research WebContainer API limits and browser support
     └─ Verify it works in all major browsers
     └─ Test memory limits with large test files

□ 2. Create proof-of-concept
     └─ Simple page that runs Jest test in WebContainer
     └─ Measure boot time, execution time
     └─ Verify JSON output parsing works

□ 3. Design UI wireframes
     └─ Execute button placement on analyze results
     └─ Live progress view layout
     └─ Results display format

□ 4. Database migration
     └─ Create test_executions table
     └─ Create test_results table
     └─ Add indexes

□ 5. Implement MVP
     └─ Follow Phase 1 file list
     └─ Start with Jest only
     └─ Add Vitest after Jest works
```

---

## Sources

### Test Frameworks
- [Jest](https://jestjs.io/) - JavaScript testing
- [Playwright](https://playwright.dev/) - Cross-browser E2E
- [Cypress](https://www.cypress.io/) - E2E testing
- [Pytest](https://pytest.org/) - Python testing
- [Cucumber](https://cucumber.io/) - BDD framework
- [Robot Framework](https://robotframework.org/) - Generic automation
- [JUnit 5](https://junit.org/junit5/) - Java testing

### Execution & Reporting
- [Allure Report](https://allurereport.org/) - Test reporting
- [Testcontainers](https://testcontainers.com/) - Container testing
- [Docker SDK](https://docs.docker.com/engine/api/) - Container API
- [WebContainers](https://webcontainers.io/) - Browser-based Node.js (StackBlitz)
- [MSW](https://mswjs.io/) - Mock Service Worker for API mocking

### Test Management
- [Testomat.io](https://testomat.io/) - Test management
- [Allure TestOps](https://qameta.io/) - Enterprise test ops

### CI/CD Integration
- [GitHub Actions](https://github.com/features/actions) - CI/CD
- [BrowserStack Guide](https://www.browserstack.com/guide/automation-testing-languages) - Automation languages

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2025-12-04 | Initial plan with 11 frameworks, architecture |
| v2.0 | 2025-12-04 | Refinements: MVP, phases, WebContainer deep dive, open questions |
| v2.1 | 2025-12-04 | Architecture decisions, integration model, multi-runtime options |

---

## INTEGRATION ARCHITECTURE (v2.1)

### Data Model: Project-Centric

**Decision**: Everything lives under a Project. This is the most organized approach for teams.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROJECT-CENTRIC DATA MODEL                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  USER                                                                         │
│    │                                                                          │
│    └──▶ PROJECTS (1:many)                                                    │
│           │                                                                   │
│           ├── name: "E-commerce Platform"                                    │
│           ├── description: "Main shopping app"                               │
│           ├── github_repo: "company/ecommerce" (optional)                    │
│           ├── default_branch: "main"                                         │
│           ├── settings: { framework, testDir, envVars }                      │
│           │                                                                   │
│           └──▶ ANALYSES (1:many)                                             │
│                  │                                                            │
│                  ├── type: "full" | "incremental"                            │
│                  ├── files_analyzed: 45                                      │
│                  ├── user_stories: [...]                                     │
│                  ├── test_cases: [...]                                       │
│                  ├── created_at: timestamp                                   │
│                  │                                                            │
│                  └──▶ EXECUTIONS (1:many)                                    │
│                         │                                                     │
│                         ├── strategy: "webcontainer" | "docker" | "cloud"    │
│                         ├── framework: "jest"                                │
│                         ├── status: "running" | "completed" | "failed"       │
│                         ├── total_tests: 25                                  │
│                         ├── passed: 23, failed: 2                            │
│                         │                                                     │
│                         └──▶ TEST_RESULTS (1:many)                           │
│                                ├── test_name, status, duration               │
│                                └── error_message, stack_trace                │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema Update

```sql
-- Projects table (NEW)
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE, -- URL-friendly: "my-project"

  -- GitHub connection (optional)
  github_repo VARCHAR(255),      -- "owner/repo"
  github_branch VARCHAR(100) DEFAULT 'main',
  github_connected_at TIMESTAMP,

  -- Default settings
  default_framework VARCHAR(50) DEFAULT 'jest',
  default_strategy VARCHAR(20) DEFAULT 'webcontainer',
  settings JSONB DEFAULT '{}',   -- testDir, envVars, etc.

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP          -- Soft delete
);

-- Update analyses to belong to projects
ALTER TABLE analyses ADD COLUMN project_id INTEGER REFERENCES projects(id);

-- Update test_executions to belong to analyses (already has analysis_id)
-- No change needed

-- Indexes
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_analyses_project ON analyses(project_id);
```

### User Flow with Projects

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY WITH PROJECTS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. DASHBOARD (/dashboard)                                                   │
│     └─> List of projects with quick stats                                   │
│     └─> "New Project" button                                                 │
│     └─> Recent activity feed                                                │
│                                                                               │
│  2. CREATE PROJECT (/projects/new)                                          │
│     └─> Name, description                                                   │
│     └─> Optional: Connect GitHub repo                                       │
│     └─> Default framework/strategy                                          │
│                                                                               │
│  3. PROJECT VIEW (/projects/[slug])                                         │
│     └─> Project header with settings                                        │
│     └─> Tabs: [Analyses] [Executions] [Settings]                           │
│     └─> "New Analysis" button                                               │
│                                                                               │
│  4. NEW ANALYSIS (/projects/[slug]/analyze)                                 │
│     └─> Same as current /analyze but scoped to project                      │
│     └─> Pre-filled with project's GitHub repo if connected                  │
│                                                                               │
│  5. ANALYSIS RESULTS (/projects/[slug]/analyses/[id])                       │
│     └─> Generated tests, user stories                                       │
│     └─> "Execute Tests" button                                              │
│                                                                               │
│  6. EXECUTE TESTS (/projects/[slug]/execute/[analysisId])                   │
│     └─> Select tests to run                                                 │
│     └─> Choose execution strategy                                           │
│     └─> Configure environment                                               │
│                                                                               │
│  7. EXECUTION RESULTS (/projects/[slug]/executions/[id])                    │
│     └─> Live progress, then final results                                   │
│     └─> Re-run, export options                                              │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CONTAINERIZATION OPTIONS (Multi-Runtime)

**Decision**: User chooses execution strategy per execution. Maximum flexibility.

### Available Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXECUTION STRATEGY OPTIONS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STRATEGY 1: WEBCONTAINER (Browser-Based)                               ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  Provider: StackBlitz WebContainers API                                 ││
│  │  Cost: FREE (unlimited)                                                 ││
│  │  Languages: JavaScript/TypeScript only                                  ││
│  │  Frameworks: Jest, Vitest, Mocha, Playwright (limited)                  ││
│  │  Pros: Instant start, no server cost, runs in user's browser           ││
│  │  Cons: No Python/Java/Ruby, limited resources, no real browser E2E     ││
│  │  Best for: Quick JS unit tests, prototyping                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STRATEGY 2: LOCAL DOCKER (User's Machine)                              ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  Provider: User's Docker daemon                                         ││
│  │  Cost: FREE (user's compute)                                            ││
│  │  Languages: ALL (JS, Python, Java, Ruby, Go, PHP, C#)                   ││
│  │  Frameworks: ALL supported frameworks                                    ││
│  │  Pros: Full power, all languages, user controls resources              ││
│  │  Cons: User must have Docker, network latency, setup required          ││
│  │  Best for: Power users, all frameworks, E2E with real browsers         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STRATEGY 3: CLOUD DOCKER (Managed)                                     ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  Provider: Fly.io / Railway / AWS Fargate                               ││
│  │  Cost: CREDITS (metered usage)                                          ││
│  │  Languages: ALL                                                          ││
│  │  Frameworks: ALL                                                         ││
│  │  Pros: No setup, scales, works everywhere                               ││
│  │  Cons: Costs money, cold starts, limited free tier                      ││
│  │  Best for: Teams, CI/CD, users without Docker                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STRATEGY 4: REMOTE DOCKER (Self-Hosted)                                ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  Provider: User's server (VPS, on-prem, etc.)                           ││
│  │  Cost: FREE (user's infrastructure)                                     ││
│  │  Languages: ALL                                                          ││
│  │  Frameworks: ALL                                                         ││
│  │  Pros: Full control, no per-execution cost, persistent                  ││
│  │  Cons: Setup required, user maintains server                            ││
│  │  Best for: Enterprise, air-gapped environments, high volume             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Strategy Comparison Matrix

| Feature | WebContainer | Local Docker | Cloud Docker | Remote Docker |
|---------|--------------|--------------|--------------|---------------|
| **Cost** | Free | Free | Credits | Free |
| **Setup** | None | Docker install | None | Server + Docker |
| **Languages** | JS only | All | All | All |
| **E2E Tests** | Limited | Full | Full | Full |
| **Speed** | Fast | Medium | Medium | Medium |
| **Offline** | No | Yes | No | Depends |
| **Resources** | Browser RAM | User's HW | 512MB-2GB | User's HW |

### Framework → Strategy Compatibility

| Framework | WebContainer | Docker |
|-----------|--------------|--------|
| Jest | ✅ Full | ✅ Full |
| Vitest | ✅ Full | ✅ Full |
| Mocha | ✅ Full | ✅ Full |
| Playwright | ⚠️ Limited | ✅ Full |
| Cypress | ❌ No | ✅ Full |
| Pytest | ❌ No | ✅ Full |
| JUnit | ❌ No | ✅ Full |
| RSpec | ❌ No | ✅ Full |
| Go Test | ❌ No | ✅ Full |
| PHPUnit | ❌ No | ✅ Full |
| Cucumber | ⚠️ JS only | ✅ Full |
| Robot | ❌ No | ✅ Full |

### UI: Strategy Selector

```jsx
// app/execute/components/StrategySelector.jsx

export default function StrategySelector({ framework, value, onChange }) {
  const strategies = [
    {
      id: 'webcontainer',
      name: 'Browser (WebContainer)',
      icon: '🌐',
      description: 'Runs in your browser. Free & instant.',
      available: ['jest', 'vitest', 'mocha'].includes(framework),
      cost: 'Free',
      speed: 'Fast'
    },
    {
      id: 'local-docker',
      name: 'Local Docker',
      icon: '🐳',
      description: 'Runs on your machine. Requires Docker.',
      available: true,
      cost: 'Free',
      speed: 'Medium',
      requiresSetup: true
    },
    {
      id: 'cloud-docker',
      name: 'Cloud (Fly.io)',
      icon: '☁️',
      description: 'Runs on our servers. Uses credits.',
      available: true,
      cost: 'Credits',
      speed: 'Medium'
    },
    {
      id: 'remote-docker',
      name: 'Remote Docker',
      icon: '🖥️',
      description: 'Runs on your server. Configure in settings.',
      available: userHasRemoteDocker,
      cost: 'Free',
      speed: 'Medium'
    }
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-400">Execution Strategy</label>
      <div className="grid grid-cols-2 gap-3">
        {strategies.map(strategy => (
          <button
            key={strategy.id}
            onClick={() => onChange(strategy.id)}
            disabled={!strategy.available}
            className={`p-4 rounded-lg border text-left ${
              value === strategy.id
                ? 'border-blue-500 bg-blue-500/10'
                : strategy.available
                  ? 'border-slate-600 hover:border-slate-500'
                  : 'border-slate-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{strategy.icon}</span>
              <div>
                <div className="font-medium text-white">{strategy.name}</div>
                <div className="text-xs text-slate-500">{strategy.description}</div>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700">
                {strategy.cost}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700">
                {strategy.speed}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Cloud Docker Providers (Comparison)

| Provider | Pricing | Cold Start | Max Duration | Best For |
|----------|---------|------------|--------------|----------|
| **Fly.io** | $0.0000022/sec (~$0.008/min) | ~2s | Unlimited | General use, good free tier |
| **Railway** | $0.000463/min | ~3s | Unlimited | Easy setup, good DX |
| **AWS Fargate** | ~$0.04/vCPU-hour | 30-60s | Unlimited | Enterprise, high scale |
| **Google Cloud Run** | $0.00002400/vCPU-sec | 0-1s | 60min | Lowest cold start |
| **Render** | $0.008/min (starter) | ~5s | Unlimited | Simple, predictable |

**Recommendation**: Start with **Fly.io** - good free tier, fast cold starts, simple CLI.

### Local Docker Setup Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOCAL DOCKER SETUP                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  STEP 1: User clicks "Use Local Docker"                                     │
│          └─> Show setup instructions                                         │
│                                                                               │
│  STEP 2: User installs Docker Desktop (if not installed)                    │
│          └─> Link to Docker Desktop download                                 │
│                                                                               │
│  STEP 3: User runs OrizonQA Docker Agent                                    │
│          $ docker run -d -p 9876:9876 orizonqa/agent:latest                  │
│          └─> Agent exposes API for OrizonQA to connect                      │
│                                                                               │
│  STEP 4: OrizonQA connects to localhost:9876                                │
│          └─> Health check confirms connection                                │
│          └─> Save connection in user settings                               │
│                                                                               │
│  STEP 5: Ready to execute tests!                                            │
│          └─> OrizonQA sends test code to agent                              │
│          └─> Agent runs in isolated container                               │
│          └─> Results streamed back via SSE                                  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

```javascript
// Docker Agent API (runs on user's machine)
// docker/agent/server.js

const express = require('express');
const Docker = require('dockerode');

const app = express();
const docker = new Docker();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Execute tests
app.post('/execute', async (req, res) => {
  const { framework, testCode, sourceCode, environment } = req.body;

  // Create container with appropriate image
  const container = await docker.createContainer({
    Image: `orizonqa/runner-${framework}`,
    Cmd: getRunCommand(framework),
    Env: Object.entries(environment).map(([k, v]) => `${k}=${v}`),
    HostConfig: {
      Memory: 512 * 1024 * 1024,
      CpuPeriod: 100000,
      CpuQuota: 50000,
      NetworkMode: 'none' // Security: no network
    }
  });

  // Stream results back
  res.setHeader('Content-Type', 'text/event-stream');
  // ... stream execution output
});

app.listen(9876);
```

### Remote Docker Setup (Enterprise)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REMOTE DOCKER SETUP (Enterprise)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  USER'S SERVER                        ORIZONQA                               │
│  ┌────────────────┐                   ┌────────────────┐                     │
│  │ Docker Host    │◄─────HTTPS────────│ orizon-qa.com  │                     │
│  │ + Agent        │                   │                │                     │
│  │ (port 9876)    │                   │ User Settings: │                     │
│  └────────────────┘                   │ dockerHost:    │                     │
│         │                             │ "myserver.com" │                     │
│         ▼                             │ dockerToken:   │                     │
│  ┌────────────────┐                   │ "xxxxx"        │                     │
│  │ Test Container │                   └────────────────┘                     │
│  │ (isolated)     │                                                          │
│  └────────────────┘                                                          │
│                                                                               │
│  SECURITY:                                                                   │
│  ├─> TLS encryption required                                                │
│  ├─> Bearer token authentication                                            │
│  ├─> IP allowlist optional                                                  │
│  └─> Containers have no network access                                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Settings Page: Docker Configuration

```jsx
// app/settings/components/DockerSettings.jsx

export default function DockerSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-white">Docker Configuration</h3>

      {/* Local Docker */}
      <div className="p-4 bg-slate-800 rounded-lg">
        <h4 className="font-medium text-white">Local Docker</h4>
        <p className="text-sm text-slate-400 mt-1">
          Run tests on your machine using Docker Desktop.
        </p>
        <div className="mt-3">
          <button className="px-4 py-2 bg-blue-600 rounded-lg text-white">
            Test Connection (localhost:9876)
          </button>
        </div>
      </div>

      {/* Remote Docker */}
      <div className="p-4 bg-slate-800 rounded-lg">
        <h4 className="font-medium text-white">Remote Docker</h4>
        <p className="text-sm text-slate-400 mt-1">
          Connect to a Docker host on your server.
        </p>
        <div className="mt-3 space-y-3">
          <input
            type="text"
            placeholder="https://your-server.com:9876"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg"
          />
          <input
            type="password"
            placeholder="Authentication token"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg"
          />
          <button className="px-4 py-2 bg-blue-600 rounded-lg text-white">
            Connect & Verify
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## SCOPE-FLEXIBLE EXPERIENCE (v2.2)

### The Problem with "Project"

"Project" implies a fixed, heavyweight container. But users want to test:

| What They're Testing | Traditional Name | Better Name |
|---------------------|------------------|-------------|
| Full repository | Project | **Scope: Repository** |
| A folder/module | Module | **Scope: Module** |
| A single file | File | **Scope: File** |
| A function/class | Unit | **Scope: Unit** |
| Related files (feature) | Feature | **Scope: Feature** |
| An AI agent | Agent | **Scope: Agent** |
| A component | Component | **Scope: Component** |
| An API endpoint | Endpoint | **Scope: Endpoint** |

### Core Concept: **Test Target**

Instead of "Project", use **Test Target** - the subject under test.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TEST TARGET (Flexible Scope)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  TEST TARGET = What you're testing                                           │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │   SCOPE LEVELS (small → large)                                          │ │
│  │                                                                          │ │
│  │   ● Unit        → Single function, class, or component                  │ │
│  │   ● File        → One source file                                       │ │
│  │   ● Module      → A folder with related files                           │ │
│  │   ● Feature     → User-defined set of files (cross-cutting)             │ │
│  │   ● Agent       → AI agent code (prompts, tools, handlers)              │ │
│  │   ● Service     → Microservice or API                                   │ │
│  │   ● Repository  → Entire codebase                                       │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  KEY INSIGHT: Same flow works for all scopes                                │
│               Select → Analyze → Generate → Execute → Report                │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Unified Flow

**One flow, any scope.** The experience adapts based on selection:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      UNIFIED QA FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  STEP 1: SELECT TARGET                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  How do you want to provide code?                                       ││
│  │                                                                          ││
│  │  [📁 Paste Code]  [🔗 GitHub]  [📤 Upload]  [📋 From History]          ││
│  │                                                                          ││
│  │  After selection, you can narrow scope:                                 ││
│  │  ┌────────────────────────────────────────────────────────────────────┐ ││
│  │  │ Selected: github.com/user/repo                                     │ ││
│  │  │ Scope: ○ Full repo  ● Selected files  ○ Single folder             │ ││
│  │  │                                                                     │ ││
│  │  │ ☑ src/auth/                                                        │ ││
│  │  │ ☑ src/auth/login.js                                                │ ││
│  │  │ ☑ src/auth/register.js                                             │ ││
│  │  │ ☐ src/utils/                                                       │ ││
│  │  └────────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  STEP 2: CONFIGURE ANALYSIS                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  What to generate:                                                      ││
│  │  ☑ User Stories  ☑ Test Cases  ☑ Acceptance Criteria                  ││
│  │  ☐ Edge Cases    ☐ Security Tests                                      ││
│  │                                                                          ││
│  │  Test framework: [Jest ▼]     Output: [Markdown ▼]                     ││
│  │                                                                          ││
│  │  Target label (optional): [Authentication Module_________]             ││
│  │  └─> Helps organize in history                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  STEP 3: AI ANALYSIS                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  🔄 Analyzing 3 files (12 KB)...                                        ││
│  │                                                                          ││
│  │  ✓ login.js → 2 user stories, 5 test cases                             ││
│  │  ✓ register.js → 3 user stories, 8 test cases                          ││
│  │  ✓ middleware.js → 1 user story, 3 test cases                          ││
│  │                                                                          ││
│  │  Total: 6 user stories, 16 test cases                                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  STEP 4: REVIEW & EXECUTE                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  [User Stories]  [Test Cases]  [Acceptance Criteria]                   ││
│  │                                                                          ││
│  │  ☑ TC-001: Login with valid credentials                                ││
│  │  ☑ TC-002: Login with invalid password                                 ││
│  │  ☑ TC-003: Login rate limiting                                         ││
│  │  ☐ TC-004: Remember me functionality (skip)                            ││
│  │                                                                          ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  Execute with: [🌐 WebContainer ▼]                                      ││
│  │                                                                          ││
│  │  [▶ Execute Selected Tests]    [📥 Export]    [💾 Save]                ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  STEP 5: EXECUTION & RESULTS                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Running 3 tests in WebContainer...                                     ││
│  │                                                                          ││
│  │  ✓ TC-001: Login with valid credentials (120ms)                        ││
│  │  ✗ TC-002: Login with invalid password - Assertion failed              ││
│  │  ✓ TC-003: Login rate limiting (340ms)                                 ││
│  │                                                                          ││
│  │  ──────────────────────────────────────────────────────────────────     ││
│  │  Results: 2 passed, 1 failed | Duration: 1.2s                           ││
│  │                                                                          ││
│  │  [🔄 Re-run Failed]  [🤖 AI Fix Suggestion]  [📊 Full Report]          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scope Auto-Detection

System automatically detects scope from input:

```javascript
// lib/scopeDetector.js

export function detectScope(input) {
  // Single function/snippet
  if (input.files.length === 1 && input.files[0].lines < 100) {
    return {
      type: 'unit',
      label: extractFunctionName(input.files[0]),
      icon: '⚡',
      description: 'Single unit'
    };
  }

  // Single file
  if (input.files.length === 1) {
    return {
      type: 'file',
      label: input.files[0].name,
      icon: '📄',
      description: 'Single file'
    };
  }

  // Files from same folder
  if (allSameFolder(input.files)) {
    return {
      type: 'module',
      label: getFolderName(input.files[0].path),
      icon: '📁',
      description: 'Module/folder'
    };
  }

  // Files with common pattern (e.g., all *Agent.js)
  const pattern = detectPattern(input.files);
  if (pattern) {
    return {
      type: 'feature',
      label: pattern.name,
      icon: '🔗',
      description: `${input.files.length} related files`
    };
  }

  // AI agent files detected
  if (hasAgentSignatures(input.files)) {
    return {
      type: 'agent',
      label: 'AI Agent',
      icon: '🤖',
      description: 'Agent code (prompts, tools)'
    };
  }

  // API routes detected
  if (hasApiRoutes(input.files)) {
    return {
      type: 'service',
      label: 'API Service',
      icon: '🔌',
      description: 'API endpoints'
    };
  }

  // Full repo
  return {
    type: 'repository',
    label: input.repoName || 'Repository',
    icon: '📦',
    description: `${input.files.length} files`
  };
}
```

### Database: Flexible Schema

Replace rigid "Project" with flexible "Target":

```sql
-- Remove old project concept, use flexible targets
-- targets table replaces projects

CREATE TABLE targets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Flexible identification
  name VARCHAR(200),           -- User-provided or auto-generated
  scope_type VARCHAR(20),      -- unit, file, module, feature, agent, service, repository

  -- Source reference (any of these can be set)
  github_repo VARCHAR(255),    -- "owner/repo" if from GitHub
  github_branch VARCHAR(100),
  file_paths TEXT[],           -- Array of file paths
  code_hash VARCHAR(64),       -- Hash for deduplication

  -- Context
  description TEXT,
  tags TEXT[],                 -- ["auth", "login", "security"]

  -- Settings (inherited for future analyses)
  default_framework VARCHAR(50),
  default_strategy VARCHAR(20),
  settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_analyzed_at TIMESTAMP
);

-- Analyses belong to targets (optional - can be standalone)
ALTER TABLE analyses ADD COLUMN target_id INTEGER REFERENCES targets(id);

-- Quick lookup indexes
CREATE INDEX idx_targets_user ON targets(user_id);
CREATE INDEX idx_targets_scope ON targets(scope_type);
CREATE INDEX idx_targets_hash ON targets(code_hash);
CREATE INDEX idx_targets_tags ON targets USING GIN(tags);
```

### UI: History View (Grouped by Scope)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ History                                               [Search...] [Filter ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ TODAY                                                                        │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🤖 Agent: OrderProcessor                                    2 hours ago │ │
│ │    3 files • 4 user stories • 12 test cases                             │ │
│ │    Last run: ✓ 11 passed, ✗ 1 failed                                   │ │
│ │    [View] [Re-analyze] [Execute]                                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📁 Module: src/auth/                                        5 hours ago │ │
│ │    github.com/company/app • main branch                                 │ │
│ │    8 files • 6 user stories • 18 test cases                             │ │
│ │    Last run: ✓ 18 passed                                               │ │
│ │    [View] [Re-analyze] [Execute]                                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ YESTERDAY                                                                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚡ Unit: validateEmail()                                    Yesterday    │ │
│ │    Pasted code snippet                                                  │ │
│ │    1 user story • 5 test cases                                          │ │
│ │    [View] [Re-analyze] [Execute]                                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📦 Repository: ecommerce-api                                Yesterday    │ │
│ │    github.com/company/ecommerce-api • develop branch                    │ │
│ │    45 files • 24 user stories • 87 test cases                           │ │
│ │    [View] [Re-analyze] [Execute]                                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ FILTER BY SCOPE:  [All] [🤖 Agents] [📁 Modules] [📦 Repos] [⚡ Units]      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Smart Suggestions

System suggests related targets:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ You're analyzing: src/auth/login.js                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ 💡 Suggestions:                                                              │
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Include related files?                                                   │ │
│ │ • src/auth/register.js (same module)                                    │ │
│ │ • src/middleware/auth.js (imports login)                                │ │
│ │ • tests/auth.test.js (existing tests)                                   │ │
│ │                                                                          │ │
│ │ [Add All Related] [Select Individually] [No, just this file]            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Previously analyzed:                                                     │ │
│ │ • src/auth/ module (2 days ago) - 18 test cases                         │ │
│ │                                                                          │ │
│ │ [Use Previous Analysis] [Start Fresh]                                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent-Specific Flow

For AI agents, customize the flow:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🤖 Agent Detected: OrderProcessor                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ Files identified:                                                            │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ • agents/orderProcessor.js          (main agent logic)                  │ │
│ │ • prompts/orderProcessing.md        (system prompt)                     │ │
│ │ • tools/inventory.js                (tool: check inventory)            │ │
│ │ • tools/payment.js                  (tool: process payment)            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ Agent-specific tests to generate:                                            │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ☑ Prompt effectiveness tests                                            │ │
│ │ ☑ Tool invocation tests                                                 │ │
│ │ ☑ Error handling scenarios                                              │ │
│ │ ☑ Edge case inputs                                                      │ │
│ │ ☐ Adversarial prompt tests (security)                                   │ │
│ │ ☐ Hallucination detection tests                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ Evaluation integration:                                                      │
│ ☐ Connect to Arize Phoenix for LLM evaluation                              │
│ ☐ Connect to Galileo for quality scoring                                   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### URL Structure (Scope-Aware)

```
# Dashboard
/dashboard                          # All recent activity

# New analysis (scope auto-detected)
/analyze                            # Start new analysis

# History with filters
/history                            # All history
/history?scope=agent                # Only agents
/history?scope=repository           # Only full repos
/history?tags=auth,security         # By tags

# Target detail (flexible)
/targets/[id]                       # Target overview
/targets/[id]/analyses              # All analyses for this target
/targets/[id]/analyses/[analysisId] # Specific analysis
/targets/[id]/executions            # All executions
/targets/[id]/executions/[execId]   # Specific execution

# Quick actions
/execute?target=[id]                # Execute with target context
/execute?analysis=[id]              # Execute specific analysis
```

### Summary: Scope-Flexible Architecture

| Old (Rigid) | New (Flexible) |
|-------------|----------------|
| Project | Target (with scope type) |
| Project → Analyses | Target → Analyses (optional) |
| Fixed hierarchy | Flat + relationships |
| Create project first | Just start analyzing |
| Project settings | Target defaults (inherited) |
| Project view | History + filters |
