'use client';

/**
 * FailureDetails Component
 *
 * Detailed view of a test failure with error message,
 * stack trace, and expected vs actual diff.
 */

import { useState } from 'react';
import {
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Code,
  RefreshCw
} from 'lucide-react';

export default function FailureDetails({
  failure,
  onRerun
}) {
  const [copied, setCopied] = useState(false);
  const [showStackTrace, setShowStackTrace] = useState(false);

  if (!failure) {
    return null;
  }

  const {
    name,
    fullName,
    error,
    expected,
    actual,
    stackTrace,
    duration
  } = failure;

  // Copy error to clipboard
  const copyError = async () => {
    const text = [
      `Test: ${fullName || name}`,
      `Error: ${error}`,
      expected ? `Expected: ${expected}` : null,
      actual ? `Actual: ${actual}` : null,
      stackTrace ? `\nStack Trace:\n${stackTrace}` : null
    ].filter(Boolean).join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if we have expected vs actual values
  const hasDiff = expected !== undefined && actual !== undefined;

  return (
    <div className="bg-slate-800 border border-red-500/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-red-500/5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium">{name}</h3>
              {fullName && fullName !== name && (
                <p className="text-xs text-slate-500 font-mono mt-1">{fullName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {duration !== undefined && (
              <span className="text-xs text-slate-500 font-mono">{duration}ms</span>
            )}

            <button
              onClick={copyError}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Copy error"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {onRerun && (
              <button
                onClick={() => onRerun(failure)}
                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Re-run this test"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-400 font-medium mb-1">Error Message</p>
            <p className="text-sm text-red-400/80 font-mono whitespace-pre-wrap bg-red-500/10 p-3 rounded-lg">
              {error || 'No error message available'}
            </p>
          </div>
        </div>

        {/* Expected vs Actual Diff */}
        {hasDiff && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-400 font-medium">Assertion Diff</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Expected */}
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                <p className="text-xs text-green-400 font-medium mb-2">Expected</p>
                <pre className="text-sm text-green-400/80 font-mono whitespace-pre-wrap overflow-x-auto">
                  {typeof expected === 'object'
                    ? JSON.stringify(expected, null, 2)
                    : String(expected)
                  }
                </pre>
              </div>

              {/* Actual */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-400 font-medium mb-2">Actual</p>
                <pre className="text-sm text-red-400/80 font-mono whitespace-pre-wrap overflow-x-auto">
                  {typeof actual === 'object'
                    ? JSON.stringify(actual, null, 2)
                    : String(actual)
                  }
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Stack Trace */}
        {stackTrace && (
          <div>
            <button
              onClick={() => setShowStackTrace(!showStackTrace)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-2"
            >
              {showStackTrace ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Stack Trace
            </button>

            {showStackTrace && (
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap">
                  {stackTrace.split('\n').map((line, idx) => {
                    // Highlight lines that look like file references
                    const isFileLine = /at\s+.+\(/.test(line) || /^\s+at\s/.test(line);
                    const isErrorLine = /Error:|error:/i.test(line);

                    return (
                      <div
                        key={idx}
                        className={`
                          ${isErrorLine ? 'text-red-400' : ''}
                          ${isFileLine && !isErrorLine ? 'text-slate-500' : ''}
                        `}
                      >
                        {line}
                      </div>
                    );
                  })}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={copyError}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Error'}
        </button>

        {onRerun && (
          <button
            onClick={() => onRerun(failure)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-sm rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Re-run Test
          </button>
        )}
      </div>
    </div>
  );
}
