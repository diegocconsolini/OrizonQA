'use client';

/**
 * Analysis Detail Page
 *
 * Shows full details of a single analysis with actions.
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '@/app/components/layout/AppLayout';
import OutputSection from '@/app/components/output/OutputSection';
import { Card, Button, Tag } from '@/app/components/ui';
import {
  Loader2,
  ArrowLeft,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  Zap,
  Activity,
  Github,
  Upload,
  FileText
} from 'lucide-react';

export default function AnalysisDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Load analysis
  useEffect(() => {
    async function loadAnalysis() {
      if (status === 'loading') return;

      if (!session) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`/api/user/analyses/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Analysis not found');
          } else {
            setError('Failed to load analysis');
          }
          return;
        }

        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        console.error('Error loading analysis:', err);
        setError('Failed to load analysis');
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [session, status, params.id, router]);

  // Delete analysis
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/user/analyses/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/history');
      } else {
        alert('Failed to delete analysis');
      }
    } catch (err) {
      console.error('Error deleting analysis:', err);
      alert('Failed to delete analysis');
    } finally {
      setDeleting(false);
    }
  };

  // Download results
  const handleDownload = () => {
    if (!analysis) return;

    const content = [
      `# Analysis Results`,
      `Date: ${new Date(analysis.created_at).toLocaleString()}`,
      `Provider: ${analysis.provider}`,
      `Model: ${analysis.model}`,
      `\n## User Stories\n${analysis.results?.userStories || 'None'}`,
      `\n## Test Cases\n${analysis.results?.testCases || 'None'}`,
      `\n## Acceptance Criteria\n${analysis.results?.acceptanceCriteria || 'None'}`,
    ].join('\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${analysis.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get input icon
  const getInputIcon = (type) => {
    switch (type) {
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'file':
        return <Upload className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // Get input label
  const getInputLabel = () => {
    if (!analysis) return '';
    if (analysis.input_type === 'github' && analysis.github_url) {
      return analysis.github_url;
    }
    if (analysis.input_type === 'file') {
      return 'File Upload';
    }
    return 'Code Paste';
  };

  // Format time
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-text-secondary-dark font-secondary">Loading analysis...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/history')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
          <Card className="p-8 text-center">
            <p className="text-red-400 text-lg font-secondary mb-4">{error}</p>
            <Button variant="primary" onClick={() => router.push('/history')}>
              Go to History
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!analysis) return null;

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/history')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
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
              </div>

              <h1 className="text-3xl font-bold text-white font-primary mb-2">
                {getInputLabel()}
              </h1>

              <div className="flex items-center gap-2 text-text-secondary-dark font-secondary">
                <Clock className="w-4 h-4" />
                <span>{formatDate(analysis.created_at)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={deleting}
                className="border-2 border-red-500/50 hover:bg-red-500/10 text-red-400"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>

          {/* Token Usage */}
          {analysis.token_usage && (
            <Card className="p-4 bg-surface-dark/50">
              <div className="flex items-center justify-center gap-6 text-sm font-secondary">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-text-secondary-dark">Input:</span>
                  <span className="text-primary font-semibold">
                    {(analysis.token_usage.input_tokens || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  <span className="text-text-secondary-dark">Output:</span>
                  <span className="text-accent font-semibold">
                    {(analysis.token_usage.output_tokens || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Results */}
        {analysis.results && <OutputSection results={analysis.results} />}
      </div>
    </AppLayout>
  );
}
