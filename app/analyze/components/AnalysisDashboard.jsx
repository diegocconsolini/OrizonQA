'use client';

import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import CurrentActivity from './CurrentActivity';
import TokenUsageBar from './TokenUsageBar';
import ChunkProgress from './ChunkProgress';
import DataFlowLog from './DataFlowLog';
import { AnalysisStatus } from '@/app/hooks/useAnalysisStream';

/**
 * AnalysisDashboard
 *
 * Comprehensive real-time visibility into the analysis process.
 * Shows exactly what's happening at every moment.
 */
export default function AnalysisDashboard({
  status,
  plan,
  progress,
  chunks,
  currentActivity,
  tokenUsage,
  actualCost,
  timing,
  elapsedFormatted,
  dataFlow,
  error,
  onCancel
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDataFlow, setShowDataFlow] = useState(false);

  const isComplete = status === AnalysisStatus.COMPLETE;
  const isError = status === AnalysisStatus.ERROR;
  const isCancelled = status === AnalysisStatus.CANCELLED;

  // Status colors
  const getStatusColor = () => {
    if (isComplete) return 'border-green-500/50 bg-green-900/20';
    if (isError || isCancelled) return 'border-red-500/50 bg-red-900/20';
    return 'border-blue-500/50 bg-slate-800';
  };

  // Status text
  const getStatusText = () => {
    switch (status) {
      case AnalysisStatus.CONNECTING: return 'Connecting...';
      case AnalysisStatus.PLANNING: return 'Planning analysis...';
      case AnalysisStatus.ANALYZING: return `Analyzing chunk ${progress.current + 1} of ${chunks.length}`;
      case AnalysisStatus.SYNTHESIZING: return 'Synthesizing results...';
      case AnalysisStatus.COMPLETE: return 'Analysis Complete';
      case AnalysisStatus.ERROR: return 'Analysis Failed';
      case AnalysisStatus.CANCELLED: return 'Analysis Cancelled';
      default: return 'Preparing...';
    }
  };

  // Calculate overall percentage
  const getPercentage = () => {
    if (isComplete) return 100;
    if (!chunks.length) return 0;

    const totalSteps = plan?.strategy === 'multi' ? chunks.length + 1 : chunks.length;
    const completedChunks = chunks.filter(c => c.status === 'done').length;
    const isSynthesizing = status === AnalysisStatus.SYNTHESIZING;

    if (isSynthesizing) {
      return Math.round(((completedChunks + 0.5) / totalSteps) * 100);
    }
    return Math.round((completedChunks / totalSteps) * 100);
  };

  const percentage = getPercentage();

  return (
    <div className={`border rounded-lg overflow-hidden ${getStatusColor()} ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className={`w-2 h-2 rounded-full ${
            isComplete ? 'bg-green-400' :
            isError || isCancelled ? 'bg-red-400' :
            'bg-blue-400 animate-pulse'
          }`} />
          <span className="text-white font-medium">{getStatusText()}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Elapsed time */}
          <span className="text-slate-400 text-sm font-mono">{elapsedFormatted}</span>

          {/* Expand/collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Cancel button (only during analysis) */}
          {!isComplete && !isError && !isCancelled && onCancel && (
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-red-400 p-1 rounded"
              title="Cancel analysis"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main progress bar */}
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' :
              isError ? 'bg-red-500' :
              status === AnalysisStatus.SYNTHESIZING ? 'bg-purple-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-slate-400">{currentActivity?.message || 'Processing...'}</span>
          <span className="text-slate-500 font-mono">{percentage}%</span>
        </div>
      </div>

      {/* Dashboard content */}
      <div className={`p-4 space-y-4 ${isExpanded ? 'overflow-y-auto max-h-[calc(100vh-200px)]' : ''}`}>
        {/* Current Activity */}
        <CurrentActivity
          currentActivity={currentActivity}
          status={status}
          error={error}
        />

        {/* Token Usage */}
        <TokenUsageBar
          tokenUsage={tokenUsage}
          actualCost={actualCost}
          estimatedCost={plan?.estimatedCost}
          estimatedTokens={plan?.estimatedTokens}
        />

        {/* Chunk Progress */}
        {chunks.length > 0 && (
          <ChunkProgress
            chunks={chunks}
            status={status}
            plan={plan}
          />
        )}

        {/* Data Flow Log (expandable) */}
        <div className="border-t border-slate-700 pt-4">
          <button
            onClick={() => setShowDataFlow(!showDataFlow)}
            className="text-slate-400 text-sm hover:text-slate-300 flex items-center gap-2"
          >
            <span>{showDataFlow ? '- Hide' : '+ Show'} API Call Log ({dataFlow.length} events)</span>
          </button>

          {showDataFlow && (
            <div className="mt-3">
              <DataFlowLog dataFlow={dataFlow} />
            </div>
          )}
        </div>
      </div>

      {/* Summary footer (when complete) */}
      {isComplete && (
        <div className="border-t border-green-700/50 bg-green-900/30 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-300">
              {plan?.totalFiles} files analyzed in {elapsedFormatted}
            </span>
            <span className="text-green-400 font-mono">
              {tokenUsage.input?.toLocaleString()} in / {tokenUsage.output?.toLocaleString()} out tokens ({actualCost})
            </span>
          </div>
        </div>
      )}

      {/* Error footer */}
      {isError && (
        <div className="border-t border-red-700/50 bg-red-900/30 px-4 py-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
