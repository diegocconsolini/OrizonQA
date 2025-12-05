'use client';

/**
 * Settings Page Client Component
 *
 * Handles tab persistence via URL search params
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { Tabs, TabList, TabButton, TabPanels, TabPanel } from '@/app/components/ui/Tabs';
import AppLayout from '@/app/components/layout/AppLayout';
import { Settings as SettingsIcon, Key, Server, Save, Loader2, Check, Eye, EyeOff, User, BarChart3, Zap, Calendar, Github, Cpu, RefreshCw, ChevronDown, AlertCircle, Lock, Trash2, X, Pencil } from 'lucide-react';
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

  // Account management state
  const [profile, setProfile] = useState({ fullName: '', email: '', createdAt: null, hasPassword: true });
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

        // Load profile
        const profileResponse = await fetch('/api/user/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile({
            fullName: profileData.fullName || '',
            email: profileData.email || '',
            createdAt: profileData.createdAt,
            hasPassword: profileData.hasPassword
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

  // Update profile name
  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setSavingName(true);
    setError('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: newName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update name');
      }

      setProfile(prev => ({ ...prev, fullName: newName.trim() }));
      setEditingName(false);
      setSuccess('Name updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  // Change password (for users with existing password)
  const handleChangePassword = async () => {
    setPasswordError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  // Set password (for OAuth users without password)
  const handleSetPassword = async () => {
    setPasswordError('');

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
          setPassword: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password');
      }

      setShowSetPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setProfile(prev => ({ ...prev, hasPassword: true }));
      setSuccess('Password set successfully! You can now sign in with email and password.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Password is required');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out and redirect to home
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
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
      <div className="w-full">
        <main className="p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-primary">Settings</h1>
                <p className="text-text-secondary-dark font-secondary mt-1">
                  Manage your account preferences and API configurations
                </p>
              </div>
            </div>
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
                  {/* Profile Information */}
                  <Card className="p-6">
                    <div className="flex items-start gap-3 mb-6">
                      <User className="w-5 h-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white font-primary mb-1">
                          Profile Information
                        </h2>
                        <p className="text-sm text-text-secondary-dark font-secondary">
                          Manage your account details
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Email (read-only) */}
                      <div>
                        <label className="block text-sm text-text-secondary-dark mb-2">Email</label>
                        <div className="px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white/70 font-secondary">
                          {profile.email || session?.user?.email}
                        </div>
                        <p className="text-xs text-text-secondary-dark mt-1">
                          Contact support to change your email address
                        </p>
                      </div>

                      {/* Name (editable) */}
                      <div>
                        <label className="block text-sm text-text-secondary-dark mb-2">Name</label>
                        {editingName ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="Your name"
                              className="flex-1 px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-secondary"
                            />
                            <Button
                              variant="primary"
                              onClick={handleSaveName}
                              disabled={savingName}
                            >
                              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setEditingName(false);
                                setNewName('');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white font-secondary">
                              {profile.fullName || 'Not set'}
                            </div>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEditingName(true);
                                setNewName(profile.fullName || '');
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Member Since */}
                      <div>
                        <label className="block text-sm text-text-secondary-dark mb-2">Member Since</label>
                        <div className="px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white/70 font-secondary">
                          {profile.createdAt
                            ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'Unknown'}
                        </div>
                      </div>

                      {/* Account Status */}
                      <div>
                        <label className="block text-sm text-text-secondary-dark mb-2">Account Status</label>
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-green-400/10 border border-green-400/20 rounded-lg">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-sm text-green-400 font-medium">Active</span>
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Password Section */}
                  <Card className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Lock className="w-5 h-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white font-primary mb-1">
                          Password
                        </h2>
                        {profile.hasPassword ? (
                          <p className="text-sm text-text-secondary-dark font-secondary">
                            Change your password to keep your account secure
                          </p>
                        ) : (
                          <p className="text-sm text-text-secondary-dark font-secondary">
                            You signed up with GitHub. Set a password to also sign in with email.
                          </p>
                        )}
                      </div>
                    </div>

                    {!profile.hasPassword && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg mb-4 flex items-start gap-3">
                        <Github className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-300 font-secondary">
                          <p className="font-medium">GitHub account</p>
                          <p className="mt-1">You're currently signed in via GitHub OAuth. You can set a local password to enable email/password sign-in as an alternative.</p>
                        </div>
                      </div>
                    )}

                    {profile.hasPassword ? (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowPasswordModal(true);
                          setPasswordError('');
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setShowSetPasswordModal(true);
                          setPasswordError('');
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Set Password
                      </Button>
                    )}
                  </Card>

                  {/* Danger Zone */}
                  <Card className="p-6 border-red-500/20">
                    <div className="flex items-start gap-3 mb-4">
                      <Trash2 className="w-5 h-5 text-red-400 mt-1" />
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-red-400 font-primary mb-1">
                          Danger Zone
                        </h2>
                        <p className="text-sm text-text-secondary-dark font-secondary">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg mb-4">
                      <p className="text-sm text-red-300 font-secondary">
                        This action is <strong>irreversible</strong>. All your analyses, settings, and account data will be permanently deleted.
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowDeleteModal(true);
                        setDeleteError('');
                        setDeletePassword('');
                      }}
                      className="border-2 border-red-500/50 hover:bg-red-500/10 text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </Card>
                </div>

                {/* Password Change Modal */}
                {showPasswordModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6 relative">
                      <button
                        onClick={() => setShowPasswordModal(false)}
                        className="absolute top-4 right-4 text-text-secondary-dark hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <h3 className="text-xl font-bold text-white mb-6">Change Password</h3>

                      {passwordError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-sm text-red-400">{passwordError}</p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-text-secondary-dark mb-2">Current Password</label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-text-secondary-dark mb-2">New Password</label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                          <p className="text-xs text-text-secondary-dark mt-1">
                            Min 8 characters, uppercase, lowercase, number, special character
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm text-text-secondary-dark mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button
                          variant="ghost"
                          onClick={() => setShowPasswordModal(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleChangePassword}
                          disabled={savingPassword}
                          className="flex-1"
                        >
                          {savingPassword ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Change Password
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Set Password Modal (for OAuth users) */}
                {showSetPasswordModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6 relative">
                      <button
                        onClick={() => setShowSetPasswordModal(false)}
                        className="absolute top-4 right-4 text-text-secondary-dark hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <h3 className="text-xl font-bold text-white mb-2">Set Password</h3>
                      <p className="text-sm text-text-secondary-dark mb-6">
                        Set a password to enable email/password sign-in as an alternative to GitHub.
                      </p>

                      {passwordError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-sm text-red-400">{passwordError}</p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-text-secondary-dark mb-2">New Password</label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                          <p className="text-xs text-text-secondary-dark mt-1">
                            Min 8 characters, uppercase, lowercase, number, special character
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm text-text-secondary-dark mb-2">Confirm Password</label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button
                          variant="ghost"
                          onClick={() => setShowSetPasswordModal(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleSetPassword}
                          disabled={savingPassword}
                          className="flex-1"
                        >
                          {savingPassword ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Set Password
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Delete Account Modal */}
                {showDeleteModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6 relative">
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="absolute top-4 right-4 text-text-secondary-dark hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                          <Trash2 className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Account</h3>
                        <p className="text-text-secondary-dark text-sm">
                          This will permanently delete your account, all analyses, and settings.
                        </p>
                      </div>

                      {deleteError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-sm text-red-400">{deleteError}</p>
                        </div>
                      )}

                      <div className="mb-6">
                        <label className="block text-sm text-text-secondary-dark mb-2">
                          Enter your password to confirm
                        </label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Your password"
                          className="w-full px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setShowDeleteModal(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={handleDeleteAccount}
                          disabled={deleting || !deletePassword}
                          className="flex-1 border-2 border-red-500/50 hover:bg-red-500/10 text-red-400"
                        >
                          {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Delete Account
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
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
        </main>
      </div>
    </AppLayout>
  );
}
