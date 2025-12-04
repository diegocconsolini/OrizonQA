import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { reorderTodos, bulkUpdateTodoStatus, bulkDeleteTodos } from '@/lib/db';

/**
 * POST /api/todos/bulk - Bulk operations on todos
 *
 * Actions:
 * - reorder: Update positions { action: 'reorder', todoIds: [1, 2, 3] }
 * - updateStatus: Update status { action: 'updateStatus', todoIds: [1, 2], status: 'completed' }
 * - delete: Delete multiple { action: 'delete', todoIds: [1, 2] }
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, todoIds, status } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return NextResponse.json({ error: 'todoIds array is required' }, { status: 400 });
    }

    // Validate all IDs are numbers
    if (!todoIds.every(id => typeof id === 'number' && !isNaN(id))) {
      return NextResponse.json({ error: 'Invalid todo IDs' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'reorder':
        await reorderTodos(session.user.id, todoIds);
        result = { success: true, action: 'reorder', count: todoIds.length };
        break;

      case 'updateStatus':
        if (!status) {
          return NextResponse.json({ error: 'Status is required for updateStatus action' }, { status: 400 });
        }
        const validStatuses = ['pending', 'in_progress', 'completed'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        const updatedCount = await bulkUpdateTodoStatus(session.user.id, todoIds, status);
        result = { success: true, action: 'updateStatus', count: updatedCount };
        break;

      case 'delete':
        const deletedCount = await bulkDeleteTodos(session.user.id, todoIds);
        result = { success: true, action: 'delete', count: deletedCount };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/todos/bulk error:', error);
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}
