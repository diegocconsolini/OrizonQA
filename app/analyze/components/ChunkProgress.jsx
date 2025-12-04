'use client';

import { CheckCircle2, Loader2, Circle, XCircle, Sparkles, FileCode } from 'lucide-react';
import { ChunkStatus, AnalysisStatus } from '@/app/hooks/useAnalysisStream';

/**
 * ChunkProgress
 *
 * Per-chunk progress list showing:
 * - Status icon (pending, active, done, error)
 * - File count and size
 * - Token usage per chunk
 * - Duration
 * - Preview of results found
 */
export default function ChunkProgress({ chunks, status, plan }) {
  const isSynthesizing = status === AnalysisStatus.SYNTHESIZING;
  const isComplete = status === AnalysisStatus.COMPLETE;
  const isMultiPass = plan?.strategy === 'multi';

  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileCode className="w-4 h-4 text-blue-400" />
        <span className="text-white font-medium">Chunk Progress</span>
        <span className="text-slate-500 text-sm ml-auto">
          {chunks.filter(c => c.status === ChunkStatus.DONE).length} / {chunks.length} complete
        </span>
      </div>

      <div className="space-y-2">
        {chunks.map((chunk, index) => (
          <ChunkRow key={index} chunk={chunk} index={index} />
        ))}

        {/* Synthesis step (for multi-pass) */}
        {isMultiPass && (
          <div className={`flex items-center gap-3 p-2 rounded ${
            isSynthesizing ? 'bg-purple-900/30' :
            isComplete ? 'bg-green-900/20' :
            'bg-slate-700/20'
          }`}>
            <div className="flex-shrink-0">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : isSynthesizing ? (
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  isComplete ? 'text-green-300' :
                  isSynthesizing ? 'text-purple-300' :
                  'text-slate-500'
                }`}>
                  Synthesis
                </span>
                <span className="text-slate-500 text-xs">Combine all results</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual chunk row
 */
function ChunkRow({ chunk, index }) {
  const statusIcon = {
    [ChunkStatus.PENDING]: <Circle className="w-4 h-4 text-slate-600" />,
    [ChunkStatus.ACTIVE]: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    [ChunkStatus.CALLING_API]: <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />,
    [ChunkStatus.DONE]: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    [ChunkStatus.ERROR]: <XCircle className="w-4 h-4 text-red-400" />
  };

  const statusColor = {
    [ChunkStatus.PENDING]: 'bg-slate-700/20',
    [ChunkStatus.ACTIVE]: 'bg-blue-900/30',
    [ChunkStatus.CALLING_API]: 'bg-yellow-900/30',
    [ChunkStatus.DONE]: 'bg-green-900/20',
    [ChunkStatus.ERROR]: 'bg-red-900/20'
  };

  return (
    <div className={`flex items-center gap-3 p-2 rounded ${statusColor[chunk.status] || 'bg-slate-700/20'}`}>
      <div className="flex-shrink-0">
        {statusIcon[chunk.status] || statusIcon[ChunkStatus.PENDING]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${
            chunk.status === ChunkStatus.DONE ? 'text-green-300' :
            chunk.status === ChunkStatus.ACTIVE || chunk.status === ChunkStatus.CALLING_API ? 'text-blue-300' :
            chunk.status === ChunkStatus.ERROR ? 'text-red-300' :
            'text-slate-400'
          }`}>
            Chunk {index + 1}
          </span>

          {chunk.summary && (
            <span className="text-slate-500 text-xs truncate max-w-[150px]">{chunk.summary}</span>
          )}

          {chunk.fileCount && (
            <span className="text-slate-500 text-xs">
              {chunk.fileCount} files
              {chunk.sizeFormatted && ` (${chunk.sizeFormatted})`}
            </span>
          )}
        </div>

        {/* Show tokens and duration when done */}
        {chunk.status === ChunkStatus.DONE && (chunk.tokens?.input || chunk.duration) && (
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {chunk.tokens?.input && (
              <span>{chunk.tokens.input.toLocaleString()} / {chunk.tokens.output.toLocaleString()} tokens</span>
            )}
            {chunk.duration && (
              <span>{(chunk.duration / 1000).toFixed(1)}s</span>
            )}
            {chunk.preview && (
              <span className="text-green-400/70">
                ~{chunk.preview.userStories} stories, ~{chunk.preview.testCases} tests
              </span>
            )}
          </div>
        )}

        {/* Show error message */}
        {chunk.status === ChunkStatus.ERROR && chunk.error && (
          <p className="text-red-400/70 text-xs mt-1 truncate">{chunk.error}</p>
        )}
      </div>
    </div>
  );
}
