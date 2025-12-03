'use client';

/**
 * Shared Analysis Page (Public)
 *
 * Displays a shared analysis without requiring authentication.
 * Read-only view with download capability.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import OutputSection from '@/app/components/output/OutputSection';
import { Card, Button, Tag } from '@/app/components/ui';
import {
  Loader2,
  Download,
  Clock,
  Zap,
  Activity,
  Github,
  Upload,
  FileText,
  ExternalLink,
  User
} from 'lucide-react';

export default function SharedAnalysisPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  // Load analysis
  useEffect(() => {
    async function loadAnalysis() {
      try {
        const response = await fetch(`/api/shared/${params.token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('This analysis is no longer available or the link has expired.');
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
  }, [params.token]);

  // Download results
  const handleDownload = () => {
    if (!analysis) return;

    const content = [
      `# Analysis Results`,
      `Date: ${new Date(analysis.created_at).toLocaleString()}`,
      `Provider: ${analysis.provider}`,
      `Model: ${analysis.model}`,
      analysis.author_name ? `Shared by: ${analysis.author_name}` : '',
      `\n## User Stories\n${analysis.results?.userStories || 'None'}`,
      `\n## Test Cases\n${analysis.results?.testCases || 'None'}`,
      `\n## Acceptance Criteria\n${analysis.results?.acceptanceCriteria || 'None'}`,
    ].filter(Boolean).join('\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shared-analysis-${params.token.slice(0, 8)}.md`;
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
    return 'Code Analysis';
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
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary-dark font-secondary">Loading shared analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <div className="max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8">
          {/* Header */}
          <header className="flex items-center justify-between py-4 mb-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white font-primary">ORIZON</span>
              <span className="text-primary font-secondary">QA</span>
            </Link>
          </header>

          <Card className="p-8 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Analysis Not Available</h1>
            <p className="text-text-secondary-dark font-secondary mb-6">{error}</p>
            <Link href="/">
              <Button variant="primary">
                Go to ORIZON QA
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-bg-dark">
      <div className="max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="flex items-center justify-between py-4 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white font-primary">ORIZON</span>
            <span className="text-primary font-secondary">QA</span>
          </Link>
          <Tag size="sm" className="bg-green-500/10 text-green-400 border border-green-500/30">
            Shared Analysis
          </Tag>
        </header>

        {/* Analysis Header */}
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

              <div className="flex items-center gap-4 text-text-secondary-dark font-secondary">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(analysis.created_at)}</span>
                </div>
                {analysis.author_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Shared by {analysis.author_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
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

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <h3 className="text-lg font-bold text-white mb-2">
              Want to analyze your own code?
            </h3>
            <p className="text-text-secondary-dark font-secondary mb-4">
              ORIZON QA helps you generate user stories, test cases, and acceptance criteria from your codebase.
            </p>
            <Link href="/signup">
              <Button variant="primary">
                Get Started Free
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
