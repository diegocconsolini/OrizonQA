'use client';

import { useState } from 'react';
import { Plus, X, Calendar, Tag, Flag } from 'lucide-react';

export default function TodoForm({
  onSubmit,
  onCancel,
  initialData = {},
  parentId = null,
  isCompact = false
}) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [priority, setPriority] = useState(initialData.priority || 'medium');
  const [dueDate, setDueDate] = useState(initialData.dueDate || '');
  const [tagsInput, setTagsInput] = useState(initialData.tags?.join(', ') || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueDate: dueDate || null,
        tags,
        parentId
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setTagsInput('');
      setShowAdvanced(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isCompact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          autoFocus
        />
      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Priority */}
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1">
          <Flag className="w-4 h-4 text-slate-400 ml-2" />
          {['low', 'medium', 'high'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`
                px-3 py-1 text-sm rounded-md capitalize transition-colors
                ${priority === p
                  ? p === 'high'
                    ? 'bg-red-500/20 text-red-400'
                    : p === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                  : 'text-slate-400 hover:text-slate-300'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-1">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-transparent text-slate-300 text-sm focus:outline-none"
          />
        </div>

        {/* Toggle Advanced */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-1 text-sm text-slate-400 hover:text-slate-300"
        >
          {showAdvanced ? 'Less options' : 'More options'}
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 mb-4 pt-4 border-t border-slate-700">
          {/* Description */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. work, urgent, project-x"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {initialData.id ? 'Update' : 'Add Todo'}
        </button>
      </div>
    </form>
  );
}
