'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  MoreHorizontal,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Plus,
  AlertCircle
} from 'lucide-react';

const priorityColors = {
  high: 'text-red-400 bg-red-500/10 border-red-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-green-400 bg-green-500/10 border-green-500/30'
};

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2
};

export default function TodoItem({
  todo,
  onToggle,
  onUpdate,
  onDelete,
  onAddSubtask,
  showSubtasks = true,
  depth = 0
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [showMenu, setShowMenu] = useState(false);

  const StatusIcon = statusIcons[todo.status] || Circle;
  const isCompleted = todo.status === 'completed';
  const hasSubtasks = parseInt(todo.subtask_count) > 0;
  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !isCompleted;

  const handleToggle = () => {
    onToggle?.(todo.id);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      onUpdate?.(todo.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    return d.toLocaleDateString();
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-slate-700 pl-4' : ''}`}>
      <div
        className={`
          group flex items-center gap-3 p-3 rounded-lg
          ${isCompleted ? 'bg-slate-800/30' : 'bg-slate-800/50 hover:bg-slate-800'}
          border border-slate-700/50 transition-all
        `}
      >
        {/* Expand/Collapse for subtasks */}
        {showSubtasks && hasSubtasks ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Status Toggle */}
        <button
          onClick={handleToggle}
          className={`
            flex-shrink-0 transition-colors
            ${isCompleted ? 'text-green-400' : 'text-slate-400 hover:text-slate-300'}
          `}
        >
          <StatusIcon className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className={`
                block truncate
                ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}
              `}
            >
              {todo.title}
            </span>
          )}

          {/* Subtask progress */}
          {hasSubtasks && (
            <span className="text-xs text-slate-500">
              {todo.completed_subtask_count}/{todo.subtask_count} subtasks
            </span>
          )}
        </div>

        {/* Priority Badge */}
        <span
          className={`
            px-2 py-0.5 text-xs rounded-full border
            ${priorityColors[todo.priority]}
          `}
        >
          {todo.priority}
        </span>

        {/* Due Date */}
        {todo.due_date && (
          <span
            className={`
              flex items-center gap-1 text-xs
              ${isOverdue ? 'text-red-400' : 'text-slate-400'}
            `}
          >
            {isOverdue && <AlertCircle className="w-3 h-3" />}
            {formatDate(todo.due_date)}
          </span>
        )}

        {/* Tags */}
        {todo.tags && todo.tags.length > 0 && (
          <div className="hidden sm:flex gap-1">
            {todo.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-xs bg-slate-700 text-slate-300 rounded"
              >
                {tag}
              </span>
            ))}
            {todo.tags.length > 2 && (
              <span className="text-xs text-slate-500">+{todo.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-700 rounded transition-all"
          >
            <MoreHorizontal className="w-4 h-4 text-slate-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[140px]">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                {onAddSubtask && (
                  <button
                    onClick={() => {
                      onAddSubtask(todo.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Subtask
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete?.(todo.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {showSubtasks && isExpanded && todo.subtasks && (
        <div className="mt-2 space-y-2">
          {todo.subtasks.map((subtask) => (
            <TodoItem
              key={subtask.id}
              todo={subtask}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              depth={depth + 1}
              showSubtasks={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
