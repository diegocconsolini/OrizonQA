'use client';

/**
 * Live Execution Page
 *
 * Watch test execution in real-time:
 * - SSE streaming connection
 * - Live progress updates
 * - Log output viewer
 * - Cancel/complete actions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '@/app/components/layout/AppLayout';
import LiveProgress from '../components/LiveProgress';
import LogViewer from '../components/LogViewer';
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function ExecutionViewPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const executionId = params.id;

  // State
  const [execution, setExecution] = useState(null);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // SSE connection ref
  const eventSourceRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, authStatus, router]);

  // Fetch initial execution data
  useEffect(() => {
    if (!executionId || !session) return;

    const fetchExecution = async () => {
      try {
        const res = await fetch(`/api/execute-tests/${executionId}`);
        if (!res.ok) {
          throw new Error('Execution not found');
        }
        const data = await res.json();
        setExecution(data);

        // If already complete, load results
        if (data.results) {
          setResults(data.results);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchExecution();
  }, [executionId, session]);

  // Connect to SSE stream
  useEffect(() => {
    if (!executionId || !session || !execution) return;

    // Don't connect if already complete
    if (['complete', 'failed', 'cancelled'].includes(execution.status)) {
      return;
    }

    const eventSource = new EventSource(`/api/execute-tests/${executionId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'status':
            setExecution(prev => ({ ...prev, status: data.status }));
            break;

          case 'test-start':
            setExecution(prev => ({ ...prev, currentTest: data.testName }));
            setResults(prev => [
              ...prev,
              { id: data.testId, name: data.testName, status: 'running' }
            ]);
            break;

          case 'test-end':
            setResults(prev => prev.map(r =>
              r.id === data.testId
                ? { ...r, status: data.passed ? 'passed' : 'failed', duration: data.duration }
                : r
            ));
            break;

          case 'log':
            setLogs(prev => [...prev, {
              id: Date.now(),
              message: data.message,
              type: data.level || 'info',
              timestamp: new Date().toISOString()
            }]);
            break;

          case 'complete':
            setExecution(prev => ({
              ...prev,
              status: 'complete',
              endTime: new Date().toISOString()
            }));
            eventSource.close();
            break;

          case 'error':
            setExecution(prev => ({
              ...prev,
              status: 'failed',
              error: data.message
            }));
            setLogs(prev => [...prev, {
              id: Date.now(),
              message: data.message,
              type: 'error',
              timestamp: new Date().toISOString()
            }]);
            eventSource.close();
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setIsConnected(false);
      // Don't show error if execution is complete
      if (!['complete', 'failed', 'cancelled'].includes(execution?.status)) {
        setError('Connection lost. Trying to reconnect...');
      }
    };

    return () => {
      eventSource.close();
    };
  }, [executionId, session, execution?.status]);

  // Cancel execution
  const cancelExecution = async () => {
    try {
      const res = await fetch(`/api/execute-tests/${executionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });

      if (res.ok) {
        setExecution(prev => ({ ...prev, status: 'cancelled' }));
        eventSourceRef.current?.close();
      }
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  // View report
  const viewReport = () => {
    router.push(`/reports/${executionId}`);
  };

  // Re-run execution
  const reRunExecution = () => {
    // Navigate back to execute page with the same test code
    if (execution?.testCode) {
      localStorage.setItem('pendingTestCode', execution.testCode);
      localStorage.setItem('pendingTestFramework', execution.framework || 'auto');
    }
    router.push('/execute');
  };

  const isComplete = ['complete', 'failed', 'cancelled'].includes(execution?.status);
  const isRunning = ['starting', 'booting', 'mounting', 'installing', 'running'].includes(execution?.status);

  if (authStatus === 'loading') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!session) return null;

  if (error && !execution) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Execution Not Found</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/execute')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Back to Execute
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/execute')}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Test Execution</h1>
              <p className="text-slate-400 font-mono text-sm">ID: {executionId}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isComplete && (
              <>
                <button
                  onClick={reRunExecution}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Re-run
                </button>
                <button
                  onClick={viewReport}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Report
                </button>
              </>
            )}

            {/* Connection Status */}
            {isRunning && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                isConnected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
                }`} />
                {isConnected ? 'Connected' : 'Reconnecting...'}
              </div>
            )}
          </div>
        </div>

        {/* Completion Banner */}
        {execution?.status === 'complete' && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="text-green-400 font-medium">Execution Complete</p>
              <p className="text-green-400/70 text-sm">
                All tests have finished running. View the full report for details.
              </p>
            </div>
            <button
              onClick={viewReport}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
            >
              View Report
            </button>
          </div>
        )}

        {/* Error Banner */}
        {execution?.status === 'failed' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Execution Failed</p>
              <p className="text-red-400/70 text-sm">
                {execution.error || 'An error occurred during test execution.'}
              </p>
            </div>
            <button
              onClick={reRunExecution}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Panel */}
          <div>
            <LiveProgress
              executionId={executionId}
              status={execution?.status || 'idle'}
              results={results}
              totalTests={execution?.totalTests || results.length}
              currentTest={execution?.currentTest}
              startTime={execution?.startTime}
              onCancel={isRunning ? cancelExecution : null}
            />
          </div>

          {/* Log Viewer */}
          <div>
            <LogViewer
              logs={logs}
              autoScroll={isRunning}
              maxHeight="500px"
            />
          </div>
        </div>

        {/* Quick Stats */}
        {isComplete && results.length > 0 && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{results.length}</p>
              <p className="text-xs text-slate-400">Total Tests</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {results.filter(r => r.status === 'passed').length}
              </p>
              <p className="text-xs text-slate-400">Passed</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-400">
                {results.filter(r => r.status === 'failed').length}
              </p>
              <p className="text-xs text-slate-400">Failed</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-300">
                {results.reduce((acc, r) => acc + (r.duration || 0), 0)}ms
              </p>
              <p className="text-xs text-slate-400">Total Duration</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
