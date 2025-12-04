'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Analysis Status Types
 */
export const AnalysisStatus = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  PLANNING: 'planning',
  ANALYZING: 'analyzing',
  SYNTHESIZING: 'synthesizing',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

/**
 * Chunk Status Types
 */
export const ChunkStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  CALLING_API: 'calling_api',
  DONE: 'done',
  ERROR: 'error'
};

/**
 * useAnalysisStream Hook
 *
 * Handles SSE streaming from /api/analyze-stream with real-time updates
 *
 * Returns comprehensive state for building detailed progress UI:
 * - status: Current analysis phase
 * - plan: Analysis plan (chunks, files, estimates)
 * - chunks: Per-chunk status with tokens, timing
 * - currentActivity: What's happening RIGHT NOW
 * - tokenUsage: Real-time token counters
 * - dataFlow: Log of all API calls
 * - results: Final analysis results
 * - error: Error information
 * - timing: Start time, elapsed, per-chunk durations
 */
export default function useAnalysisStream() {
  // Core state
  const [status, setStatus] = useState(AnalysisStatus.IDLE);
  const [plan, setPlan] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0 });
  const [dataFlow, setDataFlow] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Timing state
  const [timing, setTiming] = useState({
    startTime: null,
    elapsed: 0,
    chunkDurations: []
  });

  // Refs for cleanup
  const abortControllerRef = useRef(null);
  const elapsedIntervalRef = useRef(null);

  // Update elapsed time every second
  useEffect(() => {
    if (timing.startTime && status !== AnalysisStatus.COMPLETE && status !== AnalysisStatus.ERROR) {
      elapsedIntervalRef.current = setInterval(() => {
        setTiming(prev => ({
          ...prev,
          elapsed: Date.now() - prev.startTime
        }));
      }, 1000);
    }

    return () => {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
    };
  }, [timing.startTime, status]);

  /**
   * Add entry to data flow log
   */
  const addDataFlowEntry = useCallback((eventType, data) => {
    setDataFlow(prev => [...prev, {
      id: Date.now(),
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    }]);
  }, []);

  /**
   * Update a specific chunk's status
   */
  const updateChunk = useCallback((index, updates) => {
    setChunks(prev => prev.map((chunk, i) =>
      i === index ? { ...chunk, ...updates } : chunk
    ));
  }, []);

  /**
   * Start streaming analysis
   */
  const startAnalysis = useCallback(async (files, config, apiKey, provider = 'claude', lmStudioUrl = '') => {
    // Reset state
    setStatus(AnalysisStatus.CONNECTING);
    setPlan(null);
    setChunks([]);
    setCurrentActivity({ type: 'connecting', message: 'Connecting to analysis server...' });
    setTokenUsage({ input: 0, output: 0 });
    setDataFlow([]);
    setResults(null);
    setError(null);
    setTiming({
      startTime: Date.now(),
      elapsed: 0,
      chunkDurations: []
    });

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Use fetch with SSE parsing (EventSource doesn't support POST)
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          config,
          apiKey,
          provider,
          lmStudioUrl
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let currentEvent = null;

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ') && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              handleEvent(currentEvent, data);
              addDataFlowEntry(currentEvent, data);
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
            currentEvent = null;
          }
        }
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus(AnalysisStatus.CANCELLED);
        setCurrentActivity({ type: 'cancelled', message: 'Analysis cancelled by user' });
      } else {
        setStatus(AnalysisStatus.ERROR);
        setError(err.message);
        setCurrentActivity({ type: 'error', message: err.message });
      }
    }
  }, [addDataFlowEntry]);

  /**
   * Handle SSE events
   */
  const handleEvent = useCallback((eventType, data) => {
    switch (eventType) {
      case 'plan':
        setStatus(AnalysisStatus.PLANNING);
        setPlan({
          strategy: data.strategy,
          totalFiles: data.totalFiles,
          totalSize: data.totalSize,
          totalSizeFormatted: data.totalSizeFormatted,
          totalChunks: data.totalChunks,
          totalPasses: data.totalPasses,
          estimatedTokens: data.estimatedTokens,
          estimatedCost: data.estimatedCost,
          chunkDetails: data.chunks
        });
        // Initialize chunks array
        if (data.chunks && data.chunks.length > 0) {
          setChunks(data.chunks.map((c, i) => ({
            index: i,
            status: ChunkStatus.PENDING,
            files: [],
            summary: c.summary || `Chunk ${i + 1}`,
            tokens: { input: 0, output: 0 },
            duration: 0,
            preview: null
          })));
        } else {
          // Single pass
          setChunks([{
            index: 0,
            status: ChunkStatus.PENDING,
            files: [],
            summary: 'All files',
            tokens: { input: 0, output: 0 },
            duration: 0,
            preview: null
          }]);
        }
        setCurrentActivity({
          type: 'planned',
          message: `Plan ready: ${data.totalFiles} files in ${data.totalPasses} pass${data.totalPasses > 1 ? 'es' : ''}`
        });
        break;

      case 'chunk-start':
        setStatus(AnalysisStatus.ANALYZING);
        updateChunk(data.index, {
          status: ChunkStatus.ACTIVE,
          files: data.files,
          fileCount: data.fileCount,
          sizeBytes: data.sizeBytes,
          sizeFormatted: data.sizeFormatted
        });
        setCurrentActivity({
          type: 'chunk-start',
          chunkIndex: data.index,
          totalChunks: data.total,
          files: data.files,
          fileCount: data.fileCount,
          sizeFormatted: data.sizeFormatted,
          message: `Analyzing chunk ${data.index + 1} of ${data.total}: ${data.fileCount} files`
        });
        break;

      case 'api-call':
        updateChunk(data.chunkIndex ?? 0, { status: ChunkStatus.CALLING_API });
        setCurrentActivity(prev => ({
          ...prev,
          type: 'api-call',
          apiCall: {
            provider: data.provider,
            model: data.model,
            promptSize: data.promptSize,
            promptTokens: data.promptTokens,
            phase: data.phase,
            startTime: Date.now()
          },
          message: data.phase === 'synthesis'
            ? `Calling ${data.provider} API for synthesis...`
            : `Calling ${data.provider} API (${data.promptTokens?.toLocaleString()} tokens)...`
        }));
        break;

      case 'chunk-done':
        updateChunk(data.index, {
          status: ChunkStatus.DONE,
          tokens: { input: data.inputTokens, output: data.outputTokens },
          duration: data.durationMs,
          preview: data.preview
        });
        setTokenUsage(prev => ({
          input: prev.input + (data.inputTokens || 0),
          output: prev.output + (data.outputTokens || 0)
        }));
        setTiming(prev => ({
          ...prev,
          chunkDurations: [...prev.chunkDurations, {
            index: data.index,
            duration: data.durationMs
          }]
        }));
        setCurrentActivity({
          type: 'chunk-done',
          chunkIndex: data.index,
          totalChunks: data.total,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          durationMs: data.durationMs,
          preview: data.preview,
          message: `Chunk ${data.index + 1} complete (${(data.durationMs / 1000).toFixed(1)}s)`
        });
        break;

      case 'chunk-error':
        updateChunk(data.index, {
          status: ChunkStatus.ERROR,
          error: data.error
        });
        setCurrentActivity({
          type: 'chunk-error',
          chunkIndex: data.index,
          error: data.error,
          recoverable: data.recoverable,
          message: `Chunk ${data.index + 1} failed: ${data.error}`
        });
        break;

      case 'synthesis-start':
        setStatus(AnalysisStatus.SYNTHESIZING);
        setCurrentActivity({
          type: 'synthesis-start',
          chunkCount: data.chunkCount,
          totalInputTokens: data.totalInputTokens,
          totalOutputTokens: data.totalOutputTokens,
          message: `Synthesizing results from ${data.chunkCount} chunks...`
        });
        break;

      case 'synthesis-done':
        setTokenUsage(prev => ({
          input: prev.input + (data.inputTokens || 0),
          output: prev.output + (data.outputTokens || 0)
        }));
        setCurrentActivity({
          type: 'synthesis-done',
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          durationMs: data.durationMs,
          message: `Synthesis complete (${(data.durationMs / 1000).toFixed(1)}s)`
        });
        break;

      case 'complete':
        setStatus(AnalysisStatus.COMPLETE);
        setResults({
          userStories: data.results?.userStories || '',
          testCases: data.results?.testCases || '',
          acceptanceCriteria: data.results?.acceptanceCriteria || '',
          raw: data.results?.raw || ''
        });
        setTokenUsage({
          input: data.usage?.input_tokens || 0,
          output: data.usage?.output_tokens || 0
        });
        setCurrentActivity({
          type: 'complete',
          analysisId: data.analysisId,
          totalDurationMs: data.totalDurationMs,
          actualCost: data.actualCost,
          filesAnalyzed: data.filesAnalyzed,
          coverage: data.coverage,
          message: `Analysis complete! ${data.filesAnalyzed} files analyzed`
        });
        // Clear elapsed timer
        if (elapsedIntervalRef.current) {
          clearInterval(elapsedIntervalRef.current);
        }
        break;

      case 'error':
        setStatus(AnalysisStatus.ERROR);
        setError(data.error);
        setCurrentActivity({
          type: 'error',
          error: data.error,
          phase: data.phase,
          recoverable: data.recoverable,
          message: data.error
        });
        // Clear elapsed timer
        if (elapsedIntervalRef.current) {
          clearInterval(elapsedIntervalRef.current);
        }
        break;

      default:
        console.log('Unknown SSE event:', eventType, data);
    }
  }, [updateChunk]);

  /**
   * Cancel ongoing analysis
   */
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
    }
    setStatus(AnalysisStatus.CANCELLED);
    setCurrentActivity({ type: 'cancelled', message: 'Analysis cancelled' });
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
    }
    setStatus(AnalysisStatus.IDLE);
    setPlan(null);
    setChunks([]);
    setCurrentActivity(null);
    setTokenUsage({ input: 0, output: 0 });
    setDataFlow([]);
    setResults(null);
    setError(null);
    setTiming({ startTime: null, elapsed: 0, chunkDurations: [] });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
    };
  }, []);

  // Computed values
  const isAnalyzing = [
    AnalysisStatus.CONNECTING,
    AnalysisStatus.PLANNING,
    AnalysisStatus.ANALYZING,
    AnalysisStatus.SYNTHESIZING
  ].includes(status);

  const progress = {
    current: chunks.filter(c => c.status === ChunkStatus.DONE).length,
    total: chunks.length + (plan?.strategy === 'multi' ? 1 : 0), // +1 for synthesis
    percentage: chunks.length > 0
      ? Math.round((chunks.filter(c => c.status === ChunkStatus.DONE).length / chunks.length) * 100)
      : 0
  };

  // Calculate actual cost
  const actualCost = ((tokenUsage.input / 1000000) * 3.00) + ((tokenUsage.output / 1000000) * 15.00);

  return {
    // Status
    status,
    isAnalyzing,
    isComplete: status === AnalysisStatus.COMPLETE,
    isError: status === AnalysisStatus.ERROR,

    // Plan & Progress
    plan,
    progress,
    chunks,

    // Real-time activity
    currentActivity,

    // Tokens & Cost
    tokenUsage,
    actualCost: `$${actualCost.toFixed(4)}`,

    // Results
    results,
    error,

    // Timing
    timing,
    elapsedFormatted: formatElapsed(timing.elapsed),

    // Data flow log
    dataFlow,

    // Actions
    startAnalysis,
    cancelAnalysis,
    reset
  };
}

/**
 * Format elapsed time
 */
function formatElapsed(ms) {
  if (!ms) return '0s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
