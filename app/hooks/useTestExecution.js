'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Execution status enum
 */
export const ExecutionStatus = {
  IDLE: 'idle',
  STARTING: 'starting',
  BOOTING: 'booting',
  MOUNTING: 'mounting',
  INSTALLING: 'installing',
  RUNNING: 'running',
  COMPLETE: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Hook for managing test execution lifecycle
 *
 * Features:
 * - Start execution with test code
 * - Real-time progress via SSE
 * - Output streaming
 * - Result parsing
 * - Cancellation support
 *
 * @returns {object} Execution state and controls
 */
export function useTestExecution() {
  const [status, setStatus] = useState(ExecutionStatus.IDLE);
  const [executionId, setExecutionId] = useState(null);
  const [output, setOutput] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ elapsed: 0, phase: '' });
  const [framework, setFramework] = useState(null);

  const eventSourceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Start test execution
   * @param {string} testCode - Test code to execute
   * @param {object} options - Execution options
   */
  const execute = useCallback(async (testCode, options = {}) => {
    const {
      framework: requestedFramework = 'auto',
      strategy = 'webcontainer',
      analysisId = null,
      targetId = null,
      environment = {}
    } = options;

    // Reset state
    setStatus(ExecutionStatus.STARTING);
    setOutput('');
    setResults(null);
    setError(null);
    setProgress({ elapsed: 0, phase: 'starting' });
    startTimeRef.current = Date.now();

    abortControllerRef.current = new AbortController();

    try {
      // Start execution via API
      const response = await fetch('/api/execute-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCode,
          framework: requestedFramework,
          strategy,
          analysisId,
          targetId,
          environment
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to start execution');
      }

      const { executionId: id, framework: detectedFramework, streamUrl } = await response.json();
      setExecutionId(id);
      setFramework(detectedFramework);

      // Connect to SSE stream
      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('status', (e) => {
        const data = JSON.parse(e.data);
        setStatus(data.status);
        setProgress(prev => ({
          ...prev,
          elapsed: data.elapsed,
          phase: data.message
        }));
      });

      eventSource.addEventListener('output', (e) => {
        const data = JSON.parse(e.data);
        setOutput(prev => prev + data.chunk);
      });

      eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        setStatus(data.status === 'completed' ? ExecutionStatus.COMPLETE : ExecutionStatus.FAILED);
        setResults(data);
        setProgress(prev => ({ ...prev, elapsed: data.elapsed || (Date.now() - startTimeRef.current) }));
        eventSource.close();
      });

      eventSource.addEventListener('error', (e) => {
        try {
          const data = JSON.parse(e.data);
          setError(data.message);
        } catch {
          setError('Connection error');
        }
        setStatus(ExecutionStatus.FAILED);
        eventSource.close();
      });

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          return; // Normal close
        }
        setError('Stream connection lost');
        setStatus(ExecutionStatus.FAILED);
        eventSource.close();
      };

    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus(ExecutionStatus.CANCELLED);
      } else {
        setError(err.message);
        setStatus(ExecutionStatus.FAILED);
      }
    }
  }, []);

  /**
   * Cancel running execution
   */
  const cancel = useCallback(async () => {
    // Close SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Abort fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Update status on server if we have an execution ID
    if (executionId) {
      try {
        await fetch(`/api/execute-tests/${executionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel' })
        });
      } catch (e) {
        console.error('Failed to cancel on server:', e);
      }
    }

    setStatus(ExecutionStatus.CANCELLED);
  }, [executionId]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setStatus(ExecutionStatus.IDLE);
    setExecutionId(null);
    setOutput('');
    setResults(null);
    setError(null);
    setProgress({ elapsed: 0, phase: '' });
    setFramework(null);
  }, []);

  /**
   * Validate test code before execution
   * @param {string} testCode - Test code to validate
   */
  const validate = useCallback(async (testCode) => {
    try {
      const response = await fetch('/api/execute-tests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCode })
      });

      if (!response.ok) {
        throw new Error('Validation request failed');
      }

      return await response.json();
    } catch (err) {
      return {
        valid: false,
        errors: [{ type: 'network', message: err.message }]
      };
    }
  }, []);

  // Computed properties
  const isRunning = [
    ExecutionStatus.STARTING,
    ExecutionStatus.BOOTING,
    ExecutionStatus.MOUNTING,
    ExecutionStatus.INSTALLING,
    ExecutionStatus.RUNNING
  ].includes(status);

  const isComplete = status === ExecutionStatus.COMPLETE;
  const isFailed = status === ExecutionStatus.FAILED;
  const isCancelled = status === ExecutionStatus.CANCELLED;
  const isDone = isComplete || isFailed || isCancelled;

  return {
    // State
    status,
    executionId,
    output,
    results,
    error,
    progress,
    framework,

    // Computed
    isRunning,
    isComplete,
    isFailed,
    isCancelled,
    isDone,

    // Actions
    execute,
    cancel,
    reset,
    validate
  };
}

/**
 * Format elapsed time for display
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time
 */
export function formatElapsed(ms) {
  if (!ms) return '0s';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Get human-readable status message
 * @param {string} status - Execution status
 * @returns {string} Status message
 */
export function getStatusMessage(status) {
  switch (status) {
    case ExecutionStatus.IDLE: return 'Ready';
    case ExecutionStatus.STARTING: return 'Starting...';
    case ExecutionStatus.BOOTING: return 'Booting environment...';
    case ExecutionStatus.MOUNTING: return 'Setting up files...';
    case ExecutionStatus.INSTALLING: return 'Installing dependencies...';
    case ExecutionStatus.RUNNING: return 'Running tests...';
    case ExecutionStatus.COMPLETE: return 'Complete';
    case ExecutionStatus.FAILED: return 'Failed';
    case ExecutionStatus.CANCELLED: return 'Cancelled';
    default: return status;
  }
}
