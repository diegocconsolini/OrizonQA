# OrizonQA Test Execution - Implementation Plan

## Overview

This document provides the step-by-step implementation plan for transforming OrizonQA from a test generation tool into a full-cycle QA platform.

**Source Document**: `docs/FULL-CYCLE-TEST-EXECUTION-PLAN.md` (~2870 lines)

---

## Part 1: Foundation Infrastructure

### 1.1 Database Schema Extensions

**File**: `lib/db.js`

Add to `initDB()` function:

```sql
-- ============================================
-- TARGETS TABLE (Flexible Scope)
-- ============================================
-- Replaces rigid "Project" concept
-- Supports: unit, file, module, feature, agent, service, repository

CREATE TABLE IF NOT EXISTS targets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Flexible identification
  name VARCHAR(200),
  scope_type VARCHAR(20),      -- unit, file, module, feature, agent, service, repository

  -- Source reference
  github_repo VARCHAR(255),    -- "owner/repo" if from GitHub
  github_branch VARCHAR(100),
  file_paths TEXT[],           -- Array of file paths
  code_hash VARCHAR(64),       -- Hash for deduplication

  -- Context
  description TEXT,
  tags TEXT[],                 -- ["auth", "login", "security"]

  -- Default settings
  default_framework VARCHAR(50),
  default_strategy VARCHAR(20),
  settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_analyzed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_targets_user ON targets(user_id);
CREATE INDEX IF NOT EXISTS idx_targets_scope ON targets(scope_type);
CREATE INDEX IF NOT EXISTS idx_targets_hash ON targets(code_hash);
CREATE INDEX IF NOT EXISTS idx_targets_tags ON targets USING GIN(tags);

-- ============================================
-- TEST EXECUTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS test_executions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  analysis_id INTEGER REFERENCES analyses(id) ON DELETE CASCADE,
  target_id INTEGER REFERENCES targets(id) ON DELETE SET NULL,

  -- Execution config
  framework VARCHAR(50) NOT NULL,        -- jest, vitest, pytest, etc.
  strategy VARCHAR(20) NOT NULL,         -- webcontainer, docker, cloud, remote
  environment JSONB DEFAULT '{}',        -- env vars, mocks
  test_code TEXT,                        -- The actual test code executed

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending',  -- pending, booting, installing, running, completed, failed, cancelled
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

CREATE INDEX IF NOT EXISTS idx_executions_user ON test_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_analysis ON test_executions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON test_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_framework ON test_executions(framework);

-- ============================================
-- TEST RESULTS TABLE (Individual Tests)
-- ============================================

CREATE TABLE IF NOT EXISTS test_results (
  id SERIAL PRIMARY KEY,
  execution_id INTEGER REFERENCES test_executions(id) ON DELETE CASCADE,

  -- Test identification
  test_name VARCHAR(500) NOT NULL,
  test_file VARCHAR(500),
  test_suite VARCHAR(500),

  -- Result
  status VARCHAR(20) NOT NULL,           -- passed, failed, skipped, broken
  duration_ms INTEGER,

  -- Failure details
  error_message TEXT,
  error_type VARCHAR(100),
  stack_trace TEXT,

  -- AI analysis (optional - for AI fix suggestions)
  ai_fix_suggestion TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_execution ON test_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_results_status ON test_results(status);

-- ============================================
-- EXECUTION CREDITS TABLE (Future Billing)
-- ============================================

CREATE TABLE IF NOT EXISTS execution_credits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  credits_remaining INTEGER DEFAULT 100,  -- Free tier: 100 execution minutes
  credits_used INTEGER DEFAULT 0,
  plan VARCHAR(20) DEFAULT 'free',        -- free, pro, enterprise
  reset_at TIMESTAMP,                     -- Monthly reset
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credits_user ON execution_credits(user_id);

-- ============================================
-- LINK ANALYSES TO TARGETS (Optional)
-- ============================================

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS target_id INTEGER REFERENCES targets(id);
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS execution_status VARCHAR(20);
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS last_execution_id INTEGER;
```

**New DB Functions to Add**:

```javascript
// Save test execution
export async function saveTestExecution(data) {
  const result = await query(`
    INSERT INTO test_executions (
      user_id, analysis_id, target_id, framework, strategy,
      environment, test_code, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, created_at
  `, [
    data.userId, data.analysisId, data.targetId,
    data.framework, data.strategy,
    JSON.stringify(data.environment || {}),
    data.testCode, 'pending'
  ]);
  return result.rows[0];
}

// Update execution status
export async function updateExecutionStatus(id, updates) {
  const setClauses = [];
  const values = [id];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = $${paramIndex}`);
    values.push(key.includes('results') || key === 'environment'
      ? JSON.stringify(value)
      : value);
    paramIndex++;
  }

  setClauses.push(`updated_at = NOW()`);

  await query(`
    UPDATE test_executions
    SET ${setClauses.join(', ')}
    WHERE id = $1
  `, values);
}

// Save individual test result
export async function saveTestResult(executionId, result) {
  await query(`
    INSERT INTO test_results (
      execution_id, test_name, test_file, test_suite,
      status, duration_ms, error_message, error_type, stack_trace
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    executionId, result.testName, result.testFile, result.testSuite,
    result.status, result.durationMs,
    result.errorMessage, result.errorType, result.stackTrace
  ]);
}

// Get execution by ID
export async function getExecutionById(id) {
  const result = await query(`
    SELECT e.*,
           array_agg(json_build_object(
             'id', r.id,
             'test_name', r.test_name,
             'status', r.status,
             'duration_ms', r.duration_ms,
             'error_message', r.error_message
           )) as results
    FROM test_executions e
    LEFT JOIN test_results r ON r.execution_id = e.id
    WHERE e.id = $1
    GROUP BY e.id
  `, [id]);
  return result.rows[0];
}

// Get executions for user
export async function getExecutionsByUser(userId, limit = 20, offset = 0) {
  const result = await query(`
    SELECT e.*, a.github_url, a.github_branch
    FROM test_executions e
    LEFT JOIN analyses a ON e.analysis_id = a.id
    WHERE e.user_id = $1
    ORDER BY e.created_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);
  return result.rows;
}
```

---

### 1.2 Package Installation

**File**: `package.json`

```bash
# WebContainer for browser-based execution
npm install @webcontainer/api

# Optional: Docker SDK for server-side execution
npm install dockerode

# Optional: Test result parsing
npm install allure-js-commons
```

---

## Part 2: Test Execution Engine

### 2.1 WebContainer Runner (Core)

**File**: `lib/testExecution/webContainerRunner.js`

```javascript
/**
 * WebContainer Test Runner
 *
 * Executes JavaScript tests (Jest, Vitest, Mocha) in browser
 * using StackBlitz WebContainers API.
 *
 * Features:
 * - Zero server cost (runs in browser)
 * - Instant startup
 * - Real-time output streaming
 * - JSON result parsing
 */

import { WebContainer } from '@webcontainer/api';

let webcontainerInstance = null;
let bootPromise = null;

/**
 * Get or boot WebContainer instance (singleton)
 */
export async function getWebContainer() {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  if (bootPromise) {
    return bootPromise;
  }

  bootPromise = WebContainer.boot();
  webcontainerInstance = await bootPromise;
  bootPromise = null;

  return webcontainerInstance;
}

/**
 * Run Jest tests in WebContainer
 *
 * @param {string} testCode - The Jest test code to run
 * @param {object} options - Execution options
 * @param {function} options.onOutput - Callback for output chunks
 * @param {function} options.onStatus - Callback for status updates
 * @param {object} options.dependencies - Additional npm dependencies
 * @param {object} options.files - Additional files to mount
 * @returns {Promise<{exitCode: number, output: string, results: object}>}
 */
export async function runJestTests(testCode, options = {}) {
  const {
    onOutput = () => {},
    onStatus = () => {},
    dependencies = {},
    files = {},
    timeout = 60000
  } = options;

  onStatus('booting');
  const webcontainer = await getWebContainer();

  // Project structure
  const projectFiles = {
    'package.json': {
      file: {
        contents: JSON.stringify({
          name: 'orizon-test-runner',
          type: 'module',
          scripts: {
            test: 'jest --json --outputFile=results.json --forceExit'
          },
          devDependencies: {
            jest: '^29.7.0',
            '@babel/preset-env': '^7.23.0',
            ...dependencies
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
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true,
  testTimeout: 30000
};
`
      }
    },
    'babel.config.js': {
      file: {
        contents: `
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
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
    },
    // Additional files (e.g., source code to test against)
    ...files
  };

  // Mount files
  onStatus('mounting');
  await webcontainer.mount(projectFiles);

  // Install dependencies
  onStatus('installing');
  const installProcess = await webcontainer.spawn('npm', ['install']);

  let installOutput = '';
  installProcess.output.pipeTo(new WritableStream({
    write(chunk) {
      installOutput += chunk;
      onOutput(chunk);
    }
  }));

  const installExitCode = await installProcess.exit;
  if (installExitCode !== 0) {
    return {
      exitCode: installExitCode,
      output: installOutput,
      results: null,
      error: 'Failed to install dependencies',
      phase: 'install'
    };
  }

  // Run tests
  onStatus('running');
  const testProcess = await webcontainer.spawn('npm', ['test']);

  let testOutput = '';
  testProcess.output.pipeTo(new WritableStream({
    write(chunk) {
      testOutput += chunk;
      onOutput(chunk);
    }
  }));

  // Set timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Test execution timeout')), timeout);
  });

  let testExitCode;
  try {
    testExitCode = await Promise.race([testProcess.exit, timeoutPromise]);
  } catch (err) {
    testProcess.kill();
    return {
      exitCode: 1,
      output: testOutput,
      results: null,
      error: err.message,
      phase: 'run'
    };
  }

  // Read results file
  let results = null;
  try {
    const resultsFile = await webcontainer.fs.readFile('results.json', 'utf-8');
    results = JSON.parse(resultsFile);
  } catch (e) {
    // Results file might not exist if tests crashed
    console.warn('Could not read results.json:', e.message);
  }

  onStatus('complete');

  return {
    exitCode: testExitCode,
    output: testOutput,
    results,
    success: testExitCode === 0,
    phase: 'complete'
  };
}

/**
 * Run Vitest tests in WebContainer
 */
export async function runVitestTests(testCode, options = {}) {
  const {
    onOutput = () => {},
    onStatus = () => {},
    dependencies = {},
    timeout = 60000
  } = options;

  onStatus('booting');
  const webcontainer = await getWebContainer();

  const projectFiles = {
    'package.json': {
      file: {
        contents: JSON.stringify({
          name: 'orizon-test-runner',
          type: 'module',
          scripts: {
            test: 'vitest run --reporter=json --outputFile=results.json'
          },
          devDependencies: {
            vitest: '^1.0.0',
            ...dependencies
          }
        }, null, 2)
      }
    },
    'vitest.config.js': {
      file: {
        contents: `
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.js']
  }
});
`
      }
    },
    'tests': {
      directory: {
        'generated.test.js': {
          file: { contents: testCode }
        }
      }
    }
  };

  onStatus('mounting');
  await webcontainer.mount(projectFiles);

  onStatus('installing');
  const installProcess = await webcontainer.spawn('npm', ['install']);

  let output = '';
  installProcess.output.pipeTo(new WritableStream({
    write(chunk) {
      output += chunk;
      onOutput(chunk);
    }
  }));

  const installExitCode = await installProcess.exit;
  if (installExitCode !== 0) {
    return { exitCode: installExitCode, output, results: null, error: 'Install failed' };
  }

  onStatus('running');
  const testProcess = await webcontainer.spawn('npm', ['test']);

  testProcess.output.pipeTo(new WritableStream({
    write(chunk) {
      output += chunk;
      onOutput(chunk);
    }
  }));

  const testExitCode = await testProcess.exit;

  let results = null;
  try {
    const resultsFile = await webcontainer.fs.readFile('results.json', 'utf-8');
    results = JSON.parse(resultsFile);
  } catch (e) {}

  onStatus('complete');
  return { exitCode: testExitCode, output, results, success: testExitCode === 0 };
}

/**
 * Cleanup WebContainer (call when done)
 */
export async function teardownWebContainer() {
  if (webcontainerInstance) {
    await webcontainerInstance.teardown();
    webcontainerInstance = null;
  }
}
```

### 2.2 Result Parser

**File**: `lib/testExecution/resultParser.js`

```javascript
/**
 * Parse test results from various frameworks into unified format
 */

/**
 * Parse Jest JSON output
 */
export function parseJestResults(jestJson) {
  if (!jestJson) return null;

  const results = {
    summary: {
      total: jestJson.numTotalTests || 0,
      passed: jestJson.numPassedTests || 0,
      failed: jestJson.numFailedTests || 0,
      skipped: jestJson.numPendingTests || 0,
      duration: jestJson.testResults?.reduce((sum, r) => sum + (r.endTime - r.startTime), 0) || 0
    },
    tests: [],
    success: jestJson.success
  };

  // Parse individual test results
  for (const testFile of (jestJson.testResults || [])) {
    for (const assertion of (testFile.assertionResults || [])) {
      results.tests.push({
        name: assertion.title,
        fullName: assertion.fullName,
        suite: assertion.ancestorTitles?.join(' > ') || '',
        file: testFile.name,
        status: mapJestStatus(assertion.status),
        duration: assertion.duration || 0,
        errorMessage: assertion.failureMessages?.[0] || null,
        stackTrace: assertion.failureDetails?.[0]?.stack || null
      });
    }
  }

  return results;
}

function mapJestStatus(jestStatus) {
  switch (jestStatus) {
    case 'passed': return 'passed';
    case 'failed': return 'failed';
    case 'pending': return 'skipped';
    case 'todo': return 'skipped';
    default: return 'unknown';
  }
}

/**
 * Parse Vitest JSON output
 */
export function parseVitestResults(vitestJson) {
  if (!vitestJson) return null;

  const results = {
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: vitestJson.duration || 0
    },
    tests: [],
    success: vitestJson.success
  };

  for (const file of (vitestJson.testResults || [])) {
    for (const test of (file.assertionResults || [])) {
      results.summary.total++;
      if (test.status === 'passed') results.summary.passed++;
      else if (test.status === 'failed') results.summary.failed++;
      else results.summary.skipped++;

      results.tests.push({
        name: test.title,
        fullName: test.fullName,
        suite: test.ancestorTitles?.join(' > ') || '',
        file: file.name,
        status: test.status,
        duration: test.duration || 0,
        errorMessage: test.failureMessages?.[0] || null
      });
    }
  }

  return results;
}

/**
 * Unified result format
 */
export function createUnifiedResult(rawResults, framework) {
  switch (framework) {
    case 'jest':
      return parseJestResults(rawResults);
    case 'vitest':
      return parseVitestResults(rawResults);
    default:
      return rawResults;
  }
}
```

### 2.3 Test Validator

**File**: `lib/testExecution/testValidator.js`

```javascript
/**
 * Validate test code before execution
 */

import * as acorn from 'acorn';

/**
 * Validate JavaScript test code syntax
 */
export function validateJavaScriptTest(code) {
  const errors = [];

  // Check for syntax errors
  try {
    acorn.parse(code, {
      ecmaVersion: 2022,
      sourceType: 'module',
      allowAwaitOutsideFunction: true
    });
  } catch (e) {
    errors.push({
      type: 'syntax',
      message: e.message,
      line: e.loc?.line,
      column: e.loc?.column
    });
  }

  // Check for required patterns
  if (!code.includes('describe') && !code.includes('test') && !code.includes('it')) {
    errors.push({
      type: 'structure',
      message: 'No test functions found (describe, test, or it)'
    });
  }

  // Check for dangerous patterns
  const dangerous = [
    { pattern: /process\.exit/g, message: 'process.exit() not allowed' },
    { pattern: /require\(['"]child_process['"]\)/g, message: 'child_process not allowed' },
    { pattern: /require\(['"]fs['"]\)/g, message: 'fs module restricted' },
    { pattern: /eval\(/g, message: 'eval() not allowed' },
    { pattern: /Function\(/g, message: 'new Function() not allowed' }
  ];

  for (const { pattern, message } of dangerous) {
    if (pattern.test(code)) {
      errors.push({ type: 'security', message });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Detect test framework from code
 */
export function detectFramework(code) {
  // Jest/Vitest patterns
  if (code.includes('expect(') && (code.includes('describe(') || code.includes('test('))) {
    if (code.includes('vitest') || code.includes("from 'vitest'")) {
      return 'vitest';
    }
    return 'jest';
  }

  // Mocha patterns
  if (code.includes('chai') || code.includes('should.') || code.includes('assert.')) {
    return 'mocha';
  }

  // Playwright patterns
  if (code.includes('playwright') || code.includes('.page.')) {
    return 'playwright';
  }

  // Cypress patterns
  if (code.includes('cy.') || code.includes('Cypress')) {
    return 'cypress';
  }

  return 'jest'; // Default
}

/**
 * Extract test names from code
 */
export function extractTestNames(code) {
  const tests = [];

  // Match describe/test/it patterns
  const patterns = [
    /(?:describe|test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /(?:describe|test|it)\.(?:only|skip)\s*\(\s*['"`]([^'"`]+)['"`]/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      tests.push(match[1]);
    }
  }

  return tests;
}
```

---

## Part 3: API Endpoints

### 3.1 Start Execution

**File**: `app/api/execute-tests/route.js`

```javascript
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { saveTestExecution, updateExecutionStatus } from '@/lib/db';
import { validateJavaScriptTest, detectFramework } from '@/lib/testExecution/testValidator';

export async function POST(request) {
  // Require authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required to execute tests' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const {
      testCode,
      framework = 'auto',
      strategy = 'webcontainer',
      analysisId = null,
      targetId = null,
      environment = {}
    } = body;

    // Validate test code
    const validation = validateJavaScriptTest(testCode);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid test code', details: validation.errors },
        { status: 400 }
      );
    }

    // Detect framework if auto
    const detectedFramework = framework === 'auto'
      ? detectFramework(testCode)
      : framework;

    // Check framework support for strategy
    if (strategy === 'webcontainer') {
      const supported = ['jest', 'vitest', 'mocha'];
      if (!supported.includes(detectedFramework)) {
        return NextResponse.json(
          { error: `Framework '${detectedFramework}' not supported in WebContainer. Use Docker strategy.` },
          { status: 400 }
        );
      }
    }

    // Save execution record
    const execution = await saveTestExecution({
      userId,
      analysisId,
      targetId,
      framework: detectedFramework,
      strategy,
      testCode,
      environment
    });

    return NextResponse.json({
      executionId: execution.id,
      status: 'pending',
      framework: detectedFramework,
      strategy,
      streamUrl: `/api/execute-tests/${execution.id}/stream`
    });

  } catch (error) {
    console.error('Execution error:', error);
    return NextResponse.json(
      { error: 'Failed to start execution', message: error.message },
      { status: 500 }
    );
  }
}

// Validate test code before execution (dry run)
export async function PUT(request) {
  try {
    const { testCode, framework = 'auto' } = await request.json();

    const validation = validateJavaScriptTest(testCode);
    const detectedFramework = framework === 'auto'
      ? detectFramework(testCode)
      : framework;

    return NextResponse.json({
      valid: validation.valid,
      errors: validation.errors,
      framework: detectedFramework
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Validation failed', message: error.message },
      { status: 500 }
    );
  }
}
```

### 3.2 SSE Stream Endpoint

**File**: `app/api/execute-tests/[id]/stream/route.js`

```javascript
import { auth } from '@/auth';
import { getExecutionById, updateExecutionStatus, saveTestResult } from '@/lib/db';
import { runJestTests, runVitestTests } from '@/lib/testExecution/webContainerRunner';
import { parseJestResults, parseVitestResults } from '@/lib/testExecution/resultParser';

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const executionId = params.id;
  const execution = await getExecutionById(executionId);

  if (!execution) {
    return new Response('Execution not found', { status: 404 });
  }

  if (execution.user_id !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  // Already completed?
  if (['completed', 'failed', 'cancelled'].includes(execution.status)) {
    return new Response(
      `event: complete\ndata: ${JSON.stringify(execution)}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify({
          ...data,
          timestamp: Date.now(),
          elapsed: Date.now() - startTime
        })}\n\n`));
      };

      try {
        // Update status to running
        await updateExecutionStatus(executionId, {
          status: 'booting',
          started_at: new Date().toISOString()
        });
        emit('status', { status: 'booting', message: 'Starting execution environment...' });

        // Select runner based on framework
        const runner = execution.framework === 'vitest' ? runVitestTests : runJestTests;

        // Execute tests
        const result = await runner(execution.test_code, {
          onStatus: (status) => {
            emit('status', { status, message: getStatusMessage(status) });
            updateExecutionStatus(executionId, { status });
          },
          onOutput: (chunk) => {
            emit('output', { chunk });
          }
        });

        // Parse results
        const parser = execution.framework === 'vitest' ? parseVitestResults : parseJestResults;
        const parsed = parser(result.results);

        // Save results to database
        await updateExecutionStatus(executionId, {
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          total_tests: parsed?.summary?.total || 0,
          passed_tests: parsed?.summary?.passed || 0,
          failed_tests: parsed?.summary?.failed || 0,
          skipped_tests: parsed?.summary?.skipped || 0,
          duration_ms: parsed?.summary?.duration || (Date.now() - startTime),
          console_output: result.output,
          raw_results: result.results
        });

        // Save individual test results
        if (parsed?.tests) {
          for (const test of parsed.tests) {
            await saveTestResult(executionId, {
              testName: test.name,
              testFile: test.file,
              testSuite: test.suite,
              status: test.status,
              durationMs: test.duration,
              errorMessage: test.errorMessage,
              stackTrace: test.stackTrace
            });
          }
        }

        emit('complete', {
          status: result.success ? 'completed' : 'failed',
          summary: parsed?.summary,
          tests: parsed?.tests
        });

      } catch (error) {
        emit('error', {
          message: error.message,
          phase: error.phase || 'unknown'
        });

        await updateExecutionStatus(executionId, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          console_output: error.message
        });

      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}

function getStatusMessage(status) {
  switch (status) {
    case 'booting': return 'Starting execution environment...';
    case 'mounting': return 'Setting up test files...';
    case 'installing': return 'Installing dependencies...';
    case 'running': return 'Running tests...';
    case 'complete': return 'Execution complete';
    default: return status;
  }
}
```

### 3.3 Get Execution Status

**File**: `app/api/execute-tests/[id]/route.js`

```javascript
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getExecutionById } from '@/lib/db';

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const execution = await getExecutionById(params.id);

  if (!execution) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (execution.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(execution);
}

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cancel running execution
  // (Would need to implement cancellation in the runner)

  return NextResponse.json({ cancelled: true });
}
```

---

## Part 4: React Hooks

### 4.1 useTestExecution Hook

**File**: `app/hooks/useTestExecution.js`

```javascript
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export const ExecutionStatus = {
  IDLE: 'idle',
  STARTING: 'starting',
  BOOTING: 'booting',
  MOUNTING: 'mounting',
  INSTALLING: 'installing',
  RUNNING: 'running',
  COMPLETE: 'complete',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

export function useTestExecution() {
  const [status, setStatus] = useState(ExecutionStatus.IDLE);
  const [executionId, setExecutionId] = useState(null);
  const [output, setOutput] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ elapsed: 0 });

  const eventSourceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (testCode, options = {}) => {
    const {
      framework = 'auto',
      strategy = 'webcontainer',
      analysisId = null,
      targetId = null,
      environment = {}
    } = options;

    // Reset state
    setStatus(ExecutionStatus.STARTING);
    setOutput('');
    setResults(null);
    setError(null);
    setProgress({ elapsed: 0 });

    abortControllerRef.current = new AbortController();

    try {
      // Start execution
      const response = await fetch('/api/execute-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCode,
          framework,
          strategy,
          analysisId,
          targetId,
          environment
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to start execution');
      }

      const { executionId: id, streamUrl } = await response.json();
      setExecutionId(id);

      // Connect to SSE stream
      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('status', (e) => {
        const data = JSON.parse(e.data);
        setStatus(data.status);
        setProgress(prev => ({ ...prev, elapsed: data.elapsed }));
      });

      eventSource.addEventListener('output', (e) => {
        const data = JSON.parse(e.data);
        setOutput(prev => prev + data.chunk);
      });

      eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        setStatus(data.status === 'completed' ? ExecutionStatus.COMPLETE : ExecutionStatus.FAILED);
        setResults(data);
        eventSource.close();
      });

      eventSource.addEventListener('error', (e) => {
        try {
          const data = JSON.parse(e.data);
          setError(data.message);
        } catch {
          setError('Connection error');
        }
        setStatus(ExecutionStatus.FAILED);
        eventSource.close();
      });

      eventSource.onerror = () => {
        setError('Stream connection lost');
        setStatus(ExecutionStatus.FAILED);
        eventSource.close();
      };

    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus(ExecutionStatus.CANCELLED);
      } else {
        setError(err.message);
        setStatus(ExecutionStatus.FAILED);
      }
    }
  }, []);

  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus(ExecutionStatus.CANCELLED);
  }, []);

  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setStatus(ExecutionStatus.IDLE);
    setExecutionId(null);
    setOutput('');
    setResults(null);
    setError(null);
    setProgress({ elapsed: 0 });
  }, []);

  return {
    // State
    status,
    executionId,
    output,
    results,
    error,
    progress,

    // Computed
    isRunning: [
      ExecutionStatus.STARTING,
      ExecutionStatus.BOOTING,
      ExecutionStatus.MOUNTING,
      ExecutionStatus.INSTALLING,
      ExecutionStatus.RUNNING
    ].includes(status),
    isComplete: status === ExecutionStatus.COMPLETE,
    isFailed: status === ExecutionStatus.FAILED,

    // Actions
    execute,
    cancel,
    reset
  };
}
```

---

## Part 5: UI Components

### 5.1 Execute Button

**File**: `app/execute/components/ExecuteButton.jsx`

```jsx
'use client';

import { useState } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import { useTestExecution, ExecutionStatus } from '@/app/hooks/useTestExecution';
import ExecutionModal from './ExecutionModal';

export default function ExecuteButton({
  testCode,
  framework = 'jest',
  analysisId = null,
  disabled = false,
  size = 'md',
  onComplete
}) {
  const [showModal, setShowModal] = useState(false);
  const execution = useTestExecution();

  const handleExecute = async () => {
    setShowModal(true);
    await execution.execute(testCode, {
      framework,
      analysisId
    });

    if (execution.isComplete) {
      onComplete?.(execution.results);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <>
      <button
        onClick={handleExecute}
        disabled={disabled || execution.isRunning}
        className={`
          flex items-center gap-2
          ${sizeClasses[size]}
          bg-gradient-to-r from-green-500 to-emerald-500
          hover:from-green-600 hover:to-emerald-600
          disabled:opacity-50 disabled:cursor-not-allowed
          rounded-xl font-medium text-white transition-all
          shadow-lg shadow-green-500/20
        `}
      >
        {execution.isRunning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{getStatusLabel(execution.status)}</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>Execute Tests</span>
          </>
        )}
      </button>

      {showModal && (
        <ExecutionModal
          execution={execution}
          onClose={() => {
            setShowModal(false);
            execution.reset();
          }}
        />
      )}
    </>
  );
}

function getStatusLabel(status) {
  switch (status) {
    case ExecutionStatus.STARTING: return 'Starting...';
    case ExecutionStatus.BOOTING: return 'Booting...';
    case ExecutionStatus.INSTALLING: return 'Installing...';
    case ExecutionStatus.RUNNING: return 'Running...';
    default: return 'Executing...';
  }
}
```

### 5.2 Execution Modal

**File**: `app/execute/components/ExecutionModal.jsx`

```jsx
'use client';

import { X, CheckCircle2, XCircle, Loader2, Terminal, Clock } from 'lucide-react';
import { ExecutionStatus } from '@/app/hooks/useTestExecution';

export default function ExecutionModal({ execution, onClose }) {
  const {
    status,
    output,
    results,
    error,
    progress,
    isRunning,
    cancel
  } = execution;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <StatusIcon status={status} />
            <div>
              <h3 className="text-lg font-semibold text-white">Test Execution</h3>
              <p className="text-sm text-slate-400">
                {getStatusMessage(status)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {progress.elapsed > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(progress.elapsed)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Results Summary */}
          {results?.summary && (
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Total" value={results.summary.total} />
              <StatCard label="Passed" value={results.summary.passed} color="green" />
              <StatCard label="Failed" value={results.summary.failed} color="red" />
              <StatCard label="Skipped" value={results.summary.skipped} color="yellow" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-red-400 font-medium mb-1">
                <XCircle className="w-4 h-4" />
                <span>Execution Failed</span>
              </div>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Console Output */}
          <div className="bg-slate-900 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Console Output</span>
            </div>
            <pre className="p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
              {output || 'Waiting for output...'}
            </pre>
          </div>

          {/* Test Results */}
          {results?.tests && results.tests.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-400">Test Results</h4>
              <div className="space-y-1">
                {results.tests.map((test, i) => (
                  <TestResultRow key={i} test={test} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          {isRunning ? (
            <button
              onClick={cancel}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
          >
            {isRunning ? 'Run in Background' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  switch (status) {
    case ExecutionStatus.COMPLETE:
      return <CheckCircle2 className="w-6 h-6 text-green-400" />;
    case ExecutionStatus.FAILED:
      return <XCircle className="w-6 h-6 text-red-400" />;
    default:
      return <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />;
  }
}

function getStatusMessage(status) {
  switch (status) {
    case ExecutionStatus.BOOTING: return 'Starting WebContainer...';
    case ExecutionStatus.MOUNTING: return 'Setting up test files...';
    case ExecutionStatus.INSTALLING: return 'Installing dependencies...';
    case ExecutionStatus.RUNNING: return 'Running tests...';
    case ExecutionStatus.COMPLETE: return 'Execution complete';
    case ExecutionStatus.FAILED: return 'Execution failed';
    default: return 'Preparing...';
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    red: 'bg-red-500/10 text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-400'
  };

  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-70">{label}</div>
    </div>
  );
}

function TestResultRow({ test }) {
  const statusColors = {
    passed: 'text-green-400',
    failed: 'text-red-400',
    skipped: 'text-yellow-400'
  };

  const statusIcons = {
    passed: '✓',
    failed: '✗',
    skipped: '○'
  };

  return (
    <div className={`
      flex items-center justify-between p-2 rounded-lg
      ${test.status === 'failed' ? 'bg-red-500/5' : 'bg-slate-800/50'}
    `}>
      <div className="flex items-center gap-2">
        <span className={statusColors[test.status]}>{statusIcons[test.status]}</span>
        <span className="text-sm text-slate-300">{test.name}</span>
      </div>
      <span className="text-xs text-slate-500">{test.duration}ms</span>
    </div>
  );
}
```

### 5.3 Live Execution Page

**File**: `app/execute/[id]/page.js`

```jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '@/app/components/layout/AppLayout';
import { Card, Button } from '@/app/components/ui';
import {
  Loader2, ArrowLeft, CheckCircle2, XCircle,
  RefreshCw, Download, Terminal, Clock
} from 'lucide-react';

export default function ExecutionDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState('');

  useEffect(() => {
    if (authStatus === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    loadExecution();
  }, [session, authStatus, params.id]);

  // Connect to SSE if still running
  useEffect(() => {
    if (!execution) return;
    if (['completed', 'failed', 'cancelled'].includes(execution.status)) {
      setOutput(execution.console_output || '');
      return;
    }

    // Connect to stream
    const eventSource = new EventSource(`/api/execute-tests/${params.id}/stream`);

    eventSource.addEventListener('output', (e) => {
      const data = JSON.parse(e.data);
      setOutput(prev => prev + data.chunk);
    });

    eventSource.addEventListener('status', (e) => {
      const data = JSON.parse(e.data);
      setExecution(prev => ({ ...prev, status: data.status }));
    });

    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      loadExecution(); // Reload full data
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [execution?.status, params.id]);

  async function loadExecution() {
    try {
      const response = await fetch(`/api/execute-tests/${params.id}`);
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setExecution(data);
      setOutput(data.console_output || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!execution) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-red-400">Execution not found</p>
          <Button onClick={() => router.push('/history')} className="mt-4">
            Back to History
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isRunning = !['completed', 'failed', 'cancelled'].includes(execution.status);

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Test Execution #{execution.id}
              </h1>
              <p className="text-sm text-slate-400">
                {execution.framework} • {execution.strategy}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isRunning && (
              <div className="flex items-center gap-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{execution.status}</span>
              </div>
            )}

            {execution.status === 'completed' && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Completed</span>
              </div>
            )}

            {execution.status === 'failed' && (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-4 h-4" />
                <span>Failed</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {execution.total_tests > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-blue-500/10">
              <div className="text-2xl font-bold text-blue-400">{execution.total_tests}</div>
              <div className="text-sm text-slate-400">Total</div>
            </Card>
            <Card className="p-4 bg-green-500/10">
              <div className="text-2xl font-bold text-green-400">{execution.passed_tests}</div>
              <div className="text-sm text-slate-400">Passed</div>
            </Card>
            <Card className="p-4 bg-red-500/10">
              <div className="text-2xl font-bold text-red-400">{execution.failed_tests}</div>
              <div className="text-sm text-slate-400">Failed</div>
            </Card>
            <Card className="p-4 bg-slate-700/50">
              <div className="text-2xl font-bold text-slate-300">
                {execution.duration_ms ? `${(execution.duration_ms / 1000).toFixed(1)}s` : '-'}
              </div>
              <div className="text-sm text-slate-400">Duration</div>
            </Card>
          </div>
        )}

        {/* Console Output */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Console Output</span>
          </div>
          <pre className="p-4 text-sm font-mono text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto bg-slate-900">
            {output || 'No output yet...'}
          </pre>
        </Card>

        {/* Test Results */}
        {execution.results && execution.results.length > 0 && (
          <Card>
            <div className="px-4 py-3 border-b border-slate-700">
              <span className="text-sm font-medium text-slate-300">Test Results</span>
            </div>
            <div className="divide-y divide-slate-700">
              {execution.results.map((test, i) => (
                <div
                  key={i}
                  className={`p-4 ${test.status === 'failed' ? 'bg-red-500/5' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {test.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      {test.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                      <span className="text-slate-300">{test.test_name}</span>
                    </div>
                    <span className="text-sm text-slate-500">{test.duration_ms}ms</span>
                  </div>

                  {test.error_message && (
                    <pre className="mt-2 p-2 text-xs text-red-300 bg-red-500/10 rounded overflow-x-auto">
                      {test.error_message}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
```

---

## Part 6: Integration Points

### 6.1 Add Execute Button to OutputSection

**File**: `app/components/output/OutputSection.jsx`

Add import and button:

```jsx
import ExecuteButton from '@/app/execute/components/ExecuteButton';

// In the button section, add:
<ExecuteButton
  testCode={results.testCases}
  framework={detectFrameworkFromContent(results.testCases)}
  disabled={!results.testCases}
/>
```

### 6.2 Add Execute Button to History Detail

**File**: `app/history/[id]/page.js`

Add in the action buttons section:

```jsx
import ExecuteButton from '@/app/execute/components/ExecuteButton';

// In action buttons:
{analysis.results?.testCases && (
  <ExecuteButton
    testCode={analysis.results.testCases}
    analysisId={analysis.id}
    framework="jest"
  />
)}
```

---

## Part 7: File Creation Summary

| Priority | File | Purpose |
|----------|------|---------|
| P0 | `lib/db.js` | Add migration for new tables |
| P0 | `lib/testExecution/webContainerRunner.js` | Core execution engine |
| P0 | `lib/testExecution/resultParser.js` | Parse test results |
| P0 | `lib/testExecution/testValidator.js` | Validate test code |
| P0 | `app/api/execute-tests/route.js` | Start execution API |
| P0 | `app/api/execute-tests/[id]/route.js` | Get execution status |
| P0 | `app/api/execute-tests/[id]/stream/route.js` | SSE progress stream |
| P0 | `app/hooks/useTestExecution.js` | React hook |
| P0 | `app/execute/components/ExecuteButton.jsx` | Trigger button |
| P0 | `app/execute/components/ExecutionModal.jsx` | Live execution modal |
| P1 | `app/execute/[id]/page.js` | Full execution detail page |
| P1 | `app/components/output/OutputSection.jsx` | Modify: add Execute button |
| P1 | `app/history/[id]/page.js` | Modify: add Execute button |
| P2 | `lib/testExecution/vitestRunner.js` | Vitest support |
| P2 | `lib/testExecution/scopeDetector.js` | Auto-detect scope |

---

## Part 8: Execution Strategies

### Strategy Matrix

| Strategy | Cost | Languages | Setup | Best For |
|----------|------|-----------|-------|----------|
| **WebContainer** | Free | JS only | None | Quick unit tests |
| **Local Docker** | Free | All | Docker install | Power users |
| **Cloud Docker** | Credits | All | None | Teams, CI/CD |
| **Remote Docker** | Free | All | Server setup | Enterprise |

### Implementation Order

1. **Phase 1**: WebContainer only (Jest, Vitest)
2. **Phase 2**: Add Docker support
3. **Phase 3**: Add cloud provider (Fly.io)
4. **Phase 4**: Remote Docker option

---

## Document Stats

- **Total Lines**: ~1200 (implementation code)
- **New Files**: 12
- **Modified Files**: 3
- **Database Tables**: 4 new
- **API Endpoints**: 4 new
- **React Components**: 4 new

This plan provides complete implementation code for all components needed to add test execution to OrizonQA.
