'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

/**
 * Custom hook for managing todos with API persistence
 */
export function useTodos(options = {}) {
  const { autoFetch = true, initialFilters = {} } = options;

  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  /**
   * Fetch todos from API
   */
  const fetchTodos = useCallback(async (customFilters = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      const activeFilters = customFilters || filters;

      if (activeFilters.status) params.set('status', activeFilters.status);
      if (activeFilters.priority) params.set('priority', activeFilters.priority);
      if (activeFilters.tag) params.set('tag', activeFilters.tag);
      if (activeFilters.search) params.set('search', activeFilters.search);
      if (activeFilters.parentId) params.set('parentId', activeFilters.parentId);
      if (activeFilters.limit) params.set('limit', activeFilters.limit);
      if (activeFilters.offset) params.set('offset', activeFilters.offset);
      params.set('includeStats', 'true');

      const response = await fetch(`/api/todos?${params.toString()}`);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch todos');
      }

      const data = await response.json();
      setTodos(data.todos);
      setTotal(data.total);
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Create a new todo
   */
  const createTodo = useCallback(async (data) => {
    setError(null);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create todo');
      }

      const newTodo = await response.json();

      // Optimistic update
      setTodos(prev => [newTodo, ...prev]);
      setTotal(prev => prev + 1);

      // Update stats
      if (stats) {
        setStats(prev => ({
          ...prev,
          total: parseInt(prev.total) + 1,
          pending: parseInt(prev.pending) + 1
        }));
      }

      return newTodo;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [stats]);

  /**
   * Update a todo
   */
  const updateTodo = useCallback(async (id, updates) => {
    setError(null);

    // Optimistic update
    const previousTodos = [...todos];
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, ...updates } : todo
    ));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update todo');
      }

      const updatedTodo = await response.json();

      // Update with server response
      setTodos(prev => prev.map(todo =>
        todo.id === id ? updatedTodo : todo
      ));

      // Refetch stats if status changed
      if (updates.status) {
        fetchTodos();
      }

      return updatedTodo;
    } catch (err) {
      // Rollback on error
      setTodos(previousTodos);
      setError(err.message);
      throw err;
    }
  }, [todos, fetchTodos]);

  /**
   * Delete a todo
   */
  const deleteTodo = useCallback(async (id) => {
    setError(null);

    // Optimistic update
    const previousTodos = [...todos];
    const deletedTodo = todos.find(t => t.id === id);
    setTodos(prev => prev.filter(todo => todo.id !== id));
    setTotal(prev => prev - 1);

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete todo');
      }

      // Update stats
      if (stats && deletedTodo) {
        setStats(prev => ({
          ...prev,
          total: parseInt(prev.total) - 1,
          [deletedTodo.status]: parseInt(prev[deletedTodo.status]) - 1
        }));
      }

      return true;
    } catch (err) {
      // Rollback on error
      setTodos(previousTodos);
      setTotal(prev => prev + 1);
      setError(err.message);
      throw err;
    }
  }, [todos, stats]);

  /**
   * Toggle todo status (pending <-> completed)
   */
  const toggleStatus = useCallback(async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    return updateTodo(id, { status: newStatus });
  }, [todos, updateTodo]);

  /**
   * Reorder todos (for drag and drop)
   */
  const reorderTodos = useCallback(async (startIndex, endIndex) => {
    if (startIndex === endIndex) return;

    // Optimistic update
    const previousTodos = [...todos];
    const reordered = [...todos];
    const [removed] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, removed);
    setTodos(reordered);

    try {
      const todoIds = reordered.map(t => t.id);
      const response = await fetch('/api/todos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', todoIds })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder todos');
      }
    } catch (err) {
      // Rollback on error
      setTodos(previousTodos);
      setError(err.message);
    }
  }, [todos]);

  /**
   * Bulk update status
   */
  const bulkUpdateStatus = useCallback(async (todoIds, status) => {
    setError(null);

    try {
      const response = await fetch('/api/todos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', todoIds, status })
      });

      if (!response.ok) {
        throw new Error('Failed to update todos');
      }

      // Refetch to get updated data
      await fetchTodos();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchTodos]);

  /**
   * Bulk delete
   */
  const bulkDelete = useCallback(async (todoIds) => {
    setError(null);

    try {
      const response = await fetch('/api/todos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', todoIds })
      });

      if (!response.ok) {
        throw new Error('Failed to delete todos');
      }

      // Refetch to get updated data
      await fetchTodos();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchTodos]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchTodos();
    }
  }, [autoFetch, filters, fetchTodos]);

  // Computed values
  const pendingTodos = useMemo(() =>
    todos.filter(t => t.status === 'pending'),
    [todos]
  );

  const inProgressTodos = useMemo(() =>
    todos.filter(t => t.status === 'in_progress'),
    [todos]
  );

  const completedTodos = useMemo(() =>
    todos.filter(t => t.status === 'completed'),
    [todos]
  );

  const overdueTodos = useMemo(() =>
    todos.filter(t =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== 'completed'
    ),
    [todos]
  );

  const todosByPriority = useMemo(() => ({
    high: todos.filter(t => t.priority === 'high'),
    medium: todos.filter(t => t.priority === 'medium'),
    low: todos.filter(t => t.priority === 'low')
  }), [todos]);

  return {
    // State
    todos,
    stats,
    total,
    loading,
    error,
    filters,

    // Actions
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleStatus,
    reorderTodos,
    bulkUpdateStatus,
    bulkDelete,
    updateFilters,
    clearFilters,

    // Computed
    pendingTodos,
    inProgressTodos,
    completedTodos,
    overdueTodos,
    todosByPriority
  };
}

export default useTodos;
