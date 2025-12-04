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

### Test Management
- [Testomat.io](https://testomat.io/) - Test management
- [Allure TestOps](https://qameta.io/) - Enterprise test ops

### CI/CD Integration
- [GitHub Actions](https://github.com/features/actions) - CI/CD
- [BrowserStack Guide](https://www.browserstack.com/guide/automation-testing-languages) - Automation languages
