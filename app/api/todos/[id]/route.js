import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTodoById, updateTodo, deleteTodo, getSubtasks } from '@/lib/db';

/**
 * GET /api/todos/[id] - Get a single todo with subtasks
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const todoId = parseInt(id);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    const todo = await getTodoById(todoId, session.user.id);

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Get subtasks
    const subtasks = await getSubtasks(todoId, session.user.id);

    return NextResponse.json({
      ...todo,
      subtasks
    });
  } catch (error) {
    console.error('GET /api/todos/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
  }
}

/**
 * PATCH /api/todos/[id] - Update a todo
 */
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const todoId = parseInt(id);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, tags, position } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      if (title.length > 500) {
        return NextResponse.json({ error: 'Title must be 500 characters or less' }, { status: 400 });
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
    }

    // Validate priority if provided
    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
      }
    }

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (tags !== undefined) updates.tags = tags;
    if (position !== undefined) updates.position = position;

    const todo = await updateTodo(todoId, session.user.id, updates);

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error('PATCH /api/todos/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

/**
 * DELETE /api/todos/[id] - Delete a todo
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const todoId = parseInt(id);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    const deleted = await deleteTodo(todoId, session.user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/todos/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
