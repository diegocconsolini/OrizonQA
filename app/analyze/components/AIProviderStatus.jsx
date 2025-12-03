'use client';

/**
 * AI Provider Status Component
 *
 * Shows the current AI provider configuration status on the Analyze page.
 * Links to Settings for configuration changes.
 *
 * This replaces the full ApiKeyInput component on the Analyze page,
 * making Settings the single source of truth for AI configuration.
 */

import { Settings, Check, AlertCircle, Cpu, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AIProviderStatus({
  provider = 'claude',
  hasApiKey = false,
  lmStudioUrl = '',
  isLoading = false
}) {
  const isConfigured = provider === 'lmstudio' || hasApiKey;

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Provider Icon */}
          <div className={`p-3 rounded-xl ${
            isConfigured
              ? 'bg-primary/10 text-primary'
              : 'bg-amber-500/10 text-amber-500'
          }`}>
            {provider === 'lmstudio' ? (
              <Cpu className="w-6 h-6" />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            )}
          </div>

          {/* Status Info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">
                {provider === 'lmstudio' ? 'LM Studio' : 'Claude AI'}
              </h3>
              {isConfigured ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  <Check className="w-3 h-3" />
                  Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  Not Configured
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary-dark mt-0.5">
              {provider === 'lmstudio' ? (
                lmStudioUrl ? `Connected to ${lmStudioUrl}` : 'Local LLM (no API key required)'
              ) : (
                hasApiKey ? 'API key configured in Settings' : 'Configure API key in Settings to analyze'
              )}
            </p>
          </div>
        </div>

        {/* Settings Link */}
        <Link
          href="/settings?tab=integrations"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10
                   rounded-lg text-sm text-white hover:bg-white/10 transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Configure</span>
          <ExternalLink className="w-3 h-3 text-text-secondary-dark" />
        </Link>
      </div>

      {/* Warning if not configured */}
      {!isConfigured && (
        <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-400">
              {provider === 'claude'
                ? 'You need to configure your Claude API key in Settings before analyzing code.'
                : 'Make sure LM Studio is running on your local machine.'}
            </p>
            <Link
              href="/settings?tab=integrations"
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
