import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { saveTestExecution } from '@/lib/db';
import { validateJavaScriptTest, detectFramework, canExecuteInWebContainer } from '@/lib/testExecution/testValidator';

/**
 * POST /api/execute-tests
 *
 * Start a new test execution
 *
 * Body:
 * - testCode: string (required) - The test code to execute
 * - framework: string (optional) - Test framework (jest, vitest, mocha). Default: auto-detect
 * - strategy: string (optional) - Execution strategy (webcontainer, docker). Default: webcontainer
 * - analysisId: number (optional) - Link to analysis record
 * - targetId: number (optional) - Link to target record
 * - environment: object (optional) - Environment variables
 *
 * Returns:
 * - executionId: number - ID of the created execution record
 * - status: string - Initial status (pending)
 * - framework: string - Detected/specified framework
 * - strategy: string - Execution strategy
 * - streamUrl: string - URL to connect for SSE updates
 */
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

    // Validate test code presence
    if (!testCode || testCode.trim().length === 0) {
      return NextResponse.json(
        { error: 'Test code is required' },
        { status: 400 }
      );
    }

    // Validate test code syntax and structure
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
      const webContainerCheck = canExecuteInWebContainer(testCode, detectedFramework);
      if (!webContainerCheck.canExecute) {
        return NextResponse.json(
          { error: webContainerCheck.reason },
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
      streamUrl: `/api/execute-tests/${execution.id}/stream`,
      createdAt: execution.created_at
    });

  } catch (error) {
    console.error('Execution error:', error);
    return NextResponse.json(
      { error: 'Failed to start execution', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/execute-tests
 *
 * Validate test code before execution (dry run)
 *
 * Body:
 * - testCode: string (required) - The test code to validate
 * - framework: string (optional) - Expected framework
 *
 * Returns:
 * - valid: boolean - Whether the code is valid
 * - errors: array - Validation errors if any
 * - framework: string - Detected framework
 * - canExecute: boolean - Whether WebContainer can run this
 * - testCount: number - Estimated number of tests
 */
export async function PUT(request) {
  try {
    const { testCode, framework = 'auto' } = await request.json();

    if (!testCode) {
      return NextResponse.json(
        { error: 'Test code is required' },
        { status: 400 }
      );
    }

    const validation = validateJavaScriptTest(testCode);
    const detectedFramework = framework === 'auto'
      ? detectFramework(testCode)
      : framework;

    const webContainerCheck = canExecuteInWebContainer(testCode, detectedFramework);

    // Count expected tests
    const testMatches = testCode.match(/(?:test|it)\s*\(/g) || [];

    return NextResponse.json({
      valid: validation.valid,
      errors: validation.errors,
      framework: detectedFramework,
      canExecute: webContainerCheck.canExecute,
      canExecuteReason: webContainerCheck.reason,
      testCount: testMatches.length
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Validation failed', message: error.message },
      { status: 500 }
    );
  }
}
