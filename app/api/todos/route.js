import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createTodo, getTodosByUser, getTodoStats } from '@/lib/db';

/**
 * GET /api/todos - List todos for authenticated user
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      tag: searchParams.get('tag') || undefined,
      search: searchParams.get('search') || undefined,
      parentId: searchParams.get('parentId') ? parseInt(searchParams.get('parentId')) : null,
      includeSubtasks: searchParams.get('includeSubtasks') === 'true',
      limit: parseInt(searchParams.get('limit')) || 100,
      offset: parseInt(searchParams.get('offset')) || 0
    };

    const includeStats = searchParams.get('includeStats') === 'true';

    const result = await getTodosByUser(session.user.id, filters);

    // Optionally include stats
    let stats = null;
    if (includeStats) {
      stats = await getTodoStats(session.user.id);
    }

    return NextResponse.json({
      todos: result.todos,
      total: result.total,
      stats
    });
  } catch (error) {
    console.error('GET /api/todos error:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

/**
 * POST /api/todos - Create a new todo
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, dueDate, tags, parentId } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (title.length > 500) {
      return NextResponse.json({ error: 'Title must be 500 characters or less' }, { status: 400 });
    }

    const todo = await createTodo(session.user.id, {
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
      parentId: parentId || null
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('POST /api/todos error:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
