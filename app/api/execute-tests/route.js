import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { saveTestExecution, getExecutionsByUser, getExecutionCountByUser } from '@/lib/db';
import { validateJavaScriptTest, detectFramework, canExecuteInWebContainer } from '@/lib/testExecution/testValidator';

/**
 * GET /api/execute-tests
 *
 * List user's test executions
 *
 * Query params:
 * - limit: number (optional, default 20)
 * - offset: number (optional, default 0)
 *
 * Returns:
 * - executions: array - List of execution records
 * - total: number - Total count for pagination
 */
export async function GET(request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const [executions, total] = await Promise.all([
      getExecutionsByUser(userId, limit, offset),
      getExecutionCountByUser(userId)
    ]);

    return NextResponse.json({
      executions: executions.map(e => ({
        id: e.id,
        framework: e.framework,
        strategy: e.strategy,
        status: e.status,
        totalTests: e.total_tests,
        passedTests: e.passed_tests,
        failedTests: e.failed_tests,
        skippedTests: e.skipped_tests,
        duration: e.duration_ms,
        startedAt: e.started_at,
        completedAt: e.completed_at,
        createdAt: e.created_at,
        testCode: e.test_code,
        githubUrl: e.github_url,
        githubBranch: e.github_branch
      })),
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Failed to fetch executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions', message: error.message },
      { status: 500 }
    );
  }
}

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
