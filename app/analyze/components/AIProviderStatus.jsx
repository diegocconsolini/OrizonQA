'use client';

/**
 * AI Provider Status Component
 *
 * Shows the current AI provider configuration on the Analyze page.
 * Allows inline provider and model selection with dynamic model fetching.
 * Inspired by ChatsAnalizer AISettings implementation.
 */

import { useState, useEffect, useCallback } from 'react';
import { Settings, Check, AlertCircle, Cpu, ExternalLink, ChevronDown, Zap, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AIProviderStatus({
  provider = 'claude',
  hasApiKey = false,
  lmStudioUrl = 'http://localhost:1234',
  claudeModel = 'claude-sonnet-4-20250514',
  lmStudioModel = '',
  isLoading = false,
  onProviderChange,
  onModelChange,
  onLmStudioUrlChange,
  onLmStudioModelChange
}) {
  // Model lists
  const [claudeModels, setClaudeModels] = useState([]);
  const [lmStudioModels, setLmStudioModels] = useState([]);

  // Loading and error states
  const [loadingModels, setLoadingModels] = useState({});
  const [modelErrors, setModelErrors] = useState({});

  // Dropdown states
  const [showClaudeDropdown, setShowClaudeDropdown] = useState(false);
  const [showLmDropdown, setShowLmDropdown] = useState(false);

  // Connection status
  const [lmServerConnected, setLmServerConnected] = useState(false);

  const isEditable = Boolean(onProviderChange && onModelChange);
  const isConfigured = provider === 'lmstudio' ? lmServerConnected : hasApiKey;

  // Fetch models from API
  const fetchModels = useCallback(async (providerType, baseUrl = '') => {
    const key = providerType;
    setLoadingModels(prev => ({ ...prev, [key]: true }));
    setModelErrors(prev => ({ ...prev, [key]: '' }));

    try {
      const params = new URLSearchParams({ provider: providerType });
      if (baseUrl) params.set('baseUrl', baseUrl);

      const response = await fetch(`/api/ai/models?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const { models } = await response.json();

      if (providerType === 'anthropic') {
        setClaudeModels(models);
      } else if (providerType === 'lmstudio') {
        setLmStudioModels(models);
        setLmServerConnected(models.length > 0);

        // Auto-select first model if none selected
        if (models.length > 0 && !lmStudioModel && onLmStudioModelChange) {
          onLmStudioModelChange(models[0].id);
        }
      }

      return models;
    } catch (error) {
      console.error(`Failed to fetch ${providerType} models:`, error);
      setModelErrors(prev => ({ ...prev, [key]: error.message }));

      if (providerType === 'lmstudio') {
        setLmServerConnected(false);
      }

      return [];
    } finally {
      setLoadingModels(prev => ({ ...prev, [key]: false }));
    }
  }, [lmStudioModel, onLmStudioModelChange]);

  // Fetch Claude models on mount
  useEffect(() => {
    fetchModels('anthropic');
  }, []);

  // Fetch LM Studio models when provider is lmstudio or URL changes
  useEffect(() => {
    if (provider === 'lmstudio' && lmStudioUrl) {
      fetchModels('lmstudio', lmStudioUrl);
    }
  }, [provider, lmStudioUrl, fetchModels]);

  // Get current model info
  const currentClaudeModel = claudeModels.find(m => m.id === claudeModel) || { name: claudeModel, description: '' };
  const currentLmModel = lmStudioModels.find(m => m.id === lmStudioModel) || { name: lmStudioModel || 'Select a model', description: '' };

  if (isLoading) {
    return (
      <div className="bg-surface-dark border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-lg animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-2" />
            <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-dark border border-white/10 rounded-xl p-6">
      {/* Provider Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-text-secondary-dark mb-3">AI Provider</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => isEditable && onProviderChange('claude')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              provider === 'claude'
                ? 'border-primary bg-primary/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            } ${!isEditable ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${provider === 'claude' ? 'bg-primary/20' : 'bg-white/5'}`}>
                <svg className={`w-5 h-5 ${provider === 'claude' ? 'text-primary' : 'text-text-secondary-dark'}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className={`font-semibold ${provider === 'claude' ? 'text-primary' : 'text-white'}`}>
                Anthropic Claude
              </span>
              {provider === 'claude' && <Check className="w-4 h-4 text-primary ml-auto" />}
            </div>
            <p className="text-xs text-text-secondary-dark">Cloud API (requires key)</p>
            {provider === 'claude' && !hasApiKey && (
              <p className="text-xs text-amber-400 mt-1">API key required</p>
            )}
          </button>

          <button
            type="button"
            onClick={() => isEditable && onProviderChange('lmstudio')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              provider === 'lmstudio'
                ? 'border-accent bg-accent/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            } ${!isEditable ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${provider === 'lmstudio' ? 'bg-accent/20' : 'bg-white/5'}`}>
                <Cpu className={`w-5 h-5 ${provider === 'lmstudio' ? 'text-accent' : 'text-text-secondary-dark'}`} />
              </div>
              <span className={`font-semibold ${provider === 'lmstudio' ? 'text-accent' : 'text-white'}`}>
                LM Studio
              </span>
              {provider === 'lmstudio' && <Check className="w-4 h-4 text-accent ml-auto" />}
            </div>
            <p className="text-xs text-text-secondary-dark">Local LLM (no API key)</p>
          </button>
        </div>
      </div>

      {/* Claude Model Selection */}
      {provider === 'claude' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-secondary-dark">Claude Model</h3>
            <button
              onClick={() => fetchModels('anthropic')}
              disabled={loadingModels.anthropic}
              className="p-1 text-text-secondary-dark hover:text-white transition-colors disabled:opacity-50"
              title="Refresh models"
            >
              <RefreshCw className={`w-4 h-4 ${loadingModels.anthropic ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => isEditable && setShowClaudeDropdown(!showClaudeDropdown)}
              disabled={loadingModels.anthropic}
              className={`w-full p-4 rounded-xl border-2 border-white/10 bg-white/5 text-left transition-all ${
                isEditable && !loadingModels.anthropic ? 'hover:border-white/20 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-white">{currentClaudeModel.name}</p>
                    <p className="text-xs text-text-secondary-dark">{currentClaudeModel.description}</p>
                  </div>
                </div>
                {loadingModels.anthropic ? (
                  <Loader2 className="w-5 h-5 text-text-secondary-dark animate-spin" />
                ) : isEditable && (
                  <ChevronDown className={`w-5 h-5 text-text-secondary-dark transition-transform ${showClaudeDropdown ? 'rotate-180' : ''}`} />
                )}
              </div>
            </button>

            {showClaudeDropdown && isEditable && claudeModels.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-dark border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                {claudeModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onModelChange(model.id);
                      setShowClaudeDropdown(false);
                    }}
                    className={`w-full p-4 text-left transition-all hover:bg-white/5 ${
                      claudeModel === model.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold ${claudeModel === model.id ? 'text-primary' : 'text-white'}`}>
                          {model.name}
                        </p>
                        <p className="text-xs text-text-secondary-dark">{model.description}</p>
                      </div>
                      {claudeModel === model.id && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {modelErrors.anthropic && (
            <p className="text-sm text-red-400 mt-2">{modelErrors.anthropic}</p>
          )}
        </div>
      )}

      {/* LM Studio Configuration */}
      {provider === 'lmstudio' && (
        <>
          {/* LM Studio URL */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-text-secondary-dark mb-3">LM Studio Endpoint</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={lmStudioUrl}
                onChange={(e) => onLmStudioUrlChange && onLmStudioUrlChange(e.target.value)}
                placeholder="http://localhost:1234"
                className="flex-1 px-4 py-3 bg-white/5 border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent font-mono text-sm"
              />
              <button
                onClick={() => fetchModels('lmstudio', lmStudioUrl)}
                disabled={loadingModels.lmstudio}
                className="px-4 py-3 bg-white/5 border-2 border-white/10 rounded-lg text-white hover:bg-white/10 transition-all disabled:opacity-50"
                title="Connect & fetch models"
              >
                {loadingModels.lmstudio ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* LM Studio Model Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-secondary-dark">LLM Model</h3>
              {lmServerConnected && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Connected
                </span>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => isEditable && lmStudioModels.length > 0 && setShowLmDropdown(!showLmDropdown)}
                disabled={loadingModels.lmstudio || lmStudioModels.length === 0}
                className={`w-full p-4 rounded-xl border-2 border-white/10 bg-white/5 text-left transition-all ${
                  isEditable && lmStudioModels.length > 0 ? 'hover:border-white/20 cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-accent" />
                    <div>
                      <p className="font-semibold text-white">
                        {lmStudioModels.length === 0 ? 'No models loaded' : currentLmModel.name}
                      </p>
                      <p className="text-xs text-text-secondary-dark">
                        {lmStudioModels.length === 0
                          ? 'Connect to LM Studio to load models'
                          : currentLmModel.description}
                      </p>
                    </div>
                  </div>
                  {loadingModels.lmstudio ? (
                    <Loader2 className="w-5 h-5 text-text-secondary-dark animate-spin" />
                  ) : lmStudioModels.length > 0 && isEditable && (
                    <ChevronDown className={`w-5 h-5 text-text-secondary-dark transition-transform ${showLmDropdown ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </button>

              {showLmDropdown && isEditable && lmStudioModels.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-dark border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                  {lmStudioModels.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onLmStudioModelChange && onLmStudioModelChange(model.id);
                        setShowLmDropdown(false);
                      }}
                      className={`w-full p-4 text-left transition-all hover:bg-white/5 ${
                        lmStudioModel === model.id ? 'bg-accent/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold ${lmStudioModel === model.id ? 'text-accent' : 'text-white'}`}>
                            {model.name}
                          </p>
                          <p className="text-xs text-text-secondary-dark">{model.description}</p>
                        </div>
                        {lmStudioModel === model.id && <Check className="w-4 h-4 text-accent" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {modelErrors.lmstudio && (
              <p className="text-sm text-red-400 mt-2">{modelErrors.lmstudio}</p>
            )}
          </div>
        </>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-green-400">Ready to analyze</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              <span className="text-sm text-amber-400">
                {provider === 'claude' ? 'API key required' : 'Connect to LM Studio'}
              </span>
            </>
          )}
        </div>
        <Link
          href="/settings?tab=llm-config"
          className="flex items-center gap-1 text-xs text-text-secondary-dark hover:text-white transition-colors"
        >
          <Settings className="w-3 h-3" />
          <span>Manage in Settings</span>
        </Link>
      </div>

      {/* Warning if not configured */}
      {!isConfigured && (
        <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-400">
              {provider === 'claude'
                ? 'Configure your Claude API key in Settings before analyzing code.'
                : 'Start LM Studio and click the refresh button to load models.'}
            </p>
            <Link
              href="/settings?tab=llm-config"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
            >
              Go to Settings
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
