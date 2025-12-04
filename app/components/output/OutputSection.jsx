import { useState } from 'react';
import { Copy, Download, Check, Upload, Play } from 'lucide-react';
import Tab from '../shared/Tab';
import ImportTestsModal from '../modals/ImportTestsModal';
import ExecuteButton from '@/app/execute/components/ExecuteButton';

export default function OutputSection({ results }) {
  const [outputTab, setOutputTab] = useState('stories');
  const [copied, setCopied] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

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

      <div className="flex justify-between items-center gap-3 p-4 pt-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            disabled={!results.testCases && !results.userStories}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-all"
          >
            <Upload size={16} />
            Save to Project
          </button>

          {results.testCases && (
            <ExecuteButton
              testCode={results.testCases}
              framework="auto"
              disabled={!results.testCases}
              size="md"
            />
          )}
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

      <ImportTestsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        testCasesText={results.testCases}
        userStoriesText={results.userStories}
      />
    </div>
  );
}
