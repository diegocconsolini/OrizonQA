import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getExecutionById, updateExecutionStatus } from '@/lib/db';

/**
 * GET /api/execute-tests/[id]
 *
 * Get execution details by ID
 *
 * Returns:
 * - Full execution record with test results
 */
export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const execution = await getExecutionById(parseInt(id, 10));

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    // Check ownership
    if (execution.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error('Get execution error:', error);
    return NextResponse.json(
      { error: 'Failed to get execution', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/execute-tests/[id]
 *
 * Update execution (e.g., cancel)
 *
 * Body:
 * - action: string - 'cancel' to cancel execution
 */
export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { action } = await request.json();
    const execution = await getExecutionById(parseInt(id, 10));

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    if (execution.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'cancel') {
      // Only cancel if still running
      const runningStates = ['pending', 'booting', 'mounting', 'installing', 'running'];
      if (!runningStates.includes(execution.status)) {
        return NextResponse.json(
          { error: 'Cannot cancel - execution already completed' },
          { status: 400 }
        );
      }

      await updateExecutionStatus(parseInt(id, 10), {
        status: 'cancelled',
        completed_at: new Date().toISOString()
      });

      return NextResponse.json({ status: 'cancelled' });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Update execution error:', error);
    return NextResponse.json(
      { error: 'Failed to update execution', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/execute-tests/[id]
 *
 * Delete execution record (if completed)
 */
export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const execution = await getExecutionById(parseInt(id, 10));

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    if (execution.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't delete running executions
    const runningStates = ['pending', 'booting', 'mounting', 'installing', 'running'];
    if (runningStates.includes(execution.status)) {
      return NextResponse.json(
        { error: 'Cannot delete - execution still running. Cancel first.' },
        { status: 400 }
      );
    }

    // Delete execution (cascade will delete test_results)
    const { query } = await import('@/lib/db');
    await query('DELETE FROM test_executions WHERE id = $1', [parseInt(id, 10)]);

    return NextResponse.json({ deleted: true });

  } catch (error) {
    console.error('Delete execution error:', error);
    return NextResponse.json(
      { error: 'Failed to delete execution', message: error.message },
      { status: 500 }
    );
  }
}
