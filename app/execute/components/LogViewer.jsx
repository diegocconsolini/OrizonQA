'use client';

/**
 * LogViewer Component
 *
 * Terminal-style log output with auto-scroll and filtering.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Trash2,
  ArrowDown,
  Pause,
  Play
} from 'lucide-react';

// Log level colors
const LOG_COLORS = {
  info: 'text-slate-300',
  success: 'text-green-400',
  error: 'text-red-400',
  warn: 'text-yellow-400',
  debug: 'text-slate-500',
  stdout: 'text-slate-300',
  stderr: 'text-red-400'
};

// Patterns to detect log types
const LOG_PATTERNS = [
  { pattern: /PASS/i, type: 'success' },
  { pattern: /FAIL/i, type: 'error' },
  { pattern: /error/i, type: 'error' },
  { pattern: /warn/i, type: 'warn' },
  { pattern: /✓|✔|passed/i, type: 'success' },
  { pattern: /✗|✘|failed/i, type: 'error' },
  { pattern: /npm ERR!/i, type: 'error' },
  { pattern: /npm WARN/i, type: 'warn' }
];

function detectLogType(message) {
  for (const { pattern, type } of LOG_PATTERNS) {
    if (pattern.test(message)) {
      return type;
    }
  }
  return 'info';
}

function formatTimestamp(date) {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default function LogViewer({
  logs = [],
  autoScroll: initialAutoScroll = true,
  showTimestamps = true,
  maxHeight = '400px'
}) {
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Detect when user scrolls up (disable auto-scroll)
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    }
  };

  // Copy all logs to clipboard
  const copyLogs = async () => {
    const text = logs.map(log => {
      const timestamp = showTimestamps ? `[${formatTimestamp(new Date(log.timestamp))}] ` : '';
      return `${timestamp}${log.message}`;
    }).join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    setAutoScroll(true);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-slate-700 bg-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300 font-medium">Output</span>
          <span className="text-xs text-slate-500">({logs.length} lines)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`
              p-1.5 rounded transition-colors
              ${autoScroll
                ? 'bg-primary/20 text-primary'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
              }
            `}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            {autoScroll ? (
              <Play className="w-3.5 h-3.5" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Scroll to bottom */}
          <button
            onClick={scrollToBottom}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          {/* Copy logs */}
          <button
            onClick={copyLogs}
            disabled={logs.length === 0}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            title="Copy logs"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto font-mono text-xs leading-relaxed"
        style={{ maxHeight }}
      >
        {logs.length === 0 ? (
          <div className="p-4 text-slate-600 text-center">
            Waiting for output...
          </div>
        ) : (
          <div className="p-3 space-y-0.5">
            {logs.map((log, idx) => {
              const logType = log.type || detectLogType(log.message);
              const colorClass = LOG_COLORS[logType] || LOG_COLORS.info;

              return (
                <div key={log.id || idx} className="flex gap-2 hover:bg-slate-800/50 px-1 -mx-1 rounded">
                  {/* Timestamp */}
                  {showTimestamps && log.timestamp && (
                    <span className="text-slate-600 flex-shrink-0">
                      [{formatTimestamp(new Date(log.timestamp))}]
                    </span>
                  )}

                  {/* Message */}
                  <span className={`${colorClass} whitespace-pre-wrap break-all`}>
                    {log.message}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && logs.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-2 text-xs text-primary hover:text-primary/80"
          >
            <ArrowDown className="w-3 h-3" />
            New output available - click to scroll down
          </button>
        </div>
      )}
    </div>
  );
}
