'use client';

/**
 * History Page
 *
 * Displays all past analyses with filtering and search capabilities.
 *
 * Features:
 * - List of all analyses with details
 * - Filter by provider (Claude, LM Studio)
 * - Filter by input type (paste, GitHub, file upload)
 * - Search by repository URL or keywords
 * - View analysis details
 * - Delete analyses
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/app/components/layout/AppLayout';
import {
  Card, Button, EmptyState, Tag
} from '@/app/components/ui';
import {
  History as HistoryIcon,
  Loader2,
  Clock,
  Zap,
  Activity,
  FileText,
  Github,
  Upload,
  Search,
  Filter,
  ChevronRight
} from 'lucide-react';

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Load analyses
  useEffect(() => {
    async function loadAnalyses() {
      if (status === 'loading') return;

      if (!session) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/user/analyses?limit=100');
        if (!response.ok) throw new Error('Failed to load analyses');

        const data = await response.json();
        setAnalyses(data.analyses || []);
        setStats(data.stats || null);
      } catch (error) {
        console.error('Error loading analyses:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalyses();
  }, [session, status, router]);

  // Filter analyses
  const filteredAnalyses = analyses.filter((analysis) => {
    // Provider filter
    if (filterProvider !== 'all' && analysis.provider !== filterProvider) {
      return false;
    }

    // Type filter
    if (filterType !== 'all' && analysis.input_type !== filterType) {
      return false;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesUrl = analysis.github_url?.toLowerCase().includes(query);
      const matchesType = analysis.input_type?.toLowerCase().includes(query);
      if (!matchesUrl && !matchesType) return false;
    }

    return true;
  });

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Get input icon
  const getInputIcon = (type) => {
    switch (type) {
      case 'github':
        return <Github className="w-4 h-4" />;
      case 'file':
        return <Upload className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get input label
  const getInputLabel = (analysis) => {
    if (analysis.input_type === 'github' && analysis.github_url) {
      return analysis.github_url.split('/').slice(-2).join('/');
    }
    if (analysis.input_type === 'file') {
      return 'File Upload';
    }
    return 'Code Paste';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-text-secondary-dark font-secondary">Loading history...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HistoryIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-white font-primary">Analysis History</h1>
          </div>
          <p className="text-text-secondary-dark font-secondary">
            View and manage your past codebase analyses
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <p className="text-sm text-text-secondary-dark font-secondary">Total Analyses</p>
              </div>
              <p className="text-3xl font-bold text-white font-primary">
                {stats.total || 0}
              </p>
            </Card>

            <Card className="p-6 bg-accent/5 border-accent/20">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-accent" />
                <p className="text-sm text-text-secondary-dark font-secondary">Total Tokens</p>
              </div>
              <p className="text-3xl font-bold text-white font-primary">
                {((stats.totalTokens || 0) / 1000).toFixed(1)}K
              </p>
            </Card>

            <Card className="p-6 bg-quantum/5 border-quantum/20">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-quantum" />
                <p className="text-sm text-text-secondary-dark font-secondary">Last Analysis</p>
              </div>
              <p className="text-lg font-semibold text-white font-primary">
                {analyses.length > 0 ? timeAgo(analyses[0].created_at) : 'Never'}
              </p>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-dark" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-bg-dark border border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-secondary"
                />
              </div>
            </div>

            {/* Provider Filter */}
            <div>
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="w-full px-4 py-2 bg-bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-secondary"
              >
                <option value="all">All Providers</option>
                <option value="claude">Claude</option>
                <option value="lmstudio">LM Studio</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 bg-bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-secondary"
              >
                <option value="all">All Types</option>
                <option value="paste">Code Paste</option>
                <option value="github">GitHub</option>
                <option value="file">File Upload</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Analyses List */}
        {filteredAnalyses.length > 0 ? (
          <div className="space-y-3">
            {filteredAnalyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="p-5 hover:bg-white/5 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <Tag
                        size="sm"
                        className={
                          analysis.provider === 'claude'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-accent/10 text-accent'
                        }
                      >
                        {analysis.provider === 'claude' ? '⚡' : '🤖'} {analysis.provider}
                      </Tag>

                      <div className="flex items-center gap-2 text-text-secondary-dark">
                        {getInputIcon(analysis.input_type)}
                        <span className="text-sm font-secondary capitalize">
                          {analysis.input_type}
                        </span>
                      </div>

                      <span className="text-sm text-text-secondary-dark font-secondary">
                        {timeAgo(analysis.created_at)}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-white font-primary mb-2 truncate">
                      {getInputLabel(analysis)}
                    </h3>

                    {/* Token Usage */}
                    {analysis.token_usage && (
                      <div className="flex items-center gap-4 text-sm font-secondary">
                        <div className="flex items-center gap-2">
                          <span className="text-text-secondary-dark">Input:</span>
                          <span className="text-primary font-semibold">
                            {(analysis.token_usage.input_tokens || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-text-secondary-dark">Output:</span>
                          <span className="text-accent font-semibold">
                            {(analysis.token_usage.output_tokens || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-text-secondary-dark opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<HistoryIcon className="w-12 h-12" />}
            title={searchQuery || filterProvider !== 'all' || filterType !== 'all' ? 'No matches found' : 'No analyses yet'}
            description={
              searchQuery || filterProvider !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Run your first analysis from the Dashboard'
            }
            action={
              <Button variant="primary" onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            }
          />
        )}
      </div>
    </AppLayout>
  );
}
