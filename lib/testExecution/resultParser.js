/**
 * Test Result Parser
 *
 * Parses test results from various frameworks into a unified format
 * for consistent display and storage.
 */

/**
 * Parse Jest JSON output
 * @param {object} jestJson - Raw Jest JSON output
 * @returns {object|null} Unified result format
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

/**
 * Map Jest status to unified status
 */
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
 * @param {object} vitestJson - Raw Vitest JSON output
 * @returns {object|null} Unified result format
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
 * Parse Mocha JSON output
 * @param {object} mochaJson - Raw Mocha JSON output
 * @returns {object|null} Unified result format
 */
export function parseMochaResults(mochaJson) {
  if (!mochaJson) return null;

  const results = {
    summary: {
      total: (mochaJson.stats?.tests || 0),
      passed: (mochaJson.stats?.passes || 0),
      failed: (mochaJson.stats?.failures || 0),
      skipped: (mochaJson.stats?.pending || 0),
      duration: mochaJson.stats?.duration || 0
    },
    tests: [],
    success: (mochaJson.stats?.failures || 0) === 0
  };

  // Parse passes
  for (const test of (mochaJson.passes || [])) {
    results.tests.push({
      name: test.title,
      fullName: test.fullTitle,
      suite: extractSuiteFromFullTitle(test.fullTitle, test.title),
      file: test.file,
      status: 'passed',
      duration: test.duration || 0,
      errorMessage: null
    });
  }

  // Parse failures
  for (const test of (mochaJson.failures || [])) {
    results.tests.push({
      name: test.title,
      fullName: test.fullTitle,
      suite: extractSuiteFromFullTitle(test.fullTitle, test.title),
      file: test.file,
      status: 'failed',
      duration: test.duration || 0,
      errorMessage: test.err?.message || null,
      stackTrace: test.err?.stack || null
    });
  }

  // Parse pending (skipped)
  for (const test of (mochaJson.pending || [])) {
    results.tests.push({
      name: test.title,
      fullName: test.fullTitle,
      suite: extractSuiteFromFullTitle(test.fullTitle, test.title),
      file: test.file,
      status: 'skipped',
      duration: 0,
      errorMessage: null
    });
  }

  return results;
}

function extractSuiteFromFullTitle(fullTitle, title) {
  if (!fullTitle || !title) return '';
  return fullTitle.replace(` ${title}`, '').trim();
}

/**
 * Create unified result from any framework
 * @param {object} rawResults - Raw results from test runner
 * @param {string} framework - Framework name (jest, vitest, mocha)
 * @returns {object|null} Unified result format
 */
export function createUnifiedResult(rawResults, framework) {
  switch (framework.toLowerCase()) {
    case 'jest':
      return parseJestResults(rawResults);
    case 'vitest':
      return parseVitestResults(rawResults);
    case 'mocha':
      return parseMochaResults(rawResults);
    default:
      // Try to detect format
      if (rawResults?.numTotalTests !== undefined) {
        return parseJestResults(rawResults);
      }
      if (rawResults?.stats?.tests !== undefined) {
        return parseMochaResults(rawResults);
      }
      return rawResults;
  }
}

/**
 * Calculate pass rate percentage
 * @param {object} summary - Test summary object
 * @returns {number} Pass rate as percentage
 */
export function calculatePassRate(summary) {
  if (!summary || summary.total === 0) return 0;
  return Math.round((summary.passed / summary.total) * 100);
}

/**
 * Format duration for display
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/**
 * Get status badge color
 * @param {string} status - Test status
 * @returns {string} Tailwind color class
 */
export function getStatusColor(status) {
  switch (status) {
    case 'passed': return 'text-green-400';
    case 'failed': return 'text-red-400';
    case 'skipped': return 'text-yellow-400';
    case 'broken': return 'text-orange-400';
    default: return 'text-slate-400';
  }
}

/**
 * Get status icon
 * @param {string} status - Test status
 * @returns {string} Unicode icon
 */
export function getStatusIcon(status) {
  switch (status) {
    case 'passed': return '✓';
    case 'failed': return '✗';
    case 'skipped': return '○';
    case 'broken': return '⚠';
    default: return '?';
  }
}
