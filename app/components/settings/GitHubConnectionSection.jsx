'use client';

import { useState, useEffect } from 'react';
import { Github, Check, X, RefreshCw, Calendar, Shield, AlertCircle } from 'lucide-react';
import Button from '../ui/Button.jsx';
import GitHubConsentModal from './GitHubConsentModal.jsx';

/**
 * GitHub Connection Section
 *
 * UI component for managing GitHub OAuth connections in Settings.
 *
 * Features:
 * - Display connection status (connected/disconnected)
 * - Show connected GitHub account details
 * - Connect/Disconnect actions
 * - Token information (expiration, scopes)
 * - Privacy & security information
 * - Consent modal integration
 *
 * Props: None (fetches user's connections via API)
 */

export default function GitHubConnectionSection() {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Fetch GitHub connections on mount
  useEffect(() => {
    fetchConnections();
  }, []);

  // Handle OAuth callback success/error from URL params
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth');
    const provider = params.get('provider');
    const username = params.get('username');
    const message = params.get('message');

    if (oauthStatus && provider === 'github') {
      if (oauthStatus === 'success') {
        setSuccess(`Successfully connected GitHub account @${username}`);
        fetchConnections(); // Refresh connection list
      } else if (oauthStatus === 'error') {
        setError(message || 'Failed to connect GitHub account');
      }

      // Clean up URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  async function fetchConnections() {
    try {
      setLoading(true);
      const response = await fetch('/api/oauth/connections?provider=github');
      const data = await response.json();

      if (response.ok) {
        setConnection(data.connections[0] || null);
      } else {
        setError(data.error || 'Failed to fetch connections');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      setActionLoading(true);
      setError('');

      // Build redirect URI - use NEXTAUTH_URL from env if available for consistency
      // This ensures the callback URL matches what's registered in GitHub OAuth App
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const redirectUri = `${baseUrl}/api/oauth/github/callback`;

      // Request authorization URL with repo scope
      const response = await fetch('/api/oauth/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scopes: ['repo'], // Request repo access
          redirectUri,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to GitHub authorization page
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to initiate GitHub connection');
        setActionLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect GitHub? This will delete your stored access token.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const response = await fetch('/api/oauth/github/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: connection.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('GitHub disconnected successfully');
        setConnection(null);
      } else {
        setError(data.error || 'Failed to disconnect GitHub');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  function handleAuthorize() {
    setShowConsentModal(false);
    handleConnect();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* GitHub Account Card */}
      <div className="bg-surface-dark border border-white/10 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${connection ? 'bg-green-500/10' : 'bg-white/5'}`}>
              <Github className={`w-8 h-8 ${connection ? 'text-green-500' : 'text-text-secondary-dark'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary-dark">GitHub Account</h3>
              <p className="text-sm text-text-secondary-dark mt-1">
                {connection
                  ? 'Connected - Access private repositories'
                  : 'Not connected - Grant repository access for code analysis'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            connection
              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
              : 'bg-white/5 text-text-secondary-dark border border-white/10'
          }`}>
            {connection ? '● Connected' : '○ Disconnected'}
          </div>
        </div>

        {/* Connection Details */}
        {connection && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary-dark">Username:</span>
              <span className="text-text-primary-dark font-medium">
                @{connection.provider_username}
              </span>
            </div>

            {connection.metadata?.email && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-secondary-dark">Email:</span>
                <span className="text-text-primary-dark">{connection.metadata.email}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-text-secondary-dark" />
              <span className="text-text-secondary-dark">Scopes:</span>
              <span className="text-text-primary-dark font-mono text-xs">
                {connection.scopes?.join(', ')}
              </span>
            </div>

            {connection.created_at && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-text-secondary-dark" />
                <span className="text-text-secondary-dark">Connected:</span>
                <span className="text-text-primary-dark">
                  {new Date(connection.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          {connection ? (
            <Button
              variant="secondary"
              onClick={handleDisconnect}
              loading={actionLoading}
              disabled={actionLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setShowConsentModal(true)}
              loading={actionLoading}
              disabled={actionLoading}
            >
              <Github className="w-4 h-4 mr-2" />
              Connect GitHub
            </Button>
          )}
        </div>
      </div>

      {/* Privacy & Security Info */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-text-primary-dark mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Privacy & Security
        </h4>
        <ul className="space-y-2 text-sm text-text-secondary-dark">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Your GitHub token is encrypted with AES-256-GCM before storage</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Only used for fetching repository contents (read-only access)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Never written to logs or analytics</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Disconnect anytime for immediate deletion</span>
          </li>
        </ul>
      </div>

      {/* Consent Modal */}
      <GitHubConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onAuthorize={handleAuthorize}
        scopes={['repo']}
        loading={actionLoading}
      />
    </div>
  );
}
