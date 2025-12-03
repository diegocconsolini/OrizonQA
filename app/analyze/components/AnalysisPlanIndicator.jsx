'use client';

import { useMemo } from 'react';
import { FileCode, Layers, Clock, DollarSign, CheckCircle2, ChevronRight } from 'lucide-react';
import { getAnalysisPlan } from '@/lib/contentPreparer';
import { estimateTime } from '@/lib/analysisOrchestrator';

// Average file size estimate when content isn't available
const AVG_FILE_SIZE = 5000; // ~5KB average
const CHUNK_SIZE = 80000;

/**
 * Estimate analysis plan from file paths only (before content is fetched)
 */
function estimatePlanFromPaths(filePaths) {
  const estimatedTotalSize = filePaths.length * AVG_FILE_SIZE;
  const estimatedChunks = Math.ceil(estimatedTotalSize / CHUNK_SIZE);
  const estimatedTokens = Math.ceil(estimatedTotalSize / 4);

  // Rough cost estimate (Claude Sonnet pricing)
  const inputCost = (estimatedTokens / 1000000) * 3.00;
  const outputCost = ((4000 * estimatedChunks) / 1000000) * 15.00;
  const totalCost = inputCost + outputCost;

  return {
    totalFiles: filePaths.length,
    totalSize: formatBytes(estimatedTotalSize),
    coverage: '100%',
    strategy: estimatedChunks > 1 ? 'multi' : 'single',
    passes: estimatedChunks > 1 ? estimatedChunks + 1 : 1,
    chunks: [],
    estimatedTokens,
    estimatedCost: `~$${totalCost.toFixed(2)}`,
    isEstimate: true
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Analysis Plan Indicator
 *
 * Shows user exactly what will happen before analysis starts:
 * - Total files and size
 * - Coverage (always 100%)
 * - Number of API passes
 * - Chunk breakdown
 * - Estimated cost and time
 *
 * Accepts either:
 * - files: Array of {path, content} objects (exact calculation)
 * - selectedFilePaths: Array of file path strings (estimate)
 */
export default function AnalysisPlanIndicator({ files = [], selectedFilePaths = [], config = {} }) {
  const plan = useMemo(() => {
    // If we have files with content, use exact calculation
    if (files && files.length > 0 && files[0]?.content !== undefined) {
      return getAnalysisPlan(files, config);
    }

    // If we only have paths, use estimates
    const paths = selectedFilePaths.length > 0 ? selectedFilePaths : files.map(f => f.path || f);
    if (paths.length === 0) return null;

    return estimatePlanFromPaths(paths);
  }, [files, selectedFilePaths, config]);

  const timeEstimate = useMemo(() => {
    if (!plan) return null;
    return estimateTime(plan.passes);
  }, [plan]);

  if (!plan || plan.totalFiles === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <p className="text-slate-400 text-sm">Select files to see analysis plan</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600 flex items-center justify-between">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Analysis Plan
        </h3>
        {plan.isEstimate && (
          <span className="text-xs text-slate-400 bg-slate-600/50 px-2 py-1 rounded">
            Estimated
          </span>
        )}
      </div>

      {/* Main Stats */}
      <div className="p-4 space-y-4">
        {/* Coverage Banner */}
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-300 font-medium">100% Coverage</p>
            <p className="text-green-400/70 text-sm">All {plan.totalFiles} files will be analyzed</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <FileCode className="w-4 h-4" />
              Files
            </div>
            <p className="text-white text-lg font-semibold">{plan.totalFiles}</p>
            <p className="text-slate-500 text-xs">{plan.totalSize}</p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Layers className="w-4 h-4" />
              API Passes
            </div>
            <p className="text-white text-lg font-semibold">{plan.passes}</p>
            <p className="text-slate-500 text-xs">
              {plan.strategy === 'single' ? 'Single pass' : `${plan.chunks.length} chunks + synthesis`}
            </p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Est. Time
            </div>
            <p className="text-white text-lg font-semibold">{timeEstimate?.formatted || '~15s'}</p>
            <p className="text-slate-500 text-xs">~{plan.estimatedTokens?.toLocaleString()} tokens</p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Est. Cost
            </div>
            <p className="text-white text-lg font-semibold">{plan.estimatedCost}</p>
            <p className="text-slate-500 text-xs">Claude Sonnet</p>
          </div>
        </div>

        {/* Chunk Details (for multi-pass) */}
        {plan.strategy === 'multi' && plan.chunks && plan.chunks.length > 0 && (
          <div className="mt-4">
            <p className="text-slate-400 text-sm mb-2">Batch Breakdown:</p>
            <div className="space-y-2">
              {plan.chunks.map((chunk, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm bg-slate-700/20 rounded px-3 py-2"
                >
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300">Pass {index + 1}:</span>
                  <span className="text-slate-400">{chunk.summary}</span>
                  <span className="text-slate-500 ml-auto">
                    {chunk.files} files ({chunk.sizeFormatted})
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm bg-slate-700/20 rounded px-3 py-2">
                <ChevronRight className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">Final:</span>
                <span className="text-slate-400">Synthesize all results</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cost Breakdown (expandable) */}
      {plan.costBreakdown && (
        <div className="border-t border-slate-700 px-4 py-3 bg-slate-800/50">
          <details className="group">
            <summary className="text-slate-400 text-sm cursor-pointer hover:text-slate-300 flex items-center gap-2">
              <span>Cost breakdown</span>
              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-2 text-sm space-y-1 text-slate-500">
              <p>Input: ~{plan.costBreakdown.inputTokens?.toLocaleString()} tokens (${plan.costBreakdown.inputCost})</p>
              <p>Output: ~{plan.costBreakdown.outputTokens?.toLocaleString()} tokens (${plan.costBreakdown.outputCost})</p>
              <p className="text-slate-400">Total: {plan.costBreakdown.totalTokens?.toLocaleString()} tokens ({plan.estimatedCost})</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
