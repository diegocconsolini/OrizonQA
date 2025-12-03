'use client';

import { useMemo } from 'react';
import { Loader2, CheckCircle2, Circle, Sparkles, AlertCircle } from 'lucide-react';

/**
 * Analysis Progress Component
 *
 * Shows real-time progress during multi-pass analysis:
 * - Current phase (analyzing/synthesizing)
 * - Progress through chunks
 * - Files being analyzed in current chunk
 * - Time elapsed
 */
export default function AnalysisProgress({
  progress = null,
  startTime = null,
  error = null
}) {
  // Calculate elapsed time
  const elapsed = useMemo(() => {
    if (!startTime) return null;
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, [startTime]);

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-red-300 font-medium">Analysis Failed</p>
            <p className="text-red-400/70 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Preparing analysis...</span>
        </div>
      </div>
    );
  }

  const { phase, current, total, message, files, chunkIndex } = progress;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = phase === 'complete';
  const isSynthesizing = phase === 'synthesizing';

  // Generate step list for multi-pass
  const steps = useMemo(() => {
    if (total <= 1) return null;

    const stepList = [];
    for (let i = 1; i <= total; i++) {
      const isLast = i === total;
      const isCurrent = i === current;
      const isDone = i < current;

      stepList.push({
        index: i,
        label: isLast ? 'Synthesize' : `Pass ${i}`,
        status: isDone ? 'done' : isCurrent ? 'active' : 'pending'
      });
    }
    return stepList;
  }, [current, total]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : isSynthesizing ? (
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          ) : (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          )}
          <span className="text-white font-medium">
            {isComplete ? 'Analysis Complete' : 'Analyzing Repository...'}
          </span>
        </div>
        {elapsed && (
          <span className="text-slate-400 text-sm">{elapsed}</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isComplete
                ? 'bg-green-500'
                : isSynthesizing
                ? 'bg-purple-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-slate-400">{message || 'Processing...'}</span>
          <span className="text-slate-500">{percentage}%</span>
        </div>
      </div>

      {/* Step Indicators (for multi-pass) */}
      {steps && steps.length > 1 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {step.status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : step.status === 'active' ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
                <span
                  className={`text-xs ${
                    step.status === 'done'
                      ? 'text-green-400'
                      : step.status === 'active'
                      ? 'text-blue-400'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <span className="text-slate-600 mx-1">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Files (during chunk analysis) */}
      {files && files.length > 0 && !isComplete && !isSynthesizing && (
        <div className="border-t border-slate-700 px-4 py-3 bg-slate-800/50">
          <p className="text-slate-500 text-xs mb-2">
            Analyzing {files.length} files in this batch:
          </p>
          <div className="flex flex-wrap gap-1">
            {files.slice(0, 8).map((file, idx) => (
              <span
                key={idx}
                className="bg-slate-700/50 text-slate-400 text-xs px-2 py-0.5 rounded"
              >
                {file.split('/').pop()}
              </span>
            ))}
            {files.length > 8 && (
              <span className="text-slate-500 text-xs px-2 py-0.5">
                +{files.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Synthesis Phase */}
      {isSynthesizing && (
        <div className="border-t border-slate-700 px-4 py-3 bg-purple-900/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm">
              Combining results from all batches...
            </span>
          </div>
        </div>
      )}

      {/* Complete */}
      {isComplete && (
        <div className="border-t border-slate-700 px-4 py-3 bg-green-900/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm">
              All files analyzed successfully!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
