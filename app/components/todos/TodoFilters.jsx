'use client';

import { Search, X, Filter } from 'lucide-react';

export default function TodoFilters({
  filters,
  onFilterChange,
  onClearFilters,
  stats
}) {
  const statusOptions = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const hasActiveFilters = filters.status || filters.priority || filters.search;

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange({ status: option.value || undefined })}
            className={`
              flex-1 px-4 py-2 text-sm rounded-md transition-colors
              ${(filters.status || '') === option.value
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-300'
              }
            `}
          >
            {option.label}
            {stats && option.value && (
              <span className="ml-1.5 text-xs opacity-70">
                ({stats[option.value] || 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Priority */}
      <div className="flex gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
            placeholder="Search todos..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: undefined })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={filters.priority || ''}
            onChange={(e) => onFilterChange({ priority: e.target.value || undefined })}
            className="appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-8 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
