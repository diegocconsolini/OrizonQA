'use client';

/**
 * AI Provider Status Component
 *
 * Shows the current AI provider configuration on the Analyze page.
 * Allows inline provider and model selection for quick changes.
 * Changes are for the current session; Settings stores persistent defaults.
 */

import { useState, useEffect, useCallback } from 'react';
import { Settings, Check, AlertCircle, Cpu, ExternalLink, ChevronDown, Zap, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Available Claude models
const claudeModels = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Best balance of speed and quality' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: 'Most capable, slower' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Previous generation' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fastest, most affordable' },
];

// Map model IDs to display names
const modelDisplayNames = {
  'claude-sonnet-4-20250514': 'Sonnet 4',
  'claude-opus-4-20250514': 'Opus 4',
  'claude-3-5-sonnet-20241022': '3.5 Sonnet',
  'claude-3-5-haiku-20241022': '3.5 Haiku',
};

export default function AIProviderStatus({
  provider = 'claude',
  hasApiKey = false,
  lmStudioUrl = '',
  claudeModel = 'claude-sonnet-4-20250514',
  lmStudioModel = '',
  isLoading = false,
  onProviderChange,
  onModelChange,
  onLmStudioUrlChange,
  onLmStudioModelChange
}) {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showLmModelDropdown, setShowLmModelDropdown] = useState(false);
  const [lmModels, setLmModels] = useState([]);
  const [lmModelsLoading, setLmModelsLoading] = useState(false);
  const [lmModelsError, setLmModelsError] = useState(null);
  const [lmServerConnected, setLmServerConnected] = useState(false);

  const isConfigured = provider === 'lmstudio' ? lmServerConnected : hasApiKey;
  const isEditable = Boolean(onProviderChange && onModelChange);

  // Fetch LM Studio models when provider is lmstudio or URL changes
  const fetchLmModels = useCallback(async () => {
    if (!lmStudioUrl) return;

    setLmModelsLoading(true);
    setLmModelsError(null);

    try {
      const response = await fetch(`${lmStudioUrl}/v1/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to connect to LM Studio');
      }

      const data = await response.json();
      const models = data.data || [];
      setLmModels(models);
      setLmServerConnected(true);

      // Auto-select first model if none selected
      if (models.length > 0 && !lmStudioModel && onLmStudioModelChange) {
        onLmStudioModelChange(models[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch LM Studio models:', err);
      setLmModelsError(err.message);
      setLmServerConnected(false);
      setLmModels([]);
    } finally {
      setLmModelsLoading(false);
    }
  }, [lmStudioUrl, lmStudioModel, onLmStudioModelChange]);

  // Fetch models when LM Studio is selected or URL changes
  useEffect(() => {
    if (provider === 'lmstudio' && lmStudioUrl) {
      fetchLmModels();
    }
  }, [provider, lmStudioUrl, fetchLmModels]);

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
              <div className={`p-2 rounded-lg ${
                provider === 'claude' ? 'bg-primary/20' : 'bg-white/5'
              }`}>
                <svg className={`w-5 h-5 ${provider === 'claude' ? 'text-primary' : 'text-text-secondary-dark'}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className={`font-semibold ${
                provider === 'claude' ? 'text-primary' : 'text-white'
              }`}>Claude AI</span>
              {provider === 'claude' && (
                <Check className="w-4 h-4 text-primary ml-auto" />
              )}
            </div>
            <p className="text-xs text-text-secondary-dark">
              Anthropic's Claude API
            </p>
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
              <div className={`p-2 rounded-lg ${
                provider === 'lmstudio' ? 'bg-accent/20' : 'bg-white/5'
              }`}>
                <Cpu className={`w-5 h-5 ${provider === 'lmstudio' ? 'text-accent' : 'text-text-secondary-dark'}`} />
              </div>
              <span className={`font-semibold ${
                provider === 'lmstudio' ? 'text-accent' : 'text-white'
              }`}>LM Studio</span>
              {provider === 'lmstudio' && (
                <Check className="w-4 h-4 text-accent ml-auto" />
              )}
            </div>
            <p className="text-xs text-text-secondary-dark">
              Local LLM (no API key)
            </p>
          </button>
        </div>
      </div>

      {/* Model Selection - Claude only */}
      {provider === 'claude' && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-text-secondary-dark mb-3">Claude Model</h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => isEditable && setShowModelDropdown(!showModelDropdown)}
              className={`w-full p-4 rounded-xl border-2 border-white/10 bg-white/5 text-left transition-all ${
                isEditable ? 'hover:border-white/20 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-white">
                      {claudeModels.find(m => m.id === claudeModel)?.name || 'Claude Sonnet 4'}
                    </p>
                    <p className="text-xs text-text-secondary-dark">
                      {claudeModels.find(m => m.id === claudeModel)?.description}
                    </p>
                  </div>
                </div>
                {isEditable && (
                  <ChevronDown className={`w-5 h-5 text-text-secondary-dark transition-transform ${
                    showModelDropdown ? 'rotate-180' : ''
                  }`} />
                )}
              </div>
            </button>

            {/* Model Dropdown */}
            {showModelDropdown && isEditable && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-dark border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                {claudeModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onModelChange(model.id);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full p-4 text-left transition-all hover:bg-white/5 ${
                      claudeModel === model.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold ${
                          claudeModel === model.id ? 'text-primary' : 'text-white'
                        }`}>{model.name}</p>
                        <p className="text-xs text-text-secondary-dark">{model.description}</p>
                      </div>
                      {claudeModel === model.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LM Studio URL - LM Studio only */}
      {provider === 'lmstudio' && onLmStudioUrlChange && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-text-secondary-dark mb-3">LM Studio URL</h3>
          <input
            type="text"
            value={lmStudioUrl}
            onChange={(e) => onLmStudioUrlChange(e.target.value)}
            placeholder="http://localhost:1234"
            className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent font-mono text-sm"
          />
        </div>
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
                {provider === 'claude' ? 'API key required' : 'Start LM Studio'}
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
                : 'Make sure LM Studio is running on your local machine.'}
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
