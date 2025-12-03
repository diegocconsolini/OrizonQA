'use client';

/**
 * Recent Analyses List Component
 *
 * Shows recent analysis activity with icons and details.
 * Inspired by Agent Control Tower dashboard design.
 */

import { useEffect, useRef } from 'react';
import { Github, FileCode, Clipboard, Bot, ArrowRight, Clock } from 'lucide-react';
import gsap from 'gsap';
import Card from '@/app/components/ui/Card';
import Link from 'next/link';

export default function RecentAnalysesList({
  analyses = [],
  loading = false
}) {
  const listRef = useRef(null);

  // Animate list items on mount
  useEffect(() => {
    if (listRef.current && analyses.length > 0) {
      const items = listRef.current.querySelectorAll('.analysis-item');
      gsap.fromTo(
        items,
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.out',
          delay: 0.5,
        }
      );
    }
  }, [analyses]);

  // Get icon based on input type
  const getInputIcon = (inputType) => {
    switch (inputType) {
      case 'github':
        return <Github className="w-5 h-5 text-quantum" />;
      case 'file':
        return <FileCode className="w-5 h-5 text-accent" />;
      case 'paste':
      default:
        return <Clipboard className="w-5 h-5 text-primary" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format tokens
  const formatTokens = (tokens) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  // Get description based on input type
  const getDescription = (analysis) => {
    if (analysis.githubUrl) {
      // Extract repo name from URL
      const match = analysis.githubUrl.match(/github\.com\/([^/]+\/[^/]+)/);
      return match ? match[1] : analysis.githubUrl;
    }
    if (analysis.inputType === 'file') return 'File upload';
    return 'Pasted code';
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="h-5 w-40 bg-white/5 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-white/10 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                  <div className="h-3 w-48 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white font-primary mb-4">Recent Analyses</h3>
          <div className="flex flex-col items-center justify-center py-12">
            <Bot className="w-12 h-12 text-text-secondary-dark mb-3" />
            <p className="text-text-secondary-dark text-sm mb-2">No analyses yet</p>
            <Link
              href="/analyze"
              className="text-primary text-sm hover:underline flex items-center gap-1"
            >
              Start your first analysis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white font-primary">Recent Analyses</h3>
          <Link
            href="/history"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div ref={listRef} className="space-y-3">
          {analyses.map((analysis) => (
            <Link
              key={analysis.id}
              href={`/history/${analysis.id}`}
              className="analysis-item flex items-center gap-4 p-3 bg-surface-dark/50 rounded-lg hover:bg-surface-dark transition-colors cursor-pointer group"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                {getInputIcon(analysis.inputType)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                    {analysis.provider === 'claude' ? 'Claude' : 'LM Studio'}
                  </span>
                  <span className="text-xs text-text-secondary-dark flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(analysis.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-white truncate">{getDescription(analysis)}</p>
              </div>

              {/* Tokens */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatTokens(analysis.tokens)}</p>
                  <p className="text-xs text-text-secondary-dark">tokens</p>
                </div>
                <ArrowRight className="w-4 h-4 text-text-secondary-dark opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
