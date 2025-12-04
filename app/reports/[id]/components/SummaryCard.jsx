'use client';

/**
 * SummaryCard Component
 *
 * Displays execution summary statistics:
 * - Total/passed/failed/skipped counts
 * - Success rate
 * - Duration
 * - Framework badge
 */

import {
  CheckCircle,
  XCircle,
  Circle,
  Clock,
  Percent,
  Layers
} from 'lucide-react';

const FRAMEWORK_BADGES = {
  jest: { label: 'Jest', color: 'bg-red-500/20 text-red-400' },
  vitest: { label: 'Vitest', color: 'bg-yellow-500/20 text-yellow-400' },
  mocha: { label: 'Mocha', color: 'bg-amber-600/20 text-amber-500' },
  auto: { label: 'Auto', color: 'bg-slate-500/20 text-slate-400' }
};

export default function SummaryCard({ execution }) {
  if (!execution) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          <div className="h-16 bg-slate-700 rounded"></div>
          <div className="h-16 bg-slate-700 rounded"></div>
          <div className="h-16 bg-slate-700 rounded"></div>
          <div className="h-16 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  const {
    totalTests = 0,
    passedTests = 0,
    failedTests = 0,
    skippedTests = 0,
    duration = 0,
    framework = 'auto',
    startedAt,
    completedAt,
    status
  } = execution;

  // Calculate success rate
  const executedTests = passedTests + failedTests;
  const successRate = executedTests > 0
    ? Math.round((passedTests / executedTests) * 100)
    : 0;

  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Get status color
  const getStatusColor = () => {
    if (status === 'complete' && failedTests === 0) return 'border-green-500/30 bg-green-500/5';
    if (status === 'complete' && failedTests > 0) return 'border-yellow-500/30 bg-yellow-500/5';
    if (status === 'failed') return 'border-red-500/30 bg-red-500/5';
    return 'border-slate-700';
  };

  const frameworkBadge = FRAMEWORK_BADGES[framework] || FRAMEWORK_BADGES.auto;

  return (
    <div className={`bg-slate-800 border rounded-lg overflow-hidden ${getStatusColor()}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="text-white font-medium">Execution Summary</h3>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${frameworkBadge.color}`}>
          {frameworkBadge.label}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Total */}
          <div className="bg-slate-900/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-white">{totalTests}</p>
            <p className="text-xs text-slate-400 mt-1">Total Tests</p>
          </div>

          {/* Passed */}
          <div className="bg-slate-900/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-3xl font-bold text-green-400">{passedTests}</p>
            </div>
            <p className="text-xs text-slate-400 mt-1">Passed</p>
          </div>

          {/* Failed */}
          <div className="bg-slate-900/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <p className="text-3xl font-bold text-red-400">{failedTests}</p>
            </div>
            <p className="text-xs text-slate-400 mt-1">Failed</p>
          </div>

          {/* Skipped */}
          <div className="bg-slate-900/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Circle className="w-5 h-5 text-slate-400" />
              <p className="text-3xl font-bold text-slate-400">{skippedTests}</p>
            </div>
            <p className="text-xs text-slate-400 mt-1">Skipped</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Success Rate</span>
            <span className={`text-sm font-medium ${
              successRate >= 80 ? 'text-green-400' :
              successRate >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {successRate}%
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(passedTests / totalTests) * 100}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${(failedTests / totalTests) * 100}%` }}
              />
              <div
                className="bg-slate-500 transition-all"
                style={{ width: `${(skippedTests / totalTests) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">Duration:</span>
            <span className="text-white font-medium">{formatDuration(duration)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Percent className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">Pass Rate:</span>
            <span className={`font-medium ${
              successRate >= 80 ? 'text-green-400' :
              successRate >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {successRate}%
            </span>
          </div>
        </div>

        {/* Timestamps */}
        {(startedAt || completedAt) && (
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
            {startedAt && <p>Started: {formatDate(startedAt)}</p>}
            {completedAt && <p>Completed: {formatDate(completedAt)}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
