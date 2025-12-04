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
  } catch (e) {
    // Results file might not exist
  }

  onStatus('complete');
  return { exitCode: testExitCode, output, results, success: testExitCode === 0 };
}

/**
 * Run Mocha tests in WebContainer
 */
export async function runMochaTests(testCode, options = {}) {
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
            test: 'mocha --reporter json > results.json'
          },
          devDependencies: {
            mocha: '^10.2.0',
            chai: '^4.3.7',
            ...dependencies
          }
        }, null, 2)
      }
    },
    'test': {
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
  } catch (e) {
    // Results file might not exist
  }

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

/**
 * Check if WebContainer is supported in this environment
 */
export function isWebContainerSupported() {
  return typeof window !== 'undefined' && 'SharedArrayBuffer' in window;
}
