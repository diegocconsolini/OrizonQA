'use client';

/**
 * API Key Input Component
 *
 * AI provider configuration with clear separation and explanations.
 * Uses ORIZON design system colors and styling.
 */

import { AlertCircle, Server, RefreshCw, CheckCircle, XCircle, Loader2, Key, Lock, Cpu, Cloud, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import useLMStudio from '../../hooks/useLMStudio';

export default function ApiKeyInput({
  provider,
  setProvider,
  apiKey,
  setApiKey,
  lmStudioUrl,
  setLmStudioUrl,
  selectedModel,
  setSelectedModel,
  model,
  usingSavedKey = false,
  setUsingSavedKey,
  savedKeyAvailable = false
}) {
  const [mounted, setMounted] = useState(false);
  const {
    testing,
    testStatus,
    testMessage,
    availableModels,
    loadingModels,
    testConnection,
    fetchModels,
    testPrompt
  } = useLMStudio();

  // Set mounted state on client only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch models when LM Studio URL changes (only after mount)
  useEffect(() => {
    if (mounted && provider === 'lmstudio' && lmStudioUrl) {
      fetchModels(lmStudioUrl);
    }
  }, [mounted, provider, lmStudioUrl, fetchModels]);

  const handleTestConnection = async () => {
    await testConnection(lmStudioUrl);
  };

  const handleTestPrompt = async () => {
    await testPrompt(lmStudioUrl, selectedModel);
  };

  return (
    <div className="bg-surface-dark rounded-2xl border border-white/10 p-5 md:p-6 mt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-accent/10 rounded-xl">
          <Cpu className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-white">AI Provider</h3>
          <p className="text-xs text-text-secondary-dark">
            Choose which AI powers your analysis
          </p>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="mb-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setProvider('claude')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              provider === 'claude'
                ? 'border-primary bg-primary/10'
                : 'border-white/10 bg-bg-dark hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Cloud className={`w-5 h-5 ${provider === 'claude' ? 'text-primary' : 'text-text-secondary-dark'}`} />
              <span className={`font-medium text-sm ${provider === 'claude' ? 'text-white' : 'text-text-secondary-dark'}`}>
                Claude AI
              </span>
            </div>
            <p className="text-xs text-text-muted-dark">
              Cloud-based • Best quality • Anthropic API
            </p>
          </button>

          <button
            onClick={() => setProvider('lmstudio')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              provider === 'lmstudio'
                ? 'border-primary bg-primary/10'
                : 'border-white/10 bg-bg-dark hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Server className={`w-5 h-5 ${provider === 'lmstudio' ? 'text-primary' : 'text-text-secondary-dark'}`} />
              <span className={`font-medium text-sm ${provider === 'lmstudio' ? 'text-white' : 'text-text-secondary-dark'}`}>
                LM Studio
              </span>
            </div>
            <p className="text-xs text-text-muted-dark">
              Local • Privacy-focused • Your own models
            </p>
          </button>
        </div>
      </div>

      {/* Claude API Key Section */}
      {provider === 'claude' && (
        <div className="space-y-4">
          {/* How it works explanation */}
          <div className="p-3 bg-bg-dark rounded-xl border border-white/5">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-text-secondary-dark">
                <p className="mb-1">
                  <strong className="text-white">How it works:</strong> Your API key is sent directly to Anthropic's servers.
                  We never store or log your key.
                </p>
                <p>
                  {savedKeyAvailable
                    ? 'You have a saved key in Settings (encrypted). You can also use a different key for this session.'
                    : 'Save your key in Settings for convenience, or enter one just for this session.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Saved Key Indicator & Toggle */}
          {savedKeyAvailable && (
            <div className={`flex items-center justify-between p-3 rounded-xl border ${
              usingSavedKey
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-bg-dark border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                {usingSavedKey ? (
                  <Lock className="text-green-400" size={16} />
                ) : (
                  <Key className="text-text-secondary-dark" size={16} />
                )}
                <span className={`text-sm font-medium ${usingSavedKey ? 'text-green-200' : 'text-text-secondary-dark'}`}>
                  {usingSavedKey ? 'Using encrypted key from Settings' : 'Saved API key available'}
                </span>
              </div>
              <button
                onClick={() => {
                  if (usingSavedKey) {
                    setUsingSavedKey(false);
                    setApiKey('');
                  } else {
                    setUsingSavedKey(true);
                  }
                }}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-all"
              >
                {usingSavedKey ? 'Use Custom Key' : 'Use Saved Key'}
              </button>
            </div>
          )}

          {/* API Key Input */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-text-secondary-dark mb-2 font-medium">
                Claude API Key
                {usingSavedKey && savedKeyAvailable && (
                  <span className="ml-2 text-xs text-green-400 font-normal">Auto-loaded</span>
                )}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={usingSavedKey ? '••••••••••••••••••••' : 'sk-ant-api03-...'}
                disabled={usingSavedKey && savedKeyAvailable}
                className={`w-full bg-bg-dark border border-white/10 rounded-xl p-3 text-sm text-white
                         placeholder-text-muted-dark focus:outline-none focus:border-primary/50
                         focus:ring-2 focus:ring-primary/20 transition-all ${
                  usingSavedKey && savedKeyAvailable ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm text-text-secondary-dark mb-2 font-medium">Model</label>
              <div className="bg-bg-dark border border-white/10 rounded-xl p-3 text-sm text-text-muted-dark">
                {model.replace('claude-', '').replace(/-\d+$/, '')}
              </div>
            </div>
          </div>

          {/* Get API Key Link */}
          {!savedKeyAvailable && !apiKey && (
            <p className="text-xs text-text-muted-dark">
              Don't have an API key?{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline"
              >
                Get one from Anthropic Console
              </a>
            </p>
          )}
        </div>
      )}

      {/* LM Studio Configuration */}
      {provider === 'lmstudio' && (
        <div className="space-y-4">
          {/* How it works explanation */}
          <div className="p-3 bg-bg-dark rounded-xl border border-white/5">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-text-secondary-dark">
                <p>
                  <strong className="text-white">Local AI:</strong> Connects to LM Studio running on your machine.
                  No data leaves your network. Make sure LM Studio is running with a model loaded.
                </p>
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm text-text-secondary-dark mb-2 font-medium">
              LM Studio URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lmStudioUrl}
                onChange={(e) => setLmStudioUrl(e.target.value)}
                placeholder="http://192.168.2.101:1234"
                className="flex-1 bg-bg-dark border border-white/10 rounded-xl p-3 text-sm text-white
                         placeholder-text-muted-dark focus:outline-none focus:border-primary/50
                         focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                onClick={handleTestConnection}
                disabled={testing || !lmStudioUrl}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50
                         disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white
                         transition-all flex items-center gap-2 border border-white/10"
              >
                {testing ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
                Test
              </button>
            </div>
          </div>

          {/* Test Status */}
          {testStatus && (
            <div className={`p-3 rounded-xl border ${
              testStatus === 'success'
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-start gap-2">
                {testStatus === 'success' ? (
                  <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                ) : (
                  <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                )}
                <span className={`text-sm ${
                  testStatus === 'success' ? 'text-green-200' : 'text-red-200'
                }`}>
                  {testMessage}
                </span>
              </div>
            </div>
          )}

          {/* Model Selection */}
          {availableModels.length > 0 && (
            <div>
              <label className="block text-sm text-text-secondary-dark mb-2 font-medium">
                Active Model
                {loadingModels && <Loader2 className="inline animate-spin ml-2 text-primary" size={12} />}
              </label>
              <select
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-bg-dark border border-white/10 rounded-xl p-3 text-sm text-white
                         focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                         transition-all cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">Auto-detect</option>
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted-dark mt-2">
                {availableModels.length} model(s) available
              </p>
            </div>
          )}

          {/* Test Prompt Button */}
          {availableModels.length > 0 && (
            <button
              onClick={handleTestPrompt}
              disabled={testing}
              className="w-full px-4 py-3 bg-primary/10 hover:bg-primary/20 disabled:opacity-50
                       disabled:cursor-not-allowed rounded-xl text-sm font-medium text-primary
                       transition-all flex items-center justify-center gap-2 border border-primary/30"
            >
              {testing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Testing...
                </>
              ) : (
                <>
                  <Server size={16} />
                  Test with Sample Prompt
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
