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

### 16. Open Questions to Resolve

Before implementation, clarify:

1. **Storage**: Where to store execution results?
   - Option A: PostgreSQL only (current)
   - Option B: PostgreSQL + S3 for large outputs
   - Option C: Redis for short-term, PostgreSQL for permanent

2. **Scope of "Execute"**: What exactly runs?
   - Option A: Only AI-generated tests from current analysis
   - Option B: User can paste their own tests too
   - Option C: Both (generated + user-provided)

3. **Real code under test**: Do tests have access to user's actual code?
   - Option A: No - tests are standalone (mocked)
   - Option B: Yes - user provides code bundle
   - Option C: Yes - fetch from GitHub (complex)

4. **Pricing trigger**: When do credits get consumed?
   - Option A: Per execution minute
   - Option B: Per test case
   - Option C: Per analysis+execution bundle

5. **Authentication**: Required for execution?
   - Option A: Yes - always (execution tied to user)
   - Option B: Optional - anonymous gets limited free tier
   - Option C: Yes, but guests can try 1 free execution

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
