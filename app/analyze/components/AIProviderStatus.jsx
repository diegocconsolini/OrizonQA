'use client';

/**
 * AI Provider Status Component
 *
 * Collapsible panel showing AI provider configuration.
 * Displays a compact summary when collapsed, full settings when expanded.
 */

import { useState, useEffect, useCallback } from 'react';
import { Settings, Check, AlertCircle, Cpu, ExternalLink, ChevronDown, Zap, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AIProviderStatus({
  provider = 'claude',
  hasApiKey = false,
  apiKey = '',
  lmStudioUrl = 'http://localhost:1234',
  claudeModel = 'claude-sonnet-4-20250514',
  lmStudioModel = '',
  isLoading = false,
  onProviderChange,
  onModelChange,
  onLmStudioUrlChange,
  onLmStudioModelChange
}) {
  // Collapsed state - default to collapsed
  const [isExpanded, setIsExpanded] = useState(false);

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
  const fetchModels = useCallback(async (providerType, baseUrl = '', claudeApiKey = '') => {
    const key = providerType;
    setLoadingModels(prev => ({ ...prev, [key]: true }));
    setModelErrors(prev => ({ ...prev, [key]: '' }));

    try {
      const params = new URLSearchParams({ provider: providerType });
      if (baseUrl) params.set('baseUrl', baseUrl);

      const headers = { 'Content-Type': 'application/json' };
      if (providerType === 'anthropic' && claudeApiKey) {
        headers['X-Claude-Api-Key'] = claudeApiKey;
      }

      const response = await fetch(`/api/ai/models?${params}`, { headers });

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

  // Fetch Claude models when API key is available
  useEffect(() => {
    if (apiKey) {
      fetchModels('anthropic', '', apiKey);
    }
  }, [apiKey]);

  // Fetch LM Studio models when provider is lmstudio or URL changes
  useEffect(() => {
    if (provider === 'lmstudio' && lmStudioUrl) {
      fetchModels('lmstudio', lmStudioUrl);
    }
  }, [provider, lmStudioUrl, fetchModels]);

  // Get current model info
  const currentClaudeModel = claudeModels.find(m => m.id === claudeModel) || { name: claudeModel, description: '' };
  const currentLmModel = lmStudioModels.find(m => m.id === lmStudioModel) || { name: lmStudioModel || 'No model', description: '' };

  // Get display name for current model
  const currentModelName = provider === 'claude' ? currentClaudeModel.name : currentLmModel.name;
  const providerName = provider === 'claude' ? 'Claude' : 'LM Studio';

  if (isLoading) {
    return (
      <div className="bg-surface-dark border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-dark border border-white/10 rounded-xl overflow-hidden">
      {/* Collapsed Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${provider === 'claude' ? 'bg-primary/20' : 'bg-accent/20'}`}>
            {provider === 'claude' ? (
              <Zap className="w-4 h-4 text-primary" />
            ) : (
              <Cpu className="w-4 h-4 text-accent" />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{providerName}</span>
              <span className="text-text-secondary-dark">•</span>
              <span className="text-sm text-text-secondary-dark">{currentModelName}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {isConfigured ? (
                <>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-xs text-green-400">Ready</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  <span className="text-xs text-amber-400">
                    {provider === 'claude' ? 'API key required' : 'Not connected'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-text-secondary-dark transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4">
          {/* Provider Selection */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-text-secondary-dark uppercase tracking-wider mb-2">Provider</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => isEditable && onProviderChange('claude')}
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  provider === 'claude'
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                } ${!isEditable ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${provider === 'claude' ? 'text-primary' : 'text-text-secondary-dark'}`} />
                  <span className={`text-sm font-medium ${provider === 'claude' ? 'text-primary' : 'text-white'}`}>
                    Claude
                  </span>
                  {provider === 'claude' && <Check className="w-3 h-3 text-primary ml-auto" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => isEditable && onProviderChange('lmstudio')}
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  provider === 'lmstudio'
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                } ${!isEditable ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2">
                  <Cpu className={`w-4 h-4 ${provider === 'lmstudio' ? 'text-accent' : 'text-text-secondary-dark'}`} />
                  <span className={`text-sm font-medium ${provider === 'lmstudio' ? 'text-accent' : 'text-white'}`}>
                    LM Studio
                  </span>
                  {provider === 'lmstudio' && <Check className="w-3 h-3 text-accent ml-auto" />}
                </div>
              </button>
            </div>
          </div>

          {/* Claude Model Selection */}
          {provider === 'claude' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-text-secondary-dark uppercase tracking-wider">Model</h3>
                <button
                  onClick={() => fetchModels('anthropic', '', apiKey)}
                  disabled={loadingModels.anthropic || !apiKey}
                  className="p-1 text-text-secondary-dark hover:text-white transition-colors disabled:opacity-50"
                  title="Refresh models"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingModels.anthropic ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => isEditable && setShowClaudeDropdown(!showClaudeDropdown)}
                  disabled={loadingModels.anthropic}
                  className={`w-full p-3 rounded-lg border border-white/10 bg-white/5 text-left transition-all ${
                    isEditable && !loadingModels.anthropic ? 'hover:border-white/20 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{currentClaudeModel.name}</p>
                      <p className="text-xs text-text-secondary-dark">{currentClaudeModel.description}</p>
                    </div>
                    {loadingModels.anthropic ? (
                      <Loader2 className="w-4 h-4 text-text-secondary-dark animate-spin" />
                    ) : isEditable && (
                      <ChevronDown className={`w-4 h-4 text-text-secondary-dark transition-transform ${showClaudeDropdown ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </button>

                {showClaudeDropdown && isEditable && claudeModels.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-dark border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    {claudeModels.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          onModelChange(model.id);
                          setShowClaudeDropdown(false);
                        }}
                        className={`w-full p-3 text-left transition-all hover:bg-white/5 ${
                          claudeModel === model.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${claudeModel === model.id ? 'text-primary' : 'text-white'}`}>
                              {model.name}
                            </p>
                            <p className="text-xs text-text-secondary-dark">{model.description}</p>
                          </div>
                          {claudeModel === model.id && <Check className="w-3 h-3 text-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {modelErrors.anthropic && (
                <p className="text-xs text-red-400 mt-1">{modelErrors.anthropic}</p>
              )}
            </div>
          )}

          {/* LM Studio Configuration */}
          {provider === 'lmstudio' && (
            <>
              {/* LM Studio URL */}
              <div className="mb-4">
                <h3 className="text-xs font-medium text-text-secondary-dark uppercase tracking-wider mb-2">Endpoint</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lmStudioUrl}
                    onChange={(e) => onLmStudioUrlChange && onLmStudioUrlChange(e.target.value)}
                    placeholder="http://localhost:1234"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-text-secondary-dark focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent font-mono"
                  />
                  <button
                    onClick={() => fetchModels('lmstudio', lmStudioUrl)}
                    disabled={loadingModels.lmstudio}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all disabled:opacity-50"
                    title="Connect"
                  >
                    {loadingModels.lmstudio ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* LM Studio Model Selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-text-secondary-dark uppercase tracking-wider">Model</h3>
                  {lmServerConnected && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      Connected
                    </span>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => isEditable && lmStudioModels.length > 0 && setShowLmDropdown(!showLmDropdown)}
                    disabled={loadingModels.lmstudio || lmStudioModels.length === 0}
                    className={`w-full p-3 rounded-lg border border-white/10 bg-white/5 text-left transition-all ${
                      isEditable && lmStudioModels.length > 0 ? 'hover:border-white/20 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {lmStudioModels.length === 0 ? 'No models loaded' : currentLmModel.name}
                        </p>
                        <p className="text-xs text-text-secondary-dark">
                          {lmStudioModels.length === 0 ? 'Connect to load models' : currentLmModel.description}
                        </p>
                      </div>
                      {loadingModels.lmstudio ? (
                        <Loader2 className="w-4 h-4 text-text-secondary-dark animate-spin" />
                      ) : lmStudioModels.length > 0 && isEditable && (
                        <ChevronDown className={`w-4 h-4 text-text-secondary-dark transition-transform ${showLmDropdown ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </button>

                  {showLmDropdown && isEditable && lmStudioModels.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface-dark border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {lmStudioModels.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            onLmStudioModelChange && onLmStudioModelChange(model.id);
                            setShowLmDropdown(false);
                          }}
                          className={`w-full p-3 text-left transition-all hover:bg-white/5 ${
                            lmStudioModel === model.id ? 'bg-accent/10' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${lmStudioModel === model.id ? 'text-accent' : 'text-white'}`}>
                                {model.name}
                              </p>
                              <p className="text-xs text-text-secondary-dark">{model.description}</p>
                            </div>
                            {lmStudioModel === model.id && <Check className="w-3 h-3 text-accent" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {modelErrors.lmstudio && (
                  <p className="text-xs text-red-400 mt-1">{modelErrors.lmstudio}</p>
                )}
              </div>
            </>
          )}

          {/* Settings Link */}
          <Link
            href="/settings?tab=llm-config"
            className="flex items-center justify-center gap-1.5 w-full p-2 text-xs text-text-secondary-dark hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
          >
            <Settings className="w-3 h-3" />
            <span>Manage API Keys in Settings</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          {/* Warning if not configured */}
          {!isConfigured && (
            <div className="mt-3 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">
                {provider === 'claude'
                  ? 'Add your Claude API key in Settings'
                  : 'Start LM Studio and click refresh to connect'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
