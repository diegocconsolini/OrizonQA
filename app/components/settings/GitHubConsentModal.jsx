'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Github, Shield, Lock, Eye } from 'lucide-react';
import Button from '../ui/Button.jsx';

/**
 * GitHub Consent Modal
 *
 * Modal component that displays explicit consent warnings before
 * granting repository access to ORIZON QA.
 *
 * Features:
 * - Clear warning about repository access
 * - List of permissions being granted
 * - Explicit checkbox acknowledgment required
 * - GDPR-compliant consent flow
 * - Cancel/Authorize actions
 *
 * Props:
 *   - isOpen: Boolean to control modal visibility
 *   - onClose: Callback when modal is closed
 *   - onAuthorize: Callback when user authorizes (after consent)
 *   - scopes: Array of OAuth scopes being requested
 *   - loading: Boolean for authorize button loading state
 */

export default function GitHubConsentModal({
  isOpen,
  onClose,
  onAuthorize,
  scopes = ['repo'],
  loading = false,
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  // Determine if requesting repo access
  const requestingRepoAccess = scopes.includes('repo');

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-surface-dark border border-white/10 rounded-lg shadow-2xl z-[10000]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Github className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary-dark">
                Connect GitHub Repository Access
              </h2>
              <p className="text-sm text-text-secondary-dark mt-1">
                Grant ORIZON QA access to your repositories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg text-text-secondary-dark hover:bg-white/5 hover:text-text-primary-dark transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-500">
                Important: Repository Access Permission
              </p>
              <p className="text-sm text-text-secondary-dark mt-1">
                This will grant ORIZON QA read access to your public and private repositories.
                Please review the permissions carefully before proceeding.
              </p>
            </div>
          </div>

          {/* Permissions List */}
          <div>
            <h3 className="text-sm font-medium text-text-primary-dark mb-3">
              ORIZON QA will be able to:
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Eye className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text-secondary-dark">
                  <span className="font-medium text-text-primary-dark">Read your repositories</span>
                  <p className="text-xs mt-0.5">Access repository contents for code analysis</p>
                </div>
              </div>
              {requestingRepoAccess && (
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-text-secondary-dark">
                    <span className="font-medium text-text-primary-dark">Access private repositories</span>
                    <p className="text-xs mt-0.5">Read private repo contents (but cannot modify or write)</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text-secondary-dark">
                  <span className="font-medium text-text-primary-dark">View your profile information</span>
                  <p className="text-xs mt-0.5">Username, email, and avatar for connection display</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-2">
            <h3 className="text-sm font-medium text-text-primary-dark flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Privacy & Security
            </h3>
            <ul className="space-y-1.5 text-xs text-text-secondary-dark">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Your GitHub access token is encrypted with AES-256-GCM before storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>ORIZON QA can only <strong>read</strong> repository contents (no write or delete access)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Tokens are never logged, shared, or exposed in error messages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You can revoke access anytime from Settings with immediate deletion</span>
              </li>
            </ul>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-3 p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 mt-0.5 rounded border-0 bg-white/10 text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 cursor-pointer disabled:opacity-50"
            />
            <span className="text-sm text-text-secondary-dark">
              I understand that this grants <strong className="text-text-primary-dark">read access</strong> to my public and private GitHub repositories.
              I can revoke this access at any time.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onAuthorize}
            disabled={!acknowledged || loading}
            loading={loading}
            className="min-w-32"
          >
            <Github className="w-4 h-4 mr-2" />
            {loading ? 'Connecting...' : 'Authorize GitHub'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
