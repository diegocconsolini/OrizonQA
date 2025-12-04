import { useState, useMemo } from 'react';
import { Copy, Download, Check, Upload, Play, AlertCircle, Info } from 'lucide-react';
import Tab from '../shared/Tab';
import ImportTestsModal from '../modals/ImportTestsModal';
import ExecuteButton from '@/app/execute/components/ExecuteButton';

/**
 * Check if test code appears to be executable JavaScript
 * @param {string} code - Test code to check
 * @returns {{isExecutable: boolean, reason: string}}
 */
function checkExecutability(code) {
  if (!code || code.trim().length === 0) {
    return { isExecutable: false, reason: 'No test code available' };
  }

  // Check for common test function patterns
  const hasTestFunctions = /\b(describe|test|it)\s*\(/.test(code);
  if (!hasTestFunctions) {
    return {
      isExecutable: false,
      reason: 'No test functions found. Tests must use describe(), test(), or it() functions.'
    };
  }

  // Check for common non-code patterns (markdown)
  const hasMarkdownHeaders = /^#+\s/m.test(code);
  const hasMarkdownBullets = /^[\s]*[-*]\s/m.test(code);
  const looksLikeMarkdown = hasMarkdownHeaders || (hasMarkdownBullets && !hasTestFunctions);

  if (looksLikeMarkdown && !code.includes('```')) {
    return {
      isExecutable: false,
      reason: 'Output appears to be documentation, not executable code. Select "Jest", "Vitest", or "Mocha" as test framework in Configure tab.'
    };
  }

  // Check for expect/assert patterns (indicates actual test code)
  const hasAssertions = /\b(expect|assert|should)\s*[.(]/.test(code);
  if (!hasAssertions) {
    return {
      isExecutable: false,
      reason: 'No assertion statements found. Executable tests need expect() or assert() calls.'
    };
  }

  // Basic syntax check - look for obvious JS patterns
  const hasJsSyntax = /\b(const|let|var|function|async|await|import|export|=>)\b/.test(code);
  if (!hasJsSyntax) {
    return {
      isExecutable: false,
      reason: 'Code doesn\'t appear to be JavaScript. Configure test framework in settings.'
    };
  }

  return { isExecutable: true, reason: 'Tests can be executed in browser' };
}

export default function OutputSection({ results }) {
  const [outputTab, setOutputTab] = useState('stories');
  const [copied, setCopied] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExecuteInfo, setShowExecuteInfo] = useState(false);

  // Check if test code is executable
  const executability = useMemo(() => {
    return checkExecutability(results?.testCases);
  }, [results?.testCases]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content, filename, type = 'text/markdown') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCurrentOutput = () => {
    switch (outputTab) {
      case 'stories': return results.userStories;
      case 'tests': return results.testCases;
      case 'criteria': return results.acceptanceCriteria;
      case 'raw': return JSON.stringify(results.raw, null, 2);
      default: return '';
    }
  };

  if (!results.userStories && !results.testCases && !results.acceptanceCriteria && !results.raw) {
    return null;
  }

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden fade-in">
      <div className="flex gap-2 p-3 border-b border-slate-700/50 bg-slate-800/30 flex-wrap">
        <Tab active={outputTab === 'stories'} onClick={() => setOutputTab('stories')}>
          User Stories
        </Tab>
        <Tab active={outputTab === 'tests'} onClick={() => setOutputTab('tests')}>
          Test Cases
        </Tab>
        <Tab active={outputTab === 'criteria'} onClick={() => setOutputTab('criteria')}>
          Acceptance Criteria
        </Tab>
        <Tab active={outputTab === 'raw'} onClick={() => setOutputTab('raw')}>
          Raw JSON
        </Tab>
      </div>

      <div className="p-4 md:p-5">
        <div className="bg-slate-900/70 rounded-xl p-4 md:p-5 min-h-64 max-h-[500px] overflow-y-auto border border-slate-700/30">
          <pre className="whitespace-pre-wrap text-sm font-mono text-slate-300 leading-relaxed">
            {getCurrentOutput() || 'No content generated for this section.'}
          </pre>
        </div>
      </div>

      <div className="flex justify-between items-center gap-3 p-4 pt-0 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            disabled={!results.testCases && !results.userStories}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-all"
          >
            <Upload size={16} />
            Save to Project
          </button>

          {/* Execute Button - Only shown when tests are executable */}
          {results.testCases && executability.isExecutable ? (
            <ExecuteButton
              testCode={results.testCases}
              framework="auto"
              size="md"
            />
          ) : results.testCases ? (
            <div className="relative">
              <button
                onClick={() => setShowExecuteInfo(!showExecuteInfo)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 rounded-xl text-sm font-medium text-slate-400 cursor-help"
                title={executability.reason}
              >
                <Play size={16} className="opacity-50" />
                <span>Execute Tests</span>
                <Info size={14} className="text-amber-400" />
              </button>

              {/* Info Tooltip */}
              {showExecuteInfo && (
                <div className="absolute bottom-full left-0 mb-2 w-80 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-200 font-medium mb-1">Cannot Execute Tests</p>
                      <p className="text-xs text-slate-400">{executability.reason}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Tip: In the Configure tab, set "Test Framework" to Jest, Vitest, or Mocha to generate executable code.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExecuteInfo(false)}
                    className="absolute top-1 right-1 p-1 text-slate-500 hover:text-slate-300"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => copyToClipboard(getCurrentOutput())}
            disabled={!getCurrentOutput()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/70 hover:bg-slate-600/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-slate-200 transition-all"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => downloadFile(
              getCurrentOutput(),
              `qa-${outputTab}-${Date.now()}.${outputTab === 'raw' ? 'json' : 'md'}`
            )}
            disabled={!getCurrentOutput()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/70 hover:bg-slate-600/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-slate-200 transition-all"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>

      {/* Execution Info Banner - shown when viewing test tab with non-executable tests */}
      {outputTab === 'tests' && results.testCases && !executability.isExecutable && (
        <div className="mx-4 mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="text-amber-200">These test cases are documentation only.</span>
              <span className="text-slate-400 ml-1">
                To generate executable tests, select a test framework (Jest, Vitest, or Mocha) in the Configure tab before analyzing.
              </span>
            </div>
          </div>
        </div>
      )}

      <ImportTestsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        testCasesText={results.testCases}
        userStoriesText={results.userStories}
      />
    </div>
  );
}
