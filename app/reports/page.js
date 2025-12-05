'use client';

/**
 * Reports List Page
 *
 * List all test execution history with filtering and actions.
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/app/components/layout/AppLayout';
import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Filter,
  ChevronRight,
  Play,
  AlertCircle
} from 'lucide-react';

const STATUS_CONFIG = {
  complete: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', label: 'Complete' },
  failed: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Failed' },
  running: { icon: Loader2, color: 'text-blue-400', bgColor: 'bg-blue-500/10', label: 'Running', animate: true },
  cancelled: { icon: XCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', label: 'Cancelled' },
  pending: { icon: Clock, color: 'text-slate-400', bgColor: 'bg-slate-500/10', label: 'Pending' }
};

export default function ReportsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, authStatus, router]);

  // Fetch executions
  useEffect(() => {
    if (!session) return;

    const fetchExecutions = async () => {
      try {
        const res = await fetch('/api/execute-tests');
        if (!res.ok) throw new Error('Failed to fetch executions');
        const data = await res.json();
        setExecutions(data.executions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExecutions();
  }, [session]);

  // Delete execution
  const deleteExecution = async (id) => {
    if (!confirm('Are you sure you want to delete this execution?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/execute-tests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExecutions(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter executions
  const filteredExecutions = executions.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'passed') return e.status === 'complete' && e.failedTests === 0;
    if (filter === 'failed') return e.status === 'complete' && e.failedTests > 0;
    return e.status === filter;
  });

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Get counts
  const counts = {
    all: executions.length,
    passed: executions.filter(e => e.status === 'complete' && e.failedTests === 0).length,
    failed: executions.filter(e => (e.status === 'complete' && e.failedTests > 0) || e.status === 'failed').length,
    running: executions.filter(e => ['running', 'starting', 'pending'].includes(e.status)).length
  };

  if (authStatus === 'loading' || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!session) return null;

  return (
    <AppLayout>
      <div className="w-full">
        <main className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-primary">Test Reports</h1>
                <p className="text-text-secondary-dark font-secondary mt-1">View your test execution history</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/execute')}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              New Execution
            </button>
          </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'passed', 'failed', 'running'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-lg text-sm transition-colors
                ${filter === f
                  ? 'bg-primary/20 text-primary'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
                }
              `}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-2 text-xs opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredExecutions.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">
              {executions.length === 0 ? 'No Executions Yet' : 'No Matching Results'}
            </h2>
            <p className="text-slate-400 mb-6">
              {executions.length === 0
                ? 'Run your first test execution to see results here'
                : 'Try a different filter to see more results'
              }
            </p>
            {executions.length === 0 && (
              <button
                onClick={() => router.push('/execute')}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
              >
                Start First Execution
              </button>
            )}
          </div>
        )}

        {/* Executions List */}
        {filteredExecutions.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-700 bg-slate-800/50 text-xs text-slate-500 uppercase tracking-wider">
              <div className="col-span-1">Status</div>
              <div className="col-span-3">Framework</div>
              <div className="col-span-2">Tests</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Body */}
            {filteredExecutions.map(execution => {
              const statusConfig = STATUS_CONFIG[execution.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const hasFailures = execution.failedTests > 0;

              return (
                <div
                  key={execution.id}
                  onClick={() => router.push(`/reports/${execution.id}`)}
                  className={`
                    grid grid-cols-12 gap-4 px-4 py-4 border-b border-slate-700/50
                    last:border-b-0 cursor-pointer hover:bg-slate-700/30 transition-colors
                    ${statusConfig.bgColor}
                  `}
                >
                  {/* Status */}
                  <div className="col-span-1 flex items-center">
                    <StatusIcon
                      className={`w-5 h-5 ${statusConfig.color} ${statusConfig.animate ? 'animate-spin' : ''}`}
                    />
                  </div>

                  {/* Framework */}
                  <div className="col-span-3 flex items-center">
                    <span className="text-white font-medium">
                      {execution.framework || 'Unknown'}
                    </span>
                    <span className="ml-2 px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                      {execution.id?.slice(0, 8)}
                    </span>
                  </div>

                  {/* Tests */}
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-green-400">{execution.passedTests || 0}</span>
                    <span className="text-slate-500">/</span>
                    {hasFailures && (
                      <span className="text-red-400">{execution.failedTests}</span>
                    )}
                    {!hasFailures && (
                      <span className="text-slate-400">{execution.totalTests || 0}</span>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="col-span-2 flex items-center text-slate-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(execution.duration)}
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-slate-400">
                    {formatDate(execution.completedAt || execution.startedAt || execution.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (execution.testCode) {
                          localStorage.setItem('pendingTestCode', execution.testCode);
                          localStorage.setItem('pendingTestFramework', execution.framework || 'auto');
                        }
                        router.push('/execute');
                      }}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Re-run"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteExecution(execution.id);
                      }}
                      disabled={deletingId === execution.id}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === execution.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </main>
      </div>
    </AppLayout>
  );
}
