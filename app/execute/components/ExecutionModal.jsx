'use client';

import { useRef, useEffect } from 'react';
import {
  X, CheckCircle2, XCircle, Loader2, Terminal,
  Clock, AlertTriangle, ExternalLink, Copy
} from 'lucide-react';
import { ExecutionStatus, formatElapsed } from '@/app/hooks/useTestExecution';

/**
 * Execution Modal
 *
 * Shows real-time test execution progress, console output, and results.
 *
 * @param {object} execution - Execution state from useTestExecution hook
 * @param {function} onClose - Close handler
 */
export default function ExecutionModal({ execution, onClose }) {
  const {
    status,
    executionId,
    output,
    results,
    error,
    progress,
    framework,
    isRunning,
    cancel
  } = execution;

  const outputRef = useRef(null);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <StatusIcon status={status} />
            <div>
              <h3 className="text-lg font-semibold text-white">
                Test Execution
                {executionId && <span className="text-slate-500 font-normal ml-2">#{executionId}</span>}
              </h3>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <span>{progress.phase || getStatusMessage(status)}</span>
                {framework && (
                  <span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">
                    {framework}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {progress.elapsed > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{formatElapsed(progress.elapsed)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Results Summary */}
          {results?.summary && (
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Total" value={results.summary.total} color="blue" />
              <StatCard label="Passed" value={results.summary.passed} color="green" />
              <StatCard label="Failed" value={results.summary.failed} color="red" />
              <StatCard label="Skipped" value={results.summary.skipped} color="yellow" />
            </div>
          )}

          {/* Progress Indicator (while running) */}
          {isRunning && (
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <div>
                <p className="text-blue-400 font-medium">{progress.phase || 'Processing...'}</p>
                <p className="text-sm text-blue-300/70">
                  {status === 'installing' ? 'This may take a moment...' : 'Please wait...'}
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-red-400 font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Execution Failed</span>
              </div>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Console Output */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Console Output</span>
              </div>
              <button
                onClick={handleCopyOutput}
                className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                title="Copy output"
              >
                <Copy className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <pre
              ref={outputRef}
              className="p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto"
            >
              {output || 'Waiting for output...'}
            </pre>
          </div>

          {/* Test Results List */}
          {results?.tests && results.tests.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-400 flex items-center justify-between">
                <span>Test Results ({results.tests.length})</span>
                {results.summary && (
                  <span className={results.summary.failed > 0 ? 'text-red-400' : 'text-green-400'}>
                    {Math.round((results.summary.passed / results.summary.total) * 100)}% passed
                  </span>
                )}
              </h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {results.tests.map((test, i) => (
                  <TestResultRow key={i} test={test} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={cancel}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              >
                Cancel
              </button>
            ) : executionId ? (
              <a
                href={`/execute/${executionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Details</span>
              </a>
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
          >
            {isRunning ? 'Run in Background' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  const baseClass = 'w-8 h-8';

  switch (status) {
    case ExecutionStatus.COMPLETE:
      return (
        <div className="p-2 bg-green-500/20 rounded-full">
          <CheckCircle2 className={`${baseClass} text-green-400`} />
        </div>
      );
    case ExecutionStatus.FAILED:
      return (
        <div className="p-2 bg-red-500/20 rounded-full">
          <XCircle className={`${baseClass} text-red-400`} />
        </div>
      );
    case ExecutionStatus.CANCELLED:
      return (
        <div className="p-2 bg-yellow-500/20 rounded-full">
          <AlertTriangle className={`${baseClass} text-yellow-400`} />
        </div>
      );
    default:
      return (
        <div className="p-2 bg-blue-500/20 rounded-full">
          <Loader2 className={`${baseClass} text-blue-400 animate-spin`} />
        </div>
      );
  }
}

function getStatusMessage(status) {
  switch (status) {
    case ExecutionStatus.BOOTING: return 'Starting WebContainer...';
    case ExecutionStatus.MOUNTING: return 'Setting up test files...';
    case ExecutionStatus.INSTALLING: return 'Installing dependencies...';
    case ExecutionStatus.RUNNING: return 'Running tests...';
    case ExecutionStatus.COMPLETE: return 'Execution complete';
    case ExecutionStatus.FAILED: return 'Execution failed';
    case ExecutionStatus.CANCELLED: return 'Execution cancelled';
    default: return 'Preparing...';
  }
}

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-70">{label}</div>
    </div>
  );
}

function TestResultRow({ test }) {
  const statusStyles = {
    passed: {
      icon: '✓',
      color: 'text-green-400',
      bg: ''
    },
    failed: {
      icon: '✗',
      color: 'text-red-400',
      bg: 'bg-red-500/5'
    },
    skipped: {
      icon: '○',
      color: 'text-yellow-400',
      bg: ''
    }
  };

  const style = statusStyles[test.status] || statusStyles.skipped;

  return (
    <div className={`p-3 rounded-lg ${style.bg || 'bg-slate-800/50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`${style.color} shrink-0`}>{style.icon}</span>
          <span className="text-sm text-slate-300 truncate">{test.name}</span>
          {test.suite && (
            <span className="text-xs text-slate-500 truncate hidden sm:inline">
              ({test.suite})
            </span>
          )}
        </div>
        {test.duration > 0 && (
          <span className="text-xs text-slate-500 shrink-0 ml-2">{test.duration}ms</span>
        )}
      </div>

      {test.errorMessage && (
        <pre className="mt-2 p-2 text-xs text-red-300 bg-red-500/10 rounded overflow-x-auto max-h-32">
          {test.errorMessage}
        </pre>
      )}
    </div>
  );
}
