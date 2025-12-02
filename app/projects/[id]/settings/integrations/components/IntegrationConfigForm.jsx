'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

export default function IntegrationConfigForm({ projectId, integrationType, currentConfig, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    // Azure DevOps
    organization: '',
    project: '',
    patToken: '',
    // GitHub
    owner: '',
    repo: '',
    token: '',
    // GitLab
    gitlabProjectId: '',
  });

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isConnected = currentConfig !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let endpoint = '';
      let body = { projectId };

      switch (integrationType) {
        case 'azure_devops':
          endpoint = '/api/integrations/azure-devops/connect';
          body = {
            ...body,
            organization: formData.organization,
            project: formData.project,
            patToken: formData.patToken,
          };
          break;

        case 'github':
          endpoint = '/api/integrations/github/connect';
          body = {
            ...body,
            owner: formData.owner,
            repo: formData.repo,
            token: formData.token,
          };
          break;

        case 'gitlab':
          endpoint = '/api/integrations/gitlab/connect';
          body = {
            ...body,
            gitlabProjectId: formData.gitlabProjectId,
            token: formData.token,
          };
          break;

        default:
          throw new Error('Unknown integration type');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect integration');
      }

      setSuccess(data.message);
      onSuccess();
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error('Integration error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setError('');
    setSuccess('');
    setSyncing(true);

    try {
      const endpoint = `/api/integrations/${integrationType}/sync`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync');
      }

      setSuccess(`Sync completed: ${data.stats.created} created, ${data.stats.updated} updated`);
      onSuccess();
    } catch (err) {
      console.error('Sync error:', err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this integration? Webhook events will no longer be processed.')) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const endpoint = `/api/integrations/${integrationType}/disconnect`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect');
      }

      setSuccess(data.message);
      onSuccess();
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error('Disconnect error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (integrationType) {
      case 'azure_devops':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Organization
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="myorganization"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project
              </label>
              <input
                type="text"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="MyProject"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Personal Access Token
              </label>
              <input
                type="password"
                value={formData.patToken}
                onChange={(e) => setFormData({ ...formData, patToken: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="PAT token with Work Items read/write access"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Create a PAT in Azure DevOps with Work Items (Read, Write) permissions
              </p>
            </div>
          </>
        );

      case 'github':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Repository Owner
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="username or organization"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Repository Name
              </label>
              <input
                type="text"
                value={formData.repo}
                onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="repository-name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Personal Access Token
              </label>
              <input
                type="password"
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="GitHub PAT with repo access"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Create a PAT in GitHub Settings → Developer settings → Personal access tokens
              </p>
            </div>
          </>
        );

      case 'gitlab':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project ID
              </label>
              <input
                type="text"
                value={formData.gitlabProjectId}
                onChange={(e) => setFormData({ ...formData, gitlabProjectId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="12345678"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Find this in your GitLab project settings (Project ID)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Private Token
              </label>
              <input
                type="password"
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="GitLab private token"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Create a token in GitLab Settings → Access Tokens with API scope
              </p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {isConnected ? 'Manage' : 'Connect'} {integrationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {isConnected ? (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">
                This integration is currently active. You can sync data or disconnect.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleSync}
                  disabled={syncing || loading}
                  className="flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Sync Now
                    </>
                  )}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={loading || syncing}
                  className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderFormFields()}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
