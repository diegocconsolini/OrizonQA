'use client';

/**
 * Report Detail Page
 *
 * View individual execution report with all details.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '@/app/components/layout/AppLayout';
import SummaryCard from './components/SummaryCard';
import TestList from './components/TestList';
import FailureDetails from './components/FailureDetails';
import AllureReport from './components/AllureReport';
import {
  ArrowLeft,
  FileText,
  Download,
  RefreshCw,
  Share2,
  Loader2,
  AlertCircle,
  BarChart3,
  List,
  AlertTriangle
} from 'lucide-react';

export default function ReportDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const executionId = params.id;

  const [execution, setExecution] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [testFilter, setTestFilter] = useState('all');
  const [selectedFailure, setSelectedFailure] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, authStatus, router]);

  // Fetch execution
  useEffect(() => {
    if (!executionId || !session) return;

    const fetchExecution = async () => {
      try {
        const res = await fetch(`/api/execute-tests/${executionId}`);
        if (!res.ok) throw new Error('Execution not found');
        const data = await res.json();
        setExecution(data);
        setResults(data.results || []);

        // Auto-select first failure for details view
        const firstFailure = (data.results || []).find(r => r.status === 'failed');
        if (firstFailure) {
          setSelectedFailure(firstFailure);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExecution();
  }, [executionId, session]);

  // Get failed tests
  const failedTests = useMemo(() =>
    results.filter(r => r.status === 'failed'),
    [results]
  );

  // Re-run execution
  const reRunExecution = () => {
    if (execution?.testCode) {
      localStorage.setItem('pendingTestCode', execution.testCode);
      localStorage.setItem('pendingTestFramework', execution.framework || 'auto');
    }
    router.push('/execute');
  };

  // Re-run failed tests only
  const reRunFailed = () => {
    if (execution?.testCode && failedTests.length > 0) {
      localStorage.setItem('pendingTestCode', execution.testCode);
      localStorage.setItem('pendingTestFramework', execution.framework || 'auto');
      // Could store selected test IDs for filtering
      router.push('/execute');
    }
  };

  // Export as JSON
  const exportJson = () => {
    const data = {
      execution: {
        id: execution.id,
        framework: execution.framework,
        status: execution.status,
        totalTests: execution.totalTests,
        passedTests: execution.passedTests,
        failedTests: execution.failedTests,
        duration: execution.duration,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt
      },
      results: results.map(r => ({
        name: r.name,
        status: r.status,
        duration: r.duration,
        error: r.error,
        stackTrace: r.stackTrace
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${executionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  if (error) {
    return (
      <AppLayout>
        <div className="w-full">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Report Not Found</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/reports')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Back to Reports
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

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
                <h1 className="text-2xl font-bold text-white font-primary">Test Report</h1>
                <p className="text-text-secondary-dark font-secondary mt-1 font-mono text-sm">ID: {executionId}</p>
              </div>
            </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportJson}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {failedTests.length > 0 && (
              <button
                onClick={reRunFailed}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Re-run Failed
              </button>
            )}
            <button
              onClick={reRunExecution}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Re-run All
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 pb-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'summary'
                ? 'bg-primary/20 text-primary'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'tests'
                ? 'bg-primary/20 text-primary'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <List className="w-4 h-4" />
            Tests
            {failedTests.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                {failedTests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'charts'
                ? 'bg-primary/20 text-primary'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Charts
          </button>
          {failedTests.length > 0 && (
            <button
              onClick={() => setActiveTab('failures')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'failures'
                  ? 'bg-red-500/20 text-red-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Failures
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                {failedTests.length}
              </span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SummaryCard execution={execution} />
            <div className="space-y-6">
              <TestList
                tests={results}
                filter={testFilter}
                onFilterChange={setTestFilter}
              />
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <TestList
            tests={results}
            filter={testFilter}
            onFilterChange={setTestFilter}
          />
        )}

        {activeTab === 'charts' && (
          <AllureReport execution={execution} results={results} />
        )}

        {activeTab === 'failures' && failedTests.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Failures List */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="text-white font-medium">
                    Failed Tests ({failedTests.length})
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {failedTests.map((test, idx) => (
                    <div
                      key={test.id || idx}
                      onClick={() => setSelectedFailure(test)}
                      className={`
                        px-4 py-3 cursor-pointer border-b border-slate-700/50 last:border-b-0
                        transition-colors
                        ${selectedFailure?.id === test.id || selectedFailure?.name === test.name
                          ? 'bg-red-500/10 border-l-2 border-l-red-500'
                          : 'hover:bg-slate-700/30'
                        }
                      `}
                    >
                      <p className="text-sm text-white truncate">{test.name}</p>
                      {test.duration && (
                        <p className="text-xs text-slate-500 mt-1">{test.duration}ms</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Failure Details */}
            <div className="lg:col-span-2">
              {selectedFailure ? (
                <FailureDetails
                  failure={selectedFailure}
                  onRerun={() => reRunExecution()}
                />
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Select a failed test to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
