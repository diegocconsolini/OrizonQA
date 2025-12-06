/**
 * Todo Tools Handler
 *
 * Handles todo list management operations.
 */

import {
  getTodos,
  getTodo,
  createTodo as dbCreateTodo,
  updateTodo as dbUpdateTodo,
  deleteTodo as dbDeleteTodo,
} from '@/lib/db-todos.js';

/**
 * Execute a todo tool
 */
export async function executeTodoTool(toolName, input, context) {
  const { userId } = context;

  try {
    switch (toolName) {
      case 'list_todos':
        return await listTodos(input, userId);
      case 'get_todo':
        return await getTodoDetails(input.id, userId);
      case 'create_todo':
        return await createTodo(input, userId);
      case 'update_todo':
        return await updateTodo(input.id, input.updates, userId);
      case 'complete_todo':
        return await completeTodo(input.id, userId);
      case 'delete_todo':
        return await deleteTodo(input.id, userId);
      default:
        return { success: false, error: `Unknown todo tool: ${toolName}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function listTodos(input, userId) {
  const { status, priority, search, page = 1, limit = 50 } = input;
  const result = await getTodos(userId, { status, priority, search, page, limit });

  return {
    success: true,
    data: {
      todos: result.todos.map(formatTodo),
      pagination: { page: result.page, limit: result.limit, total: result.total },
    },
  };
}

async function getTodoDetails(todoId, userId) {
  const todo = await getTodo(todoId, userId);
  if (!todo) return { success: false, error: 'Todo not found', statusCode: 404 };
  return { success: true, data: { todo: formatTodo(todo) } };
}

async function createTodo(input, userId) {
  const { title, description, priority = 'medium', dueDate, tags = [] } = input;
  const todo = await dbCreateTodo({ userId, title, description, priority, dueDate, tags });

  return {
    success: true,
    data: { message: 'Todo created', todo: formatTodo(todo) },
    action: { type: 'TODO_CREATED', payload: { todoId: todo.id } },
  };
}

async function updateTodo(todoId, updates, userId) {
  const todo = await dbUpdateTodo(todoId, updates, userId);
  if (!todo) return { success: false, error: 'Todo not found', statusCode: 404 };

  return {
    success: true,
    data: { message: 'Todo updated', todo: formatTodo(todo) },
    action: { type: 'TODO_UPDATED', payload: { todoId: todo.id } },
  };
}

async function completeTodo(todoId, userId) {
  const todo = await dbUpdateTodo(todoId, { status: 'completed', completedAt: new Date() }, userId);
  if (!todo) return { success: false, error: 'Todo not found', statusCode: 404 };

  return {
    success: true,
    data: { message: 'Todo completed', todo: formatTodo(todo) },
    action: { type: 'TODO_COMPLETED', payload: { todoId: todo.id } },
  };
}

async function deleteTodo(todoId, userId) {
  const success = await dbDeleteTodo(todoId, userId);
  if (!success) return { success: false, error: 'Todo not found', statusCode: 404 };

  return {
    success: true,
    data: { message: 'Todo deleted', todoId },
    action: { type: 'TODO_DELETED', payload: { todoId } },
  };
}

function formatTodo(todo) {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    status: todo.status,
    priority: todo.priority,
    dueDate: todo.due_date,
    tags: todo.tags,
    createdAt: todo.created_at,
    completedAt: todo.completed_at,
  };
}

export default { executeTodoTool };
