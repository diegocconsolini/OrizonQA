'use client';

/**
 * Share Link Management Page
 *
 * View and manage all shared analyses:
 * - List of all shares (active and inactive)
 * - Toggle sharing on/off
 * - Copy share links
 * - View share statistics
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/app/components/layout/AppLayout';
import {
  Share2,
  Link2,
  Copy,
  Check,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Github,
  FileText,
  Upload,
  Clock,
  Eye
} from 'lucide-react';

export default function SharesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [stats, setStats] = useState({ total: 0, activeCount: 0 });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Load shares
  useEffect(() => {
    async function loadShares() {
      if (!session?.user?.id) return;

      try {
        const res = await fetch('/api/user/shares');
        if (res.ok) {
          const data = await res.json();
          setShares(data.shares);
          setStats({ total: data.total, activeCount: data.activeCount });
        }
      } catch (err) {
        setError('Failed to load shares');
      } finally {
        setLoading(false);
      }
    }

    loadShares();
  }, [session]);

  // Copy share link
  const copyLink = async (share) => {
    const url = `${window.location.origin}${share.shareUrl}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle sharing
  const toggleShare = async (share) => {
    setTogglingId(share.id);
    try {
      const res = await fetch(`/api/user/analyses/${share.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !share.isShared })
      });

      if (res.ok) {
        const data = await res.json();
        setShares(prev => prev.map(s =>
          s.id === share.id
            ? {
                ...s,
                isShared: data.isShared,
                shareToken: data.shareToken,
                shareUrl: data.isShared ? `/shared/${data.shareToken}` : null
              }
            : s
        ));
        // Update stats
        setStats(prev => ({
          ...prev,
          activeCount: prev.activeCount + (data.isShared ? 1 : -1)
        }));
      }
    } catch (err) {
      console.error('Toggle share error:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Get input type icon
  const getInputIcon = (type) => {
    switch (type) {
      case 'github': return <Github className="w-4 h-4" />;
      case 'upload': return <Upload className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Format date
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  if (status === 'loading' || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!session) return null;

  return (
    <AppLayout>
      <div className="w-full">
        <main className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 rounded-xl flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-primary">Shared Links</h1>
                <p className="text-text-secondary-dark font-secondary mt-1">Manage your shared analyses</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-slate-800 rounded-lg">
                <p className="text-2xl font-bold text-white">{stats.activeCount}</p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
              <div className="text-center px-4 py-2 bg-slate-800 rounded-lg">
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Empty State */}
        {shares.length === 0 && (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <Link2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No shared links yet</h3>
            <p className="text-slate-500 mb-4">
              Share an analysis from the history page to create a link
            </p>
            <button
              onClick={() => router.push('/history')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              Go to History
            </button>
          </div>
        )}

        {/* Shares List */}
        {shares.length > 0 && (
          <div className="space-y-3">
            {shares.map((share) => (
              <div
                key={share.id}
                className={`
                  bg-slate-800 border rounded-xl p-4
                  ${share.isShared ? 'border-primary/30' : 'border-slate-700'}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Input Type Icon */}
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${share.isShared ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-400'}
                  `}>
                    {getInputIcon(share.inputType)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {share.githubUrl
                          ? share.githubUrl.replace('https://github.com/', '')
                          : `Analysis #${share.id}`
                        }
                      </span>
                      {share.isShared && (
                        <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-400 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(share.createdAt)}
                      </span>
                      <span>{share.provider}</span>
                      {share.tokenUsage && (
                        <span>{((share.tokenUsage.input || 0) + (share.tokenUsage.output || 0)).toLocaleString()} tokens</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* View Link */}
                    {share.isShared && (
                      <>
                        <button
                          onClick={() => copyLink(share)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="Copy link"
                        >
                          {copiedId === share.id ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                        <a
                          href={share.shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </>
                    )}

                    {/* View Analysis */}
                    <button
                      onClick={() => router.push(`/history/${share.id}`)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="View analysis"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    {/* Toggle Share */}
                    <button
                      onClick={() => toggleShare(share)}
                      disabled={togglingId === share.id}
                      className={`
                        p-2 rounded-lg transition-colors
                        ${share.isShared
                          ? 'text-green-400 hover:bg-green-500/10'
                          : 'text-slate-400 hover:bg-slate-700'
                        }
                      `}
                      title={share.isShared ? 'Disable sharing' : 'Enable sharing'}
                    >
                      {togglingId === share.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : share.isShared ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Share URL */}
                {share.isShared && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-sm">
                      <Link2 className="w-4 h-4 text-slate-500" />
                      <code className="flex-1 bg-slate-900 px-3 py-1.5 rounded text-slate-400 truncate">
                        {window.location.origin}{share.shareUrl}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </main>
      </div>
    </AppLayout>
  );
}
