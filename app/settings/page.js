'use client';

/**
 * Settings Page
 *
 * Allows authenticated users to manage their account settings:
 * - Save Claude API key (encrypted)
 * - Save LM Studio URL
 * - Manage preferences
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/app/components/ui/Logo';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { Tabs, TabList, TabButton, TabPanels, TabPanel } from '@/app/components/ui/Tabs';
import AppLayout from '@/app/components/layout/AppLayout';
import { Settings as SettingsIcon, Key, Server, Save, Loader2, Check, Eye, EyeOff, User, BarChart3, Zap, Calendar } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Form state
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [lmStudioUrl, setLmStudioUrl] = useState('http://192.168.2.101:1234');

  // Usage stats
  const [usageStats, setUsageStats] = useState({
    total: 0,
    totalTokens: 0,
    lastAnalysis: null
  });

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
        <div className="max-w-3xl mx-auto">
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
          <Tabs defaultValue={0} className="mb-6">
            <TabList>
              <TabButton>
                <Key className="w-4 h-4 mr-2" />
                API Keys
              </TabButton>
              <TabButton>
                <BarChart3 className="w-4 h-4 mr-2" />
                Usage Stats
              </TabButton>
              <TabButton>
                <User className="w-4 h-4 mr-2" />
                Account
              </TabButton>
            </TabList>

            <TabPanels>
              {/* API Keys Tab */}
              <TabPanel>
                <div className="space-y-6">
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

                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={claudeApiKey}
                        onChange={(e) => setClaudeApiKey(e.target.value)}
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
                  </Card>

                  {/* LM Studio URL */}
                  <Card className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Server className="w-5 h-5 text-accent mt-1" />
                      <div>
                        <h2 className="text-xl font-semibold text-white font-primary mb-2">
                          LM Studio URL
                        </h2>
                        <p className="text-sm text-text-secondary-dark font-secondary mb-4">
                          Optional: URL for your local LM Studio server
                        </p>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={lmStudioUrl}
                      onChange={(e) => setLmStudioUrl(e.target.value)}
                      placeholder="http://localhost:1234"
                      className="w-full px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent font-mono text-sm"
                    />
                  </Card>

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

              {/* Usage Stats Tab */}
              <TabPanel>
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
              <TabPanel>
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
