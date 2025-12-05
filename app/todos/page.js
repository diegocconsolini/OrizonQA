'use client';

/**
 * Todos Page
 *
 * A persistent todo list that survives across browser sessions.
 *
 * Features:
 * - Create, edit, delete todos
 * - Mark as pending/in_progress/completed
 * - Priority levels (low/medium/high)
 * - Due dates with overdue highlighting
 * - Tags for organization
 * - Subtasks support
 * - Filter by status, priority, search
 * - Statistics overview
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AppLayout from '@/app/components/layout/AppLayout';
import { TodoList } from '@/app/components/todos';
import { useTodos } from '@/app/hooks/useTodos';
import { Loader2 } from 'lucide-react';

export default function TodosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    todos,
    stats,
    loading,
    error,
    filters,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleStatus,
    updateFilters,
    clearFilters
  } = useTodos({ autoFetch: !!session });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  return (
    <AppLayout>
      <div className="w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Todos</h1>
          <p className="text-text-secondary-dark">
            Keep track of your tasks. Your todos persist across sessions.
          </p>
        </div>

        {/* Todo List */}
        <TodoList
          todos={todos}
          stats={stats}
          loading={loading}
          error={error}
          filters={filters}
          onCreateTodo={createTodo}
          onUpdateTodo={updateTodo}
          onDeleteTodo={deleteTodo}
          onToggleStatus={toggleStatus}
          onFilterChange={updateFilters}
          onClearFilters={clearFilters}
        />
      </div>
    </AppLayout>
  );
}
