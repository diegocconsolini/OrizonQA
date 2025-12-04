import { auth } from '@/auth';
import { getExecutionById, updateExecutionStatus, saveTestResult } from '@/lib/db';
import { parseJestResults, parseVitestResults, parseMochaResults } from '@/lib/testExecution/resultParser';

/**
 * GET /api/execute-tests/[id]/stream
 *
 * Server-Sent Events (SSE) stream for real-time test execution updates.
 *
 * Note: WebContainer execution happens on the client side (browser).
 * This endpoint is for tracking execution status and storing results.
 *
 * For WebContainer strategy:
 * - Client boots WebContainer and runs tests
 * - Client POSTs updates to this endpoint
 * - This stream reflects those updates
 *
 * Events:
 * - status: Execution status change (booting, mounting, installing, running, complete)
 * - output: Console output chunk
 * - complete: Final results
 * - error: Error occurred
 */
export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const executionId = parseInt(id, 10);
  const execution = await getExecutionById(executionId);

  if (!execution) {
    return new Response('Execution not found', { status: 404 });
  }

  if (execution.user_id !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  // If already completed, return final status
  if (['completed', 'failed', 'cancelled'].includes(execution.status)) {
    const encoder = new TextEncoder();
    return new Response(
      encoder.encode(`event: complete\ndata: ${JSON.stringify({
        status: execution.status,
        summary: {
          total: execution.total_tests,
          passed: execution.passed_tests,
          failed: execution.failed_tests,
          skipped: execution.skipped_tests
        },
        duration: execution.duration_ms,
        results: execution.results
      })}\n\n`),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      }
    );
  }

  // For active executions, create SSE stream
  const encoder = new TextEncoder();
  const startTime = Date.now();

  // Store for client to POST updates
  // In production, use Redis pub/sub or similar
  const executionUpdates = new Map();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify({
          ...data,
          timestamp: Date.now(),
          elapsed: Date.now() - startTime
        })}\n\n`));
      };

      // Send initial status
      emit('status', {
        status: execution.status,
        message: getStatusMessage(execution.status),
        framework: execution.framework,
        strategy: execution.strategy
      });

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (e) {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Poll for updates (in production, use Redis pub/sub)
      const pollInterval = setInterval(async () => {
        try {
          const updated = await getExecutionById(executionId);

          if (updated.status !== execution.status) {
            emit('status', {
              status: updated.status,
              message: getStatusMessage(updated.status)
            });
            execution.status = updated.status;
          }

          if (['completed', 'failed', 'cancelled'].includes(updated.status)) {
            clearInterval(pollInterval);
            clearInterval(heartbeatInterval);

            emit('complete', {
              status: updated.status,
              summary: {
                total: updated.total_tests,
                passed: updated.passed_tests,
                failed: updated.failed_tests,
                skipped: updated.skipped_tests
              },
              duration: updated.duration_ms,
              results: updated.results
            });

            controller.close();
          }
        } catch (e) {
          console.error('Poll error:', e);
        }
      }, 1000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
      });
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

/**
 * POST /api/execute-tests/[id]/stream
 *
 * Receive execution updates from client (WebContainer)
 *
 * Body:
 * - event: string - Event type (status, output, results, error)
 * - data: object - Event data
 */
export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const executionId = parseInt(id, 10);
  const execution = await getExecutionById(executionId);

  if (!execution) {
    return new Response('Execution not found', { status: 404 });
  }

  if (execution.user_id !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const { event, data } = await request.json();

    switch (event) {
      case 'status':
        await updateExecutionStatus(executionId, {
          status: data.status,
          ...(data.status === 'running' && { started_at: new Date().toISOString() })
        });
        break;

      case 'output':
        // Append to console output
        await updateExecutionStatus(executionId, {
          console_output: (execution.console_output || '') + data.chunk
        });
        break;

      case 'results':
        // Parse results based on framework
        let parsed;
        switch (execution.framework) {
          case 'jest':
            parsed = parseJestResults(data.results);
            break;
          case 'vitest':
            parsed = parseVitestResults(data.results);
            break;
          case 'mocha':
            parsed = parseMochaResults(data.results);
            break;
          default:
            parsed = data.results;
        }

        // Update execution with results
        await updateExecutionStatus(executionId, {
          status: data.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          total_tests: parsed?.summary?.total || 0,
          passed_tests: parsed?.summary?.passed || 0,
          failed_tests: parsed?.summary?.failed || 0,
          skipped_tests: parsed?.summary?.skipped || 0,
          duration_ms: parsed?.summary?.duration || data.duration,
          console_output: data.output,
          raw_results: data.results
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
        break;

      case 'error':
        await updateExecutionStatus(executionId, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          console_output: (execution.console_output || '') + `\nError: ${data.message}`
        });
        break;

      default:
        return new Response('Unknown event type', { status: 400 });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Stream POST error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function getStatusMessage(status) {
  switch (status) {
    case 'pending': return 'Waiting to start...';
    case 'booting': return 'Starting execution environment...';
    case 'mounting': return 'Setting up test files...';
    case 'installing': return 'Installing dependencies...';
    case 'running': return 'Running tests...';
    case 'completed': return 'Execution complete';
    case 'failed': return 'Execution failed';
    case 'cancelled': return 'Execution cancelled';
    default: return status;
  }
}
