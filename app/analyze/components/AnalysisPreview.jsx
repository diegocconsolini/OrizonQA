'use client';

/**
 * Analysis Preview Component
 *
 * Shows users exactly what they'll get from their analysis:
 * - What artifacts will be generated
 * - Whether tests will be executable
 * - What config changes are needed for different outputs
 *
 * Solves the UX problem: "I don't know what I'll get from my inputs"
 */

import { useMemo } from 'react';
import {
  Play, FileText, CheckSquare, TestTube, AlertTriangle, Info,
  Code, Sparkles, ArrowRight, Check, X
} from 'lucide-react';
import { classifyFiles, CATEGORIES } from '@/lib/fileClassifier';

// Executable test frameworks
const EXECUTABLE_FRAMEWORKS = ['jest', 'vitest', 'mocha', 'pytest', 'junit'];

export default function AnalysisPreview({
  selectedFiles = [],
  config = {},
  className = ''
}) {
  // Classify selected files
  const classification = useMemo(() => {
    if (selectedFiles.length === 0) return null;
    return classifyFiles(selectedFiles);
  }, [selectedFiles]);

  // Determine what will be generated
  const preview = useMemo(() => {
    if (!classification) return null;

    const { testFramework = 'generic', outputFormat = 'markdown' } = config;
    const isExecutableFramework = EXECUTABLE_FRAMEWORKS.includes(testFramework);
    const isCodeOutput = ['javascript', 'typescript', 'python', 'java'].includes(outputFormat) ||
                         isExecutableFramework;

    // Count file types
    const codeFiles = [];
    const testFiles = [];
    const configFiles = [];
    const otherFiles = [];

    Object.entries(classification).forEach(([catId, cat]) => {
      if (!cat.files || cat.files.length === 0) return;

      if (catId === 'tests') {
        testFiles.push(...cat.files);
      } else if (catId === 'config' || catId === 'build') {
        configFiles.push(...cat.files);
      } else if (['frontend', 'backend', 'api', 'database', 'utilities'].includes(catId)) {
        codeFiles.push(...cat.files);
      } else {
        otherFiles.push(...cat.files);
      }
    });

    // Determine outputs
    const outputs = [];

    if (config.userStories !== false) {
      outputs.push({
        id: 'userStories',
        name: 'User Stories',
        icon: FileText,
        description: 'Requirements and user scenarios',
        executable: false,
        basedOn: codeFiles.length > 0 ? 'code files' : 'all files'
      });
    }

    if (config.testCases !== false) {
      outputs.push({
        id: 'testCases',
        name: 'Test Cases',
        icon: TestTube,
        description: isExecutableFramework
          ? `Executable ${testFramework.toUpperCase()} tests`
          : 'Test case documentation (not executable)',
        executable: isExecutableFramework,
        basedOn: codeFiles.length > 0 ? 'code files' : 'all files',
        framework: testFramework
      });
    }

    if (config.acceptanceCriteria !== false) {
      outputs.push({
        id: 'acceptanceCriteria',
        name: 'Acceptance Criteria',
        icon: CheckSquare,
        description: 'Pass/fail criteria for features',
        executable: false,
        basedOn: codeFiles.length > 0 ? 'code files' : 'all files'
      });
    }

    return {
      codeFiles,
      testFiles,
      configFiles,
      otherFiles,
      outputs,
      isExecutableFramework,
      testFramework,
      canExecuteTests: isExecutableFramework && codeFiles.length > 0
    };
  }, [classification, config]);

  if (!preview || selectedFiles.length === 0) {
    return null;
  }

  const { codeFiles, testFiles, configFiles, outputs, isExecutableFramework, testFramework, canExecuteTests } = preview;

  return (
    <div className={`bg-surface-dark border border-white/10 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-white">What You'll Get</h3>
      </div>

      {/* Input Summary */}
      <div className="mb-4 p-3 bg-bg-dark/50 rounded-lg">
        <div className="text-xs text-text-secondary-dark mb-2">Your Input:</div>
        <div className="flex flex-wrap gap-2">
          {codeFiles.length > 0 && (
            <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
              <Code className="w-3 h-3 inline mr-1" />
              {codeFiles.length} code file{codeFiles.length !== 1 ? 's' : ''}
            </span>
          )}
          {testFiles.length > 0 && (
            <span className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
              <TestTube className="w-3 h-3 inline mr-1" />
              {testFiles.length} test file{testFiles.length !== 1 ? 's' : ''}
            </span>
          )}
          {configFiles.length > 0 && (
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400">
              {configFiles.length} config file{configFiles.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center mb-4">
        <ArrowRight className="w-5 h-5 text-text-secondary-dark" />
      </div>

      {/* Output Preview */}
      <div className="space-y-2 mb-4">
        {outputs.map(output => (
          <div
            key={output.id}
            className={`p-3 rounded-lg border ${
              output.executable
                ? 'bg-green-500/5 border-green-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <output.icon className={`w-4 h-4 mt-0.5 ${
                output.executable ? 'text-green-400' : 'text-text-secondary-dark'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{output.name}</span>
                  {output.executable && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 rounded text-xs text-green-400">
                      <Play className="w-3 h-3" />
                      Executable
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary-dark mt-0.5">
                  {output.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Execution Status Banner */}
      {config.testCases !== false && (
        <div className={`p-3 rounded-lg ${
          canExecuteTests
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-amber-500/10 border border-amber-500/30'
        }`}>
          {canExecuteTests ? (
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-200 font-medium">
                  Tests will be executable
                </p>
                <p className="text-xs text-green-300/70 mt-0.5">
                  Using {testFramework.toUpperCase()} framework. You can run tests with the Execute button after analysis.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-200 font-medium">
                  Tests will be documentation only
                </p>
                <p className="text-xs text-amber-300/70 mt-0.5">
                  Current framework: <strong>{testFramework || 'generic'}</strong>.
                  To get executable tests, change to Jest, Vitest, or Mocha in Output Settings.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      {codeFiles.length === 0 && selectedFiles.length > 0 && (
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-200 font-medium">
                Tip: Select source code files
              </p>
              <p className="text-xs text-blue-300/70 mt-0.5">
                For best test generation, select your application's source code files
                (e.g., .js, .ts, .py files in src/ or app/ folders), not just config or test files.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
