'use client';

/**
 * LiveProgress Component
 *
 * Real-time execution progress display with per-test status.
 */

import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Circle,
  Loader2,
  Clock,
  AlertTriangle
} from 'lucide-react';

const STATUS_CONFIG = {
  idle: {
    icon: Circle,
    color: 'text-slate-400',
    bgColor: 'bg-slate-700',
    label: 'Idle'
  },
  starting: {
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    label: 'Starting',
    animate: true
  },
  booting: {
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    label: 'Booting WebContainer',
    animate: true
  },
  mounting: {
    icon: Loader2,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    label: 'Mounting Files',
    animate: true
  },
  installing: {
    icon: Loader2,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    label: 'Installing Dependencies',
    animate: true
  },
  running: {
    icon: Play,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Running Tests'
  },
  complete: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Complete'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    label: 'Failed'
  },
  cancelled: {
    icon: Square,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: 'Cancelled'
  }
};

const TEST_STATUS_ICONS = {
  pending: { icon: Circle, color: 'text-slate-500' },
  running: { icon: Loader2, color: 'text-blue-400', animate: true },
  passed: { icon: CheckCircle, color: 'text-green-400' },
  failed: { icon: XCircle, color: 'text-red-400' },
  skipped: { icon: Circle, color: 'text-yellow-400' }
};

export default function LiveProgress({
  executionId,
  status = 'idle',
  results = [],
  totalTests = 0,
  currentTest = null,
  startTime = null,
  onCancel
}) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time
  useEffect(() => {
    if (!startTime || ['complete', 'failed', 'cancelled'].includes(status)) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  // Calculate progress
  const completedTests = results.filter(r =>
    ['passed', 'failed', 'skipped'].includes(r.status)
  ).length;
  const passedTests = results.filter(r => r.status === 'passed').length;
  const failedTests = results.filter(r => r.status === 'failed').length;
  const progressPercent = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Get status config
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const StatusIcon = statusConfig.icon;

  const isRunning = ['starting', 'booting', 'mounting', 'installing', 'running'].includes(status);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <StatusIcon
                className={`w-5 h-5 ${statusConfig.color} ${statusConfig.animate ? 'animate-spin' : ''}`}
              />
            </div>
            <div>
              <h3 className="text-white font-medium">{statusConfig.label}</h3>
              {currentTest && isRunning && (
                <p className="text-sm text-slate-400 truncate max-w-xs">
                  {currentTest}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            {startTime && (
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
              </div>
            )}

            {/* Cancel Button */}
            {isRunning && onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progress</span>
          <span className="text-sm text-slate-300">
            {completedTests} / {totalTests} tests
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-3 border-b border-slate-700 flex gap-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-slate-300">{passedTests} passed</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-slate-300">{failedTests} failed</span>
        </div>
        {totalTests - completedTests > 0 && isRunning && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-sm text-slate-300">
              {totalTests - completedTests} remaining
            </span>
          </div>
        )}
      </div>

      {/* Test List */}
      <div className="max-h-64 overflow-y-auto">
        {results.length === 0 && isRunning && (
          <div className="p-4 text-center text-slate-500 text-sm">
            Waiting for test results...
          </div>
        )}

        {results.length === 0 && !isRunning && status === 'idle' && (
          <div className="p-4 text-center text-slate-500 text-sm">
            No tests executed yet
          </div>
        )}

        {results.map((result, idx) => {
          const testStatus = TEST_STATUS_ICONS[result.status] || TEST_STATUS_ICONS.pending;
          const TestIcon = testStatus.icon;

          return (
            <div
              key={result.id || idx}
              className={`
                flex items-center gap-3 px-4 py-2 border-b border-slate-700/50
                ${result.status === 'failed' ? 'bg-red-500/5' : ''}
              `}
            >
              <TestIcon
                className={`w-4 h-4 ${testStatus.color} ${testStatus.animate ? 'animate-spin' : ''} flex-shrink-0`}
              />
              <span className="text-sm text-slate-300 flex-1 truncate">
                {result.name}
              </span>
              {result.duration && (
                <span className="text-xs text-slate-500 font-mono">
                  {result.duration}ms
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {status === 'failed' && (
        <div className="p-4 border-t border-slate-700 bg-red-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-400 font-medium">Execution Failed</p>
              <p className="text-xs text-red-400/70 mt-1">
                Check the logs for more details
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Complete Summary */}
      {status === 'complete' && (
        <div className="p-4 border-t border-slate-700 bg-green-500/5">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm text-green-400">
              All tests completed in {formatTime(elapsedTime)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
