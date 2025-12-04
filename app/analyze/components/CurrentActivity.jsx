'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Zap, FileCode, Sparkles, AlertCircle } from 'lucide-react';
import { AnalysisStatus } from '@/app/hooks/useAnalysisStream';

/**
 * CurrentActivity
 *
 * Shows what's happening RIGHT NOW during analysis:
 * - Current phase (preparing, analyzing, synthesizing)
 * - API call status with live wait timer
 * - Prompt size and token estimates
 * - Model being used
 */
export default function CurrentActivity({ currentActivity, status, error }) {
  const [waitTime, setWaitTime] = useState(0);

  // Track wait time during API calls
  useEffect(() => {
    let interval;
    if (currentActivity?.type === 'api-call' && currentActivity.apiCall?.startTime) {
      interval = setInterval(() => {
        setWaitTime(Math.floor((Date.now() - currentActivity.apiCall.startTime) / 1000));
      }, 1000);
    } else {
      setWaitTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentActivity?.type, currentActivity?.apiCall?.startTime]);

  if (!currentActivity && status === AnalysisStatus.IDLE) {
    return null;
  }

  // Error state
  if (status === AnalysisStatus.ERROR || currentActivity?.type === 'error') {
    return (
      <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-300 font-medium">Analysis Failed</p>
            <p className="text-red-400/70 text-sm mt-1">{error || currentActivity?.error}</p>
            {currentActivity?.phase && (
              <p className="text-red-500/50 text-xs mt-2">Phase: {currentActivity.phase}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Complete state
  if (status === AnalysisStatus.COMPLETE) {
    return (
      <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-300 font-medium">Analysis Complete</p>
            <div className="text-green-400/70 text-sm mt-1 space-y-1">
              <p>{currentActivity?.filesAnalyzed} files analyzed with {currentActivity?.coverage} coverage</p>
              <p>Total time: {(currentActivity?.totalDurationMs / 1000).toFixed(1)}s</p>
              <p>Cost: {currentActivity?.actualCost}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Synthesizing state
  if (status === AnalysisStatus.SYNTHESIZING || currentActivity?.type === 'synthesis-start') {
    return (
      <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <p className="text-purple-300 font-medium">Synthesizing Results</p>
            <div className="text-purple-400/70 text-sm mt-2 space-y-1">
              <p>Combining outputs from {currentActivity?.chunkCount || 'multiple'} chunks</p>
              <p>Tokens so far: {currentActivity?.totalInputTokens?.toLocaleString()} in / {currentActivity?.totalOutputTokens?.toLocaleString()} out</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // API call in progress
  if (currentActivity?.type === 'api-call' && currentActivity.apiCall) {
    return (
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Loader2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-blue-300 font-medium">Calling {currentActivity.apiCall.provider} API</p>
              <span className="text-blue-400 font-mono text-sm">{waitTime}s</span>
            </div>
            <div className="mt-3 space-y-2">
              {/* Model */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Model:</span>
                <span className="text-slate-300 font-mono text-xs bg-slate-700/50 px-2 py-0.5 rounded">
                  {currentActivity.apiCall.model}
                </span>
              </div>

              {/* Prompt size */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Prompt:</span>
                <span className="text-slate-300">
                  {currentActivity.apiCall.promptTokens?.toLocaleString()} tokens
                  ({(currentActivity.apiCall.promptSize / 1024).toFixed(1)} KB)
                </span>
              </div>

              {/* Phase indicator */}
              {currentActivity.apiCall.phase === 'synthesis' && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-400">Synthesis pass</span>
                </div>
              )}

              {/* Wait time indicator */}
              <div className="mt-3">
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 animate-pulse"
                    style={{ width: `${Math.min(waitTime * 5, 100)}%` }}
                  />
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  {waitTime < 5 ? 'Sending request...' :
                   waitTime < 15 ? 'Waiting for response...' :
                   waitTime < 30 ? 'Processing... (large content)' :
                   'Still processing... (this may take a while)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chunk start
  if (currentActivity?.type === 'chunk-start') {
    return (
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileCode className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-white font-medium">
              Analyzing Chunk {currentActivity.chunkIndex + 1} of {currentActivity.totalChunks}
            </p>
            <div className="text-slate-400 text-sm mt-2">
              <p>{currentActivity.fileCount} files ({currentActivity.sizeFormatted})</p>
              {currentActivity.files && currentActivity.files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {currentActivity.files.slice(0, 5).map((file, i) => (
                    <span key={i} className="bg-slate-600/50 text-xs px-2 py-0.5 rounded text-slate-300">
                      {file.split('/').pop()}
                    </span>
                  ))}
                  {currentActivity.files.length > 5 && (
                    <span className="text-slate-500 text-xs px-2 py-0.5">
                      +{currentActivity.files.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chunk done
  if (currentActivity?.type === 'chunk-done') {
    return (
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-white font-medium">
              Chunk {currentActivity.chunkIndex + 1} Complete
            </p>
            <div className="text-slate-400 text-sm mt-2 space-y-1">
              <p>Time: {(currentActivity.durationMs / 1000).toFixed(1)}s</p>
              <p>Tokens: {currentActivity.inputTokens?.toLocaleString()} in / {currentActivity.outputTokens?.toLocaleString()} out</p>
              {currentActivity.preview && (
                <p className="text-green-400/70">
                  Found: ~{currentActivity.preview.userStories} stories, ~{currentActivity.preview.testCases} tests
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chunk error
  if (currentActivity?.type === 'chunk-error') {
    return (
      <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-orange-300 font-medium">
              Chunk {currentActivity.chunkIndex + 1} Failed
            </p>
            <p className="text-orange-400/70 text-sm mt-1">{currentActivity.error}</p>
            {currentActivity.recoverable && (
              <p className="text-orange-500/50 text-xs mt-2">Continuing with remaining chunks...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default/preparing state
  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        <span className="text-slate-300">{currentActivity?.message || 'Preparing analysis...'}</span>
      </div>
    </div>
  );
}
