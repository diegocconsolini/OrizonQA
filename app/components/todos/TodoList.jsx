'use client';

import { useState } from 'react';
import { ListTodo, Plus, Loader2 } from 'lucide-react';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';
import TodoFilters from './TodoFilters';
import TodoStats from './TodoStats';

export default function TodoList({
  todos,
  stats,
  loading,
  error,
  filters,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
  onToggleStatus,
  onFilterChange,
  onClearFilters
}) {
  const [showForm, setShowForm] = useState(false);
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null);

  const handleCreateTodo = async (data) => {
    await onCreateTodo(data);
    setShowForm(false);
    setAddingSubtaskFor(null);
  };

  const handleAddSubtask = (parentId) => {
    setAddingSubtaskFor(parentId);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <TodoStats stats={stats} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          My Todos
        </h2>
        <button
          onClick={() => {
            setShowForm(true);
            setAddingSubtaskFor(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Todo
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <TodoForm
          onSubmit={handleCreateTodo}
          onCancel={() => {
            setShowForm(false);
            setAddingSubtaskFor(null);
          }}
          parentId={addingSubtaskFor}
        />
      )}

      {/* Filters */}
      <TodoFilters
        filters={filters}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        stats={stats}
      />

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && todos.length === 0 && (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <ListTodo className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            {filters.status || filters.priority || filters.search
              ? 'No todos match your filters'
              : 'No todos yet'
            }
          </h3>
          <p className="text-slate-500 mb-4">
            {filters.status || filters.priority || filters.search
              ? 'Try adjusting your filters or search query'
              : 'Create your first todo to get started'
            }
          </p>
          {!filters.status && !filters.priority && !filters.search && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Todo
            </button>
          )}
        </div>
      )}

      {/* Todo List */}
      {!loading && todos.length > 0 && (
        <div className="space-y-2">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggleStatus}
              onUpdate={onUpdateTodo}
              onDelete={onDeleteTodo}
              onAddSubtask={handleAddSubtask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
