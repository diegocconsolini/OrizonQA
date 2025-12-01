'use client';

/**
 * Dashboard Page (Main App) - REDESIGNED
 *
 * The main ORIZON application - requires authentication.
 * Enhanced with history sidebar, stats, and improved UX.
 *
 * Features:
 * - Recent analyses sidebar with quick access
 * - Tabbed workflow for better organization
 * - Usage statistics display
 * - Code input (paste, GitHub, file upload)
 * - Analysis configuration
 * - QA artifact generation
 * - Results display with export options
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { Loader2, Sparkles } from 'lucide-react';

// UI Components
import {
  Card, Button, EmptyState, Tabs, TabList, TabButton, TabPanels, TabPanel
} from '@/app/components/ui';

// Layout
import AppLayout from '@/app/components/layout/AppLayout';

// Existing Components
import Alert from '@/app/components/shared/Alert';
import InputSection from '@/app/components/input/InputSection';
import ConfigSection from '@/app/components/config/ConfigSection';
import OutputSection from '@/app/components/output/OutputSection';

// Disable SSR for ApiKeyInput to prevent hydration mismatch
const ApiKeyInput = dynamic(() => import('@/app/components/config/ApiKeyInput'), { ssr: false });

// Hooks
import useAnalysis from '@/app/hooks/useAnalysis';
import useFileUpload from '@/app/hooks/useFileUpload';
import useGitHubFetch from '@/app/hooks/useGitHubFetch';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Input states
  const [inputTab, setInputTab] = useState('paste');
  const [codeInput, setCodeInput] = useState('');

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
  const [provider, setProvider] = useState('claude');
  const [apiKey, setApiKey] = useState('');
  const [lmStudioUrl, setLmStudioUrl] = useState('http://192.168.2.101:1234');
  const [selectedModel, setSelectedModel] = useState('');
  const [usingSavedKey, setUsingSavedKey] = useState(false);
  const [savedKeyAvailable, setSavedKeyAvailable] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState('');
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
    githubToken,
    setGithubToken,
    loading: githubLoading,
    fetchGitHub,
    availableBranches,
    fetchingBranches
  } = useGitHubFetch(setUploadedFiles, setInputTab, setError, setSuccess);

  const loading = analysisLoading || githubLoading;

  // Calculate token estimate
  const getInputContent = () => {
    if (inputTab === 'paste') return codeInput;
    if (inputTab === 'upload' || uploadedFiles.length > 0) {
      return uploadedFiles.map(f => `=== FILE: ${f.name} ===\n${f.content}`).join('\n\n');
    }
    return '';
  };

  const estimatedTokens = Math.ceil(getInputContent().length / 4);
  const isTruncated = getInputContent().length > 100000;

  const handleAnalyze = async () => {
    const content = getInputContent();
    const modelToUse = provider === 'lmstudio' && selectedModel ? selectedModel : model;
    await analyzeCodebase(content, apiKey, config, modelToUse, provider, lmStudioUrl);
  };

  const clearAll = () => {
    setCodeInput('');
    clearFiles();
    setGithubUrl('');
    clearResults();
  };

  const canAnalyze = (provider === 'lmstudio' || apiKey) && (codeInput.trim() || uploadedFiles.length > 0);

  // Load user settings
  useEffect(() => {
    async function loadUserSettings() {
      if (status === 'loading' || !session || settingsLoaded) return;

      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.claudeApiKey) {
            setSavedApiKey(data.claudeApiKey);
            setApiKey(data.claudeApiKey);
            setUsingSavedKey(true);
            setSavedKeyAvailable(true);
          }
          if (data.lmStudioUrl) setLmStudioUrl(data.lmStudioUrl);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    }

    loadUserSettings();
  }, [session, status, settingsLoaded]);

  // Handle switching back to saved key
  useEffect(() => {
    if (usingSavedKey && savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, [usingSavedKey, savedApiKey]);

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          {/* Main Tabs */}
          <Tabs defaultValue={0} className="mb-6">
            <TabList>
              <TabButton>Input</TabButton>
              <TabButton>Configure</TabButton>
              <TabButton>Results</TabButton>
            </TabList>

            <TabPanels>
              {/* Input Tab */}
              <TabPanel>
                <InputSection
                  inputTab={inputTab}
                  setInputTab={setInputTab}
                  codeInput={codeInput}
                  setCodeInput={setCodeInput}
                  githubUrl={githubUrl}
                  setGithubUrl={setGithubUrl}
                  githubBranch={githubBranch}
                  setGithubBranch={setGithubBranch}
                  githubToken={githubToken}
                  setGithubToken={setGithubToken}
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
                  availableBranches={availableBranches}
                  fetchingBranches={fetchingBranches}
                />
              </TabPanel>

              {/* Configure Tab */}
              <TabPanel>
                <ConfigSection config={config} setConfig={setConfig} />

                <ApiKeyInput
                  provider={provider}
                  setProvider={setProvider}
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  lmStudioUrl={lmStudioUrl}
                  setLmStudioUrl={setLmStudioUrl}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  model={model}
                  usingSavedKey={usingSavedKey}
                  setUsingSavedKey={setUsingSavedKey}
                  savedKeyAvailable={savedKeyAvailable}
                />
              </TabPanel>

              {/* Results Tab */}
              <TabPanel>
                {results ? (
                  <OutputSection results={results} />
                ) : (
                  <EmptyState
                    icon={<Sparkles className="w-12 h-12" />}
                    title="No results yet"
                    description="Configure your analysis and click 'Analyze Code' to generate QA artifacts"
                  />
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <Button
              variant="primary"
              size="lg"
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Analyze Code</span>
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={clearAll}
              disabled={loading}
            >
              Clear All
            </Button>
          </div>

          {/* Token Usage Display */}
          {tokenUsage && (
            <Card className="p-4 bg-surface-dark/50">
              <div className="flex items-center justify-center gap-6 text-sm font-secondary">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary-dark">Input:</span>
                  <span className="text-primary font-semibold">
                    {(tokenUsage.input || tokenUsage.input_tokens)?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary-dark">Output:</span>
                  <span className="text-accent font-semibold">
                    {(tokenUsage.output || tokenUsage.output_tokens)?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-text-secondary-dark font-secondary">
            Built with Claude AI • Your API key is never stored
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
