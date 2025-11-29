'use client';

import { useState, useCallback } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

// Components
import Header from './components/shared/Header';
import HelpModal from './components/shared/HelpModal';
import Alert from './components/shared/Alert';
import InputSection from './components/input/InputSection';
import ConfigSection from './components/config/ConfigSection';
import ApiKeyInput from './components/config/ApiKeyInput';
import OutputSection from './components/output/OutputSection';

// Hooks
import useAnalysis from './hooks/useAnalysis';
import useFileUpload from './hooks/useFileUpload';
import useGitHubFetch from './hooks/useGitHubFetch';

export default function Home() {
  // Input states
  const [inputTab, setInputTab] = useState('paste');
  const [codeInput, setCodeInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Config states
  const [config, setConfig] = useState({
    userStories: true,
    testCases: true,
    acceptanceCriteria: true,
    edgeCases: false,
    securityTests: false,
    outputFormat: 'markdown',
    testFramework: 'generic',
    additionalContext: ''
  });

  // API states
  const [apiKey, setApiKey] = useState('');
  const model = 'claude-sonnet-4-20250514';

  // Custom hooks
  const {
    loading: analysisLoading,
    error,
    success,
    results,
    tokenUsage,
    analyzeCodebase,
    clearResults,
    setError,
    setSuccess
  } = useAnalysis();

  const {
    uploadedFiles,
    setUploadedFiles,
    isDragging,
    setIsDragging,
    handleDrop,
    handleFileSelect,
    clearFiles
  } = useFileUpload(setError, setSuccess);

  const {
    githubUrl,
    setGithubUrl,
    githubBranch,
    setGithubBranch,
    loading: githubLoading,
    fetchGitHub
  } = useGitHubFetch(setUploadedFiles, setInputTab, setError, setSuccess);

  const loading = analysisLoading || githubLoading;

  // Calculate token estimate
  const getInputContent = useCallback(() => {
    if (inputTab === 'paste') return codeInput;
    if (inputTab === 'upload' || uploadedFiles.length > 0) {
      return uploadedFiles.map(f => `=== FILE: ${f.name} ===\n${f.content}`).join('\n\n');
    }
    return '';
  }, [inputTab, codeInput, uploadedFiles]);

  const estimatedTokens = Math.ceil(getInputContent().length / 4);
  const isTruncated = getInputContent().length > 100000;

  const handleAnalyze = async () => {
    const content = getInputContent();
    const initialTab = await analyzeCodebase(content, apiKey, config, model);
    // OutputSection handles its own tab state
  };

  const clearAll = () => {
    setCodeInput('');
    clearFiles();
    setGithubUrl('');
    clearResults();
  };

  const canAnalyze = apiKey && (codeInput.trim() || uploadedFiles.length > 0);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Header onHelpClick={() => setShowHelp(!showHelp)} />

        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <InputSection
          inputTab={inputTab}
          setInputTab={setInputTab}
          codeInput={codeInput}
          setCodeInput={setCodeInput}
          githubUrl={githubUrl}
          setGithubUrl={setGithubUrl}
          githubBranch={githubBranch}
          setGithubBranch={setGithubBranch}
          fetchGitHub={fetchGitHub}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          handleDrop={handleDrop}
          handleFileSelect={handleFileSelect}
          loading={loading}
          estimatedTokens={estimatedTokens}
          isTruncated={isTruncated}
        />

        <ConfigSection config={config} setConfig={setConfig} />

        <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} model={model} />

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || loading}
            className={`flex-1 py-4 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-3 ${
              canAnalyze && !loading
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25 hover:shadow-indigo-500/40'
                : 'bg-slate-700 cursor-not-allowed shadow-none'
            } ${loading ? 'loading-glow' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Analyzing your codebase...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Analyze Codebase</span>
              </>
            )}
          </button>
          <button
            onClick={clearAll}
            className="px-6 py-4 bg-slate-800/70 hover:bg-slate-700/70 rounded-xl font-medium text-slate-300 hover:text-white transition-all border border-slate-700/50"
          >
            Clear All
          </button>
        </div>

        {tokenUsage && (
          <div className="text-sm text-slate-400 text-center mb-6 p-3 bg-slate-800/30 rounded-xl">
            <span className="text-indigo-400 font-medium">{tokenUsage.input.toLocaleString()}</span> input tokens •
            <span className="text-purple-400 font-medium ml-1">{tokenUsage.output.toLocaleString()}</span> output tokens
          </div>
        )}

        <OutputSection results={results} />

        <div className="text-center mt-8 text-xs text-slate-500">
          Built with Claude AI • Your API key is never stored
        </div>
      </div>
    </div>
  );
}
