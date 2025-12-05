'use client';

/**
 * Execute Page - Test Execution Configuration
 *
 * Configure and start test execution:
 * - Select tests to run
 * - Configure environment
 * - Choose execution strategy
 * - Start execution
 */

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/app/components/layout/AppLayout';
import TestSelector from './components/TestSelector';
import EnvironmentConfig from './components/EnvironmentConfig';
import ExecutionStrategy from './components/ExecutionStrategy';
import {
  Play,
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileCode,
  Settings,
  Zap
} from 'lucide-react';

const DEFAULT_ENV_CONFIG = {
  nodeVersion: '20',
  timeout: 60,
  envVars: [],
  mockApiUrl: ''
};

function ExecutePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [testCode, setTestCode] = useState('');
  const [framework, setFramework] = useState('auto');
  const [selectedTests, setSelectedTests] = useState([]);
  const [envConfig, setEnvConfig] = useState(DEFAULT_ENV_CONFIG);
  const [strategy, setStrategy] = useState('webcontainer');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tests');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Load test code from URL params or localStorage
  useEffect(() => {
    // Try URL params first
    const codeFromUrl = searchParams.get('code');
    const frameworkFromUrl = searchParams.get('framework');

    if (codeFromUrl) {
      try {
        setTestCode(decodeURIComponent(codeFromUrl));
        if (frameworkFromUrl) setFramework(frameworkFromUrl);
      } catch (e) {
        console.error('Failed to decode test code from URL');
      }
    } else {
      // Try localStorage
      const savedCode = localStorage.getItem('pendingTestCode');
      const savedFramework = localStorage.getItem('pendingTestFramework');

      if (savedCode) {
        setTestCode(savedCode);
        if (savedFramework) setFramework(savedFramework);
        // Clear after loading
        localStorage.removeItem('pendingTestCode');
        localStorage.removeItem('pendingTestFramework');
      }
    }
  }, [searchParams]);

  // Detect framework from code
  useEffect(() => {
    if (!testCode || framework !== 'auto') return;

    if (testCode.includes('vitest') || testCode.includes('from \'vitest\'')) {
      setFramework('vitest');
    } else if (testCode.includes('jest') || testCode.includes('expect(')) {
      setFramework('jest');
    } else if (testCode.includes('mocha') || testCode.includes('chai')) {
      setFramework('mocha');
    }
  }, [testCode, framework]);

  // Start execution
  const startExecution = async () => {
    if (!testCode || selectedTests.length === 0) {
      setError('Please provide test code and select at least one test');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/execute-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCode,
          framework: framework === 'auto' ? 'jest' : framework,
          selectedTests,
          config: {
            ...envConfig,
            strategy
          }
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start execution');
      }

      const { executionId } = await response.json();

      // Navigate to live execution view
      router.push(`/execute/${executionId}`);
    } catch (err) {
      setError(err.message);
      setIsStarting(false);
    }
  };

  // Count total tests
  const totalTests = selectedTests.length;

  if (status === 'loading') {
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Execute Tests</h1>
              <p className="text-slate-400">Configure and run your test suite</p>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startExecution}
            disabled={isStarting || !testCode || totalTests === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run {totalTests} Test{totalTests !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-400/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* No Code State */}
        {!testCode && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
            <FileCode className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">No Test Code</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Generate tests from the Analyze page, then click "Execute" to run them here.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/analyze')}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
              >
                Go to Analyze
              </button>
              <button
                onClick={() => {
                  const code = prompt('Paste your test code:');
                  if (code) setTestCode(code);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Paste Code
              </button>
            </div>
          </div>
        )}

        {/* Configuration Panels */}
        {testCode && (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-700 pb-2">
              <button
                onClick={() => setActiveTab('tests')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'tests'
                    ? 'bg-primary/20 text-primary'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <FileCode className="w-4 h-4" />
                Tests
                <span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">
                  {totalTests}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('environment')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'environment'
                    ? 'bg-primary/20 text-primary'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                Environment
              </button>
              <button
                onClick={() => setActiveTab('strategy')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'strategy'
                    ? 'bg-primary/20 text-primary'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Zap className="w-4 h-4" />
                Strategy
              </button>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Panel */}
              <div className="lg:col-span-2">
                {activeTab === 'tests' && (
                  <TestSelector
                    testCode={testCode}
                    selectedTests={selectedTests}
                    onSelectionChange={setSelectedTests}
                    framework={framework}
                  />
                )}

                {activeTab === 'environment' && (
                  <EnvironmentConfig
                    config={envConfig}
                    onConfigChange={setEnvConfig}
                  />
                )}

                {activeTab === 'strategy' && (
                  <ExecutionStrategy
                    framework={framework}
                    testCount={totalTests}
                    strategy={strategy}
                    onStrategyChange={setStrategy}
                  />
                )}
              </div>

              {/* Code Preview */}
              <div className="lg:col-span-1">
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden sticky top-4">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-sm text-slate-300 font-medium">Test Code</span>
                    <span className="text-xs text-slate-500">
                      {testCode.split('\n').length} lines
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="p-4 text-xs font-mono text-slate-400 whitespace-pre-wrap">
                      {testCode.length > 2000 ? testCode.slice(0, 2000) + '\n...' : testCode}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

// Wrap with Suspense for useSearchParams
export default function ExecutePage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    }>
      <ExecutePageContent />
    </Suspense>
  );
}
