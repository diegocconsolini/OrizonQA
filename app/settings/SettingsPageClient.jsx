'use client';

/**
 * Settings Page Client Component
 *
 * Handles tab persistence via URL search params
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { Tabs, TabList, TabButton, TabPanels, TabPanel } from '@/app/components/ui/Tabs';
import AppLayout from '@/app/components/layout/AppLayout';
import { Settings as SettingsIcon, Key, Server, Save, Loader2, Check, Eye, EyeOff, User, BarChart3, Zap, Calendar, Github, Cpu, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import GitHubConnectionSection from '@/app/components/settings/GitHubConnectionSection';

export default function SettingsPageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Get active tab from URL or default to 'llm-config'
  const activeTab = searchParams.get('tab') || 'llm-config';

  // Handle tab change - update URL without full page reload
  const handleTabChange = (newTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', newTab);
    router.push(`/settings?${params.toString()}`, { scroll: false });
  };

  // Form state
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [lmStudioUrl, setLmStudioUrl] = useState('http://localhost:1234');
  const [aiProvider, setAiProvider] = useState('claude');
  const [claudeModel, setClaudeModel] = useState('claude-sonnet-4-20250514');
  const [lmStudioModel, setLmStudioModel] = useState('');

  // Model lists (fetched from API)
  const [claudeModels, setClaudeModels] = useState([]);
  const [lmStudioModels, setLmStudioModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState({});
  const [modelErrors, setModelErrors] = useState({});
  const [lmServerConnected, setLmServerConnected] = useState(false);
  const [claudeKeyValidated, setClaudeKeyValidated] = useState(false);
  const [validatingClaudeKey, setValidatingClaudeKey] = useState(false);
  const [claudeKeyError, setClaudeKeyError] = useState('');

  // Usage stats
  const [usageStats, setUsageStats] = useState({
    total: 0,
    totalTokens: 0,
    lastAnalysis: null
  });

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
  }, []);

  // Validate Claude API key and fetch models
  const validateClaudeApiKey = useCallback(async () => {
    if (!claudeApiKey.trim()) {
      setClaudeKeyError('Please enter an API key');
      return;
    }

    setValidatingClaudeKey(true);
    setClaudeKeyError('');
    setClaudeKeyValidated(false);

    try {
      // Use the models endpoint with the API key to validate
      const response = await fetch('/api/ai/models?provider=anthropic', {
        headers: {
          'X-Claude-Api-Key': claudeApiKey.trim()
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid API key');
      }

      const { models } = await response.json();
      setClaudeModels(models);
      setClaudeKeyValidated(true);
    } catch (error) {
      console.error('Claude API key validation failed:', error);
      setClaudeKeyError(error.message || 'Failed to validate API key');
      setClaudeKeyValidated(false);
    } finally {
      setValidatingClaudeKey(false);
    }
  }, [claudeApiKey]);

  // Load user settings
  useEffect(() => {
    async function loadSettings() {
      if (status === 'loading') return;

      if (!session) {
        router.push('/login');
        return;
      }

      try {
        // Load settings
        const settingsResponse = await fetch('/api/user/settings');
        if (!settingsResponse.ok) throw new Error('Failed to load settings');

        const settingsData = await settingsResponse.json();

        if (settingsData.claudeApiKey) {
          setClaudeApiKey(settingsData.claudeApiKey);
        }
        if (settingsData.lmStudioUrl) {
          setLmStudioUrl(settingsData.lmStudioUrl);
        }
        if (settingsData.aiProvider) {
          setAiProvider(settingsData.aiProvider);
        }
        if (settingsData.claudeModel) {
          setClaudeModel(settingsData.claudeModel);
        }
        if (settingsData.lmStudioModel) {
          setLmStudioModel(settingsData.lmStudioModel);
        }

        // Auto-connect to LM Studio if provider is lmstudio and we have a URL
        if (settingsData.aiProvider === 'lmstudio' && settingsData.lmStudioUrl) {
          fetchModels('lmstudio', settingsData.lmStudioUrl);
        }

        // Load usage stats
        const analysesResponse = await fetch('/api/user/analyses?limit=1');
        if (analysesResponse.ok) {
          const analysesData = await analysesResponse.json();
          setUsageStats({
            total: analysesData.stats?.total || 0,
            totalTokens: analysesData.stats?.totalTokens || 0,
            lastAnalysis: analysesData.analyses?.[0]?.created_at || null
          });
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [session, status, router]);

  // Save settings
  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claudeApiKey: claudeApiKey.trim() || null,
          lmStudioUrl: lmStudioUrl.trim() || null,
          aiProvider: aiProvider,
          claudeModel: claudeModel,
          lmStudioModel: lmStudioModel || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary-dark font-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Main Content */}
      <div className="pb-12 px-6 py-8">
        <div>
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-white font-primary">Settings</h1>
            </div>
            <p className="text-text-secondary-dark font-secondary">
              Manage your account preferences and API configurations
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-400/10 border border-green-400/20 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <p className="text-green-400 font-secondary">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 font-secondary">{error}</p>
            </div>
          )}

          {/* Tabbed Interface */}
          <Tabs value={activeTab} onChange={handleTabChange} className="mb-6">
            <TabList>
              <TabButton value="llm-config">
                <Cpu className="w-4 h-4 mr-2" />
                LLM Config
              </TabButton>
              <TabButton value="github">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </TabButton>
              <TabButton value="usage">
                <BarChart3 className="w-4 h-4 mr-2" />
                Usage Stats
              </TabButton>
              <TabButton value="account">
                <User className="w-4 h-4 mr-2" />
                Account
              </TabButton>
            </TabList>

            <TabPanels>
              {/* LLM Config Tab */}
              <TabPanel value="llm-config">
                <div className="space-y-6">
                  {/* AI Provider Selection */}
                  <Card className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Zap className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <h2 className="text-xl font-semibold text-white font-primary mb-2">
                          Default AI Provider
                        </h2>
                        <p className="text-sm text-text-secondary-dark font-secondary mb-4">
                          Choose which AI provider to use for code analysis
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setAiProvider('claude')}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          aiProvider === 'claude'
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            aiProvider === 'claude' ? 'bg-primary/20' : 'bg-white/5'
                          }`}>
                            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                          </div>
                          <span className={`font-semibold ${
                            aiProvider === 'claude' ? 'text-primary' : 'text-white'
                          }`}>Claude AI</span>
                          {aiProvider === 'claude' && (
                            <Check className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-xs text-text-secondary-dark">
                          Anthropic's Claude API (requires API key)
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiProvider('lmstudio')}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          aiProvider === 'lmstudio'
                            ? 'border-accent bg-accent/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            aiProvider === 'lmstudio' ? 'bg-accent/20' : 'bg-white/5'
                          }`}>
                            <Cpu className={`w-5 h-5 ${aiProvider === 'lmstudio' ? 'text-accent' : 'text-text-secondary-dark'}`} />
                          </div>
                          <span className={`font-semibold ${
                            aiProvider === 'lmstudio' ? 'text-accent' : 'text-white'
                          }`}>LM Studio</span>
                          {aiProvider === 'lmstudio' && (
                            <Check className="w-4 h-4 text-accent ml-auto" />
                          )}
                        </div>
                        <p className="text-xs text-text-secondary-dark">
                          Local LLM (no API key required)
                        </p>
                      </button>
                    </div>
                  </Card>

                  {/* Claude Settings - Only show when Claude is selected */}
                  {aiProvider === 'claude' && (
                    <>
                      {/* Claude API Key */}
                      <Card className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <Key className="w-5 h-5 text-primary mt-1" />
                          <div>
                            <h2 className="text-xl font-semibold text-white font-primary mb-2">
                              Claude API Key
                            </h2>
                            <p className="text-sm text-text-secondary-dark font-secondary mb-4">
                              Your API key is encrypted and stored securely. You can get one from{' '}
                              <a
                                href="https://console.anthropic.com/settings/keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary-hover underline"
                              >
                                Anthropic Console
                              </a>
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showApiKey ? 'text' : 'password'}
                              value={claudeApiKey}
                              onChange={(e) => {
                                setClaudeApiKey(e.target.value);
                                setClaudeKeyValidated(false);
                                setClaudeKeyError('');
                              }}
                              placeholder="sk-ant-..."
                              className="w-full px-4 py-3 pr-12 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-dark hover:text-white transition-colors"
                            >
                              {showApiKey ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          <button
                            onClick={validateClaudeApiKey}
                            disabled={validatingClaudeKey || !claudeApiKey.trim()}
                            className="px-4 py-3 bg-primary/10 border-2 border-primary/20 rounded-lg text-primary hover:bg-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {validatingClaudeKey ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            Validate
                          </button>
                        </div>
                        {claudeKeyValidated && (
                          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            API key validated - {claudeModels.length} model(s) available
                          </p>
                        )}
                        {claudeKeyError && (
                          <p className="text-xs text-red-400 mt-2">{claudeKeyError}</p>
                        )}
                      </Card>

                      {/* Claude Model Selection - Only show after key is validated */}
                      <Card className="p-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 text-primary mt-1" />
                            <div>
                              <h2 className="text-xl font-semibold text-white font-primary mb-2">
                                Default Model
                              </h2>
                              <p className="text-sm text-text-secondary-dark font-secondary">
                                Select the Claude model to use for analysis
                              </p>
                            </div>
                          </div>
                          {claudeKeyValidated && (
                            <button
                              onClick={validateClaudeApiKey}
                              disabled={validatingClaudeKey}
                              className="p-2 text-text-secondary-dark hover:text-white transition-colors disabled:opacity-50"
                              title="Refresh models"
                            >
                              <RefreshCw className={`w-4 h-4 ${validatingClaudeKey ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                        </div>

                        {validatingClaudeKey ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                          </div>
                        ) : !claudeKeyValidated ? (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-400">
                              <p className="font-medium">No models available</p>
                              <p className="mt-1">Enter your Claude API key above and click Validate to load available models.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {claudeModels.map((model) => (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => setClaudeModel(model.id)}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                  claudeModel === model.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`font-semibold text-sm ${
                                    claudeModel === model.id ? 'text-primary' : 'text-white'
                                  }`}>{model.name}</span>
                                  {claudeModel === model.id && (
                                    <Check className="w-4 h-4 text-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-text-secondary-dark">
                                  {model.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </Card>
                    </>
                  )}

                  {/* LM Studio Settings - Only show when LM Studio is selected */}
                  {aiProvider === 'lmstudio' && (
                    <>
                      {/* LM Studio URL */}
                      <Card className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <Server className="w-5 h-5 text-accent mt-1" />
                          <div>
                            <h2 className="text-xl font-semibold text-white font-primary mb-2">
                              LM Studio Endpoint
                            </h2>
                            <p className="text-sm text-text-secondary-dark font-secondary mb-4">
                              URL for your local LM Studio server
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={lmStudioUrl}
                            onChange={(e) => setLmStudioUrl(e.target.value)}
                            placeholder="http://localhost:1234"
                            className="flex-1 px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent font-mono text-sm"
                          />
                          <button
                            onClick={() => fetchModels('lmstudio', lmStudioUrl)}
                            disabled={loadingModels.lmstudio}
                            className="px-4 py-3 bg-accent/10 border-2 border-accent/20 rounded-lg text-accent hover:bg-accent/20 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {loadingModels.lmstudio ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            Connect
                          </button>
                        </div>
                        {lmServerConnected && (
                          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            Connected - {lmStudioModels.length} model(s) available
                          </p>
                        )}
                        {modelErrors.lmstudio && (
                          <p className="text-xs text-red-400 mt-2">{modelErrors.lmstudio}</p>
                        )}
                      </Card>

                      {/* LM Studio Model Selection */}
                      <Card className="p-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-start gap-3">
                            <Cpu className="w-5 h-5 text-accent mt-1" />
                            <div>
                              <h2 className="text-xl font-semibold text-white font-primary mb-2">
                                Default Model
                              </h2>
                              <p className="text-sm text-text-secondary-dark font-secondary">
                                Select the model to use for analysis
                              </p>
                            </div>
                          </div>
                        </div>

                        {loadingModels.lmstudio ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 text-accent animate-spin" />
                          </div>
                        ) : lmStudioModels.length === 0 ? (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-400">
                              <p className="font-medium">No models available</p>
                              <p className="mt-1">Enter your LM Studio URL and click Connect to load models.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {lmStudioModels.map((model) => (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => setLmStudioModel(model.id)}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                  lmStudioModel === model.id
                                    ? 'border-accent bg-accent/10'
                                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`font-semibold text-sm font-mono ${
                                    lmStudioModel === model.id ? 'text-accent' : 'text-white'
                                  }`}>{model.name}</span>
                                  {lmStudioModel === model.id && (
                                    <Check className="w-4 h-4 text-accent" />
                                  )}
                                </div>
                                <p className="text-xs text-text-secondary-dark">
                                  {model.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </Card>
                    </>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      variant="primary"
                      size="lg"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabPanel>

              {/* GitHub Tab */}
              <TabPanel value="github">
                <GitHubConnectionSection />
              </TabPanel>

              {/* Usage Stats Tab */}
              <TabPanel value="usage">
                <div className="space-y-6">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-6 bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <p className="text-sm text-text-secondary-dark font-secondary">Total Analyses</p>
                      </div>
                      <p className="text-3xl font-bold text-white font-primary">
                        {usageStats.total}
                      </p>
                    </Card>

                    <Card className="p-6 bg-accent/5 border-accent/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-accent" />
                        <p className="text-sm text-text-secondary-dark font-secondary">Total Tokens</p>
                      </div>
                      <p className="text-3xl font-bold text-white font-primary">
                        {usageStats.totalTokens.toLocaleString()}
                      </p>
                    </Card>

                    <Card className="p-6 bg-quantum/5 border-quantum/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-quantum" />
                        <p className="text-sm text-text-secondary-dark font-secondary">Last Analysis</p>
                      </div>
                      <p className="text-lg font-semibold text-white font-primary">
                        {usageStats.lastAnalysis
                          ? new Date(usageStats.lastAnalysis).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </Card>
                  </div>

                  {/* Usage Info */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-white font-primary mb-4">
                      Usage Information
                    </h3>
                    <div className="space-y-3 text-sm text-text-secondary-dark font-secondary">
                      <p>• Analyses are stored securely and linked to your account</p>
                      <p>• Token usage is tracked for each analysis</p>
                      <p>• View your analysis history in the Dashboard</p>
                      <p>• API costs are based on your Claude API usage</p>
                    </div>
                  </Card>
                </div>
              </TabPanel>

              {/* Account Tab */}
              <TabPanel value="account">
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <User className="w-5 h-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white font-primary mb-2">
                          Account Information
                        </h2>
                        <div className="space-y-3 mt-4">
                          <div>
                            <p className="text-sm text-text-secondary-dark mb-1">Email</p>
                            <p className="text-white font-medium font-secondary">{session?.user?.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-text-secondary-dark mb-1">Name</p>
                            <p className="text-white font-medium font-secondary">{session?.user?.name || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-text-secondary-dark mb-1">Account Status</p>
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-400/10 border border-green-400/20 rounded-full">
                              <div className="w-2 h-2 bg-green-400 rounded-full" />
                              <span className="text-sm text-green-400 font-medium">Active</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-white font-primary mb-4">
                      Danger Zone
                    </h3>
                    <p className="text-sm text-text-secondary-dark font-secondary mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button
                      variant="ghost"
                      size="md"
                      className="border-2 border-red-500/50 hover:bg-red-500/10 text-red-400"
                    >
                      Delete Account
                    </Button>
                  </Card>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Info Card */}
          <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-2xl">
            <h3 className="text-lg font-semibold text-white font-primary mb-3">
              💡 Privacy & Security
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary-dark font-secondary">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Your API keys are encrypted before being stored in the database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Keys are only decrypted when you run an analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You can clear your API key at any time by saving with an empty field</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>We never log or share your API keys</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
