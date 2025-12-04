/**
 * Test Validator
 *
 * Validates test code before execution to ensure:
 * - Correct syntax
 * - Required test structure (describe, test, it)
 * - No dangerous patterns (security)
 * - Framework detection
 */

import * as acorn from 'acorn';

/**
 * Validate JavaScript test code syntax and structure
 * @param {string} code - Test code to validate
 * @returns {{valid: boolean, errors: Array<{type: string, message: string, line?: number, column?: number}>}}
 */
export function validateJavaScriptTest(code) {
  const errors = [];

  // Check for empty code
  if (!code || code.trim().length === 0) {
    errors.push({
      type: 'empty',
      message: 'Test code is empty'
    });
    return { valid: false, errors };
  }

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

  // Check for required test patterns
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
    { pattern: /import\s+.*from\s+['"]child_process['"]/g, message: 'child_process not allowed' },
    { pattern: /require\(['"]fs['"]\)/g, message: 'fs module restricted in WebContainer' },
    { pattern: /import\s+.*from\s+['"]fs['"]/g, message: 'fs module restricted in WebContainer' },
    { pattern: /eval\s*\(/g, message: 'eval() not allowed for security' },
    { pattern: /new\s+Function\s*\(/g, message: 'new Function() not allowed for security' },
    { pattern: /require\(['"]vm['"]\)/g, message: 'vm module not allowed' },
    { pattern: /import\s+.*from\s+['"]vm['"]/g, message: 'vm module not allowed' },
    { pattern: /require\(['"]os['"]\)/g, message: 'os module restricted' },
    { pattern: /import\s+.*from\s+['"]os['"]/g, message: 'os module restricted' },
    { pattern: /process\.env\[/g, message: 'Direct process.env access not recommended' },
    { pattern: /globalThis\s*\[/g, message: 'globalThis access not recommended' },
    { pattern: /while\s*\(\s*true\s*\)/g, message: 'Infinite loops not allowed' },
    { pattern: /for\s*\(\s*;\s*;\s*\)/g, message: 'Infinite loops not allowed' }
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
 * @param {string} code - Test code
 * @returns {string} Framework name (jest, vitest, mocha, playwright, cypress)
 */
export function detectFramework(code) {
  // Vitest patterns (check first as it may look like Jest)
  if (code.includes("from 'vitest'") ||
      code.includes('from "vitest"') ||
      code.includes("import { vi }") ||
      code.includes('vi.mock') ||
      code.includes('vi.fn')) {
    return 'vitest';
  }

  // Jest patterns
  if (code.includes('jest.mock') ||
      code.includes('jest.fn') ||
      code.includes('jest.spyOn') ||
      code.includes('beforeEach') ||
      code.includes('afterEach')) {
    return 'jest';
  }

  // Playwright patterns
  if (code.includes('@playwright/test') ||
      code.includes('playwright') ||
      code.includes('.page.') ||
      code.includes('test.use(')) {
    return 'playwright';
  }

  // Cypress patterns
  if (code.includes('cy.') ||
      code.includes('Cypress.') ||
      code.includes('cypress')) {
    return 'cypress';
  }

  // Mocha patterns
  if (code.includes("from 'chai'") ||
      code.includes('from "chai"') ||
      code.includes('should.') ||
      code.includes('assert.') ||
      code.includes("require('chai')")) {
    return 'mocha';
  }

  // Default to Jest (most common)
  if (code.includes('expect(') && (code.includes('describe(') || code.includes('test('))) {
    return 'jest';
  }

  return 'jest';
}

/**
 * Extract test names from code
 * @param {string} code - Test code
 * @returns {string[]} Array of test names
 */
export function extractTestNames(code) {
  const tests = [];
  const seenNames = new Set();

  // Match describe/test/it patterns
  const patterns = [
    /(?:describe|test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /(?:describe|test|it)\.(?:only|skip)\s*\(\s*['"`]([^'"`]+)['"`]/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const name = match[1];
      if (!seenNames.has(name)) {
        tests.push(name);
        seenNames.add(name);
      }
    }
  }

  return tests;
}

/**
 * Count expected tests from code
 * @param {string} code - Test code
 * @returns {number} Estimated test count
 */
export function countExpectedTests(code) {
  // Count test() and it() calls (not describe)
  const testMatches = code.match(/(?:test|it)\s*\(/g) || [];
  const skipMatches = code.match(/(?:test|it)\.skip\s*\(/g) || [];
  const onlyMatches = code.match(/(?:test|it)\.only\s*\(/g) || [];

  return testMatches.length + skipMatches.length + onlyMatches.length;
}

/**
 * Check if code is valid for WebContainer execution
 * @param {string} code - Test code
 * @param {string} framework - Target framework
 * @returns {{canExecute: boolean, reason?: string}}
 */
export function canExecuteInWebContainer(code, framework) {
  // WebContainer only supports Node.js JavaScript tests
  const supportedFrameworks = ['jest', 'vitest', 'mocha'];

  if (!supportedFrameworks.includes(framework)) {
    return {
      canExecute: false,
      reason: `Framework '${framework}' is not supported in WebContainer. Use Docker strategy instead.`
    };
  }

  // Check for browser-only code
  if (code.includes('window.') || code.includes('document.')) {
    return {
      canExecute: false,
      reason: 'Browser APIs (window, document) not available in WebContainer. Use jsdom or Docker.'
    };
  }

  // Check for network operations that might fail
  if (code.includes('fetch(') && !code.includes('mock')) {
    return {
      canExecute: true,
      reason: 'Warning: Network requests may fail in WebContainer sandbox.'
    };
  }

  return { canExecute: true };
}

/**
 * Sanitize test code for safe execution
 * @param {string} code - Test code
 * @returns {string} Sanitized code
 */
export function sanitizeTestCode(code) {
  // Remove any require/import of dangerous modules
  let sanitized = code;

  // Comment out dangerous imports
  sanitized = sanitized.replace(
    /import\s+.*from\s+['"](?:child_process|vm|os)['"]/g,
    '// BLOCKED: $&'
  );

  sanitized = sanitized.replace(
    /require\(['"](?:child_process|vm|os)['"]\)/g,
    '/* BLOCKED: $& */ null'
  );

  return sanitized;
}

/**
 * Get framework-specific setup requirements
 * @param {string} framework - Framework name
 * @returns {object} Setup configuration
 */
export function getFrameworkSetup(framework) {
  const setups = {
    jest: {
      configFile: 'jest.config.js',
      testScript: 'jest --json --outputFile=results.json --forceExit',
      dependencies: {
        jest: '^29.7.0',
        '@babel/preset-env': '^7.23.0'
      },
      testDir: '__tests__',
      testPattern: '**/*.test.js'
    },
    vitest: {
      configFile: 'vitest.config.js',
      testScript: 'vitest run --reporter=json --outputFile=results.json',
      dependencies: {
        vitest: '^1.0.0'
      },
      testDir: 'tests',
      testPattern: '**/*.test.js'
    },
    mocha: {
      configFile: null,
      testScript: 'mocha --reporter json > results.json',
      dependencies: {
        mocha: '^10.2.0',
        chai: '^4.3.7'
      },
      testDir: 'test',
      testPattern: '**/*.test.js'
    }
  };

  return setups[framework] || setups.jest;
}
