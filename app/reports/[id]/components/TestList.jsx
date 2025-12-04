'use client';

/**
 * TestList Component
 *
 * Expandable list of test results with filtering and sorting.
 */

import { useState, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  Clock,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

const STATUS_CONFIG = {
  passed: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    label: 'Passed'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    label: 'Failed'
  },
  skipped: {
    icon: Circle,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    label: 'Skipped'
  },
  pending: {
    icon: Circle,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    label: 'Pending'
  }
};

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'duration', label: 'Duration' },
  { value: 'status', label: 'Status' }
];

export default function TestList({
  tests = [],
  filter = 'all',
  onFilterChange,
  onTestClick
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTests, setExpandedTests] = useState(new Set());
  const [sortBy, setSortBy] = useState('status');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter tests
  const filteredTests = useMemo(() => {
    let result = [...tests];

    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(t => t.status === filter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name?.toLowerCase().includes(query) ||
        t.fullName?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case 'status':
          const statusOrder = { failed: 0, skipped: 1, pending: 2, passed: 3 };
          comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tests, filter, searchQuery, sortBy, sortOrder]);

  // Toggle test expansion
  const toggleExpanded = (testId) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  // Toggle sort order
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get counts
  const counts = useMemo(() => ({
    all: tests.length,
    passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length,
    skipped: tests.filter(t => t.status === 'skipped').length
  }), [tests]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Test Results</h3>
          <span className="text-sm text-slate-400">
            {filteredTests.length} of {tests.length} tests
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          {['all', 'passed', 'failed', 'skipped'].map(status => (
            <button
              key={status}
              onClick={() => onFilterChange?.(status)}
              className={`
                px-3 py-1.5 text-sm rounded-lg transition-colors
                ${filter === status
                  ? 'bg-primary/20 text-primary'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
                }
              `}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">
                ({counts[status]})
              </span>
            </button>
          ))}
        </div>

        {/* Search and Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none px-3 py-2 pr-8 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-400 hover:text-white"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Test List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredTests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No tests match your criteria
          </div>
        ) : (
          filteredTests.map((test, idx) => {
            const config = STATUS_CONFIG[test.status] || STATUS_CONFIG.pending;
            const StatusIcon = config.icon;
            const isExpanded = expandedTests.has(test.id || idx);

            return (
              <div
                key={test.id || idx}
                className={`border-b border-slate-700/50 last:border-b-0 ${config.bgColor}`}
              >
                {/* Test Row */}
                <div
                  onClick={() => toggleExpanded(test.id || idx)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/30"
                >
                  {/* Expand Icon */}
                  {(test.error || test.stackTrace) ? (
                    isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )
                  ) : (
                    <div className="w-4" />
                  )}

                  {/* Status Icon */}
                  <StatusIcon className={`w-4 h-4 ${config.color} flex-shrink-0`} />

                  {/* Test Name */}
                  <span className="text-sm text-slate-300 flex-1 truncate">
                    {test.name || test.fullName || `Test ${idx + 1}`}
                  </span>

                  {/* Duration */}
                  {test.duration !== undefined && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                      <Clock className="w-3 h-3" />
                      {test.duration}ms
                    </span>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (test.error || test.stackTrace || test.fullName) && (
                  <div className="px-4 pb-3 ml-8">
                    {test.fullName && test.fullName !== test.name && (
                      <p className="text-xs text-slate-500 mb-2 font-mono">
                        {test.fullName}
                      </p>
                    )}

                    {test.error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-2">
                        <p className="text-sm text-red-400 font-medium mb-1">Error</p>
                        <p className="text-xs text-red-400/80 font-mono whitespace-pre-wrap">
                          {test.error}
                        </p>
                      </div>
                    )}

                    {test.stackTrace && (
                      <details className="text-xs">
                        <summary className="text-slate-500 cursor-pointer hover:text-slate-300">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 p-2 bg-slate-900 rounded text-slate-400 overflow-x-auto whitespace-pre-wrap">
                          {test.stackTrace}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
