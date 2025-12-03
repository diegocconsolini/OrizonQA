'use client';

/**
 * Dashboard Page - Analytics Dashboard (Enhanced Version)
 *
 * Shows user analytics, usage statistics, and recent analyses.
 * Features interactive charts, activity heatmap, and drill-down details.
 * Inspired by Agent Control Tower dashboard design.
 *
 * Features:
 * - KPI cards with animated counters and glow effects
 * - Interactive donut charts with flip card drill-down
 * - Activity heatmap showing usage patterns
 * - Usage over time chart with metric toggle
 * - Recent analyses list
 * - Period selector (7d, 30d, 90d, all)
 */

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Zap, Clock, Activity, Sparkles, ArrowRight
} from 'lucide-react';
import gsap from 'gsap';

// Layout
import AppLayout from '@/app/components/layout/AppLayout';

// Dashboard Components
import {
  KPICard,
  DonutChart,
  UsageChart,
  RecentAnalysesList,
  PeriodSelector,
  ActivityHeatmap
} from '@/app/components/dashboard';

// UI Components
import Button from '@/app/components/ui/Button';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [period, setPeriod] = useState('30');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs for GSAP animations
  const kpiCardsRef = useRef(null);
  const chartsRef = useRef(null);
  const heatmapRef = useRef(null);
  const particlesRef = useRef(null);

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      if (status === 'loading') return;

      if (!session) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/user/analytics?period=${period}`);

        if (!response.ok) {
          throw new Error('Failed to load analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Analytics error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [session, status, period, router]);

  // GSAP animations on mount
  useEffect(() => {
    if (loading || !analytics) return;

    // Animate KPI cards
    if (kpiCardsRef.current) {
      gsap.fromTo(
        kpiCardsRef.current.children,
        { y: 50, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.7)',
        }
      );
    }

    // Animate charts section
    if (chartsRef.current) {
      gsap.fromTo(
        chartsRef.current.children,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.15,
          ease: 'power3.out',
          delay: 0.3,
        }
      );
    }

    // Animate heatmap section
    if (heatmapRef.current) {
      gsap.fromTo(
        heatmapRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
          delay: 0.5,
        }
      );
    }

    // Create floating particles
    if (particlesRef.current) {
      const particles = particlesRef.current;
      particles.innerHTML = ''; // Clear existing particles

      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute rounded-full pointer-events-none';
        particle.style.width = `${Math.random() * 4 + 2}px`;
        particle.style.height = particle.style.width;
        particle.style.background = `rgba(0, 212, 255, ${Math.random() * 0.2 + 0.1})`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particles.appendChild(particle);

        gsap.to(particle, {
          y: -100 - Math.random() * 200,
          x: (Math.random() - 0.5) * 100,
          opacity: 0,
          duration: 3 + Math.random() * 4,
          repeat: -1,
          delay: Math.random() * 3,
          ease: 'none',
        });
      }
    }

    return () => {
      if (particlesRef.current) {
        particlesRef.current.innerHTML = '';
      }
    };
  }, [loading, analytics]);

  // Format time ago for last analysis
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Never';
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

  // Generate sparkline data from daily usage
  const getSparklineData = () => {
    if (!analytics?.dailyUsage || analytics.dailyUsage.length === 0) return [];
    return analytics.dailyUsage.map(d => d.count);
  };

  if (status === 'loading') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="relative">
        {/* Floating particles background */}
        <div ref={particlesRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0" />

        <main className="p-4 md:p-6 lg:p-8 relative z-10">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white font-primary">Dashboard</h1>
              <p className="text-text-secondary-dark mt-1 font-secondary">
                Monitor your code analysis usage and metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PeriodSelector value={period} onChange={setPeriod} />
              <Link href="/analyze">
                <Button variant="primary" size="md">
                  <Sparkles className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              </Link>
            </div>
          </div>

          {/* KPI Cards */}
          <div ref={kpiCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Total Analyses"
              value={analytics?.summary?.totalAnalyses || 0}
              change={analytics?.summary?.analysesChange}
              icon={<Activity className="w-5 h-5" />}
              color="primary"
              sparklineData={getSparklineData()}
              loading={loading}
            />
            <KPICard
              title="Total Tokens"
              value={analytics?.summary?.totalTokens || 0}
              change={analytics?.summary?.tokensChange}
              icon={<Zap className="w-5 h-5" />}
              color="quantum"
              loading={loading}
            />
            <KPICard
              title="Avg Tokens/Analysis"
              value={analytics?.summary?.avgTokensPerAnalysis || 0}
              icon={<BarChart3 className="w-5 h-5" />}
              color="accent"
              loading={loading}
            />
            <KPICard
              title="Last Analysis"
              value={formatTimeAgo(analytics?.summary?.lastAnalysisAt)}
              icon={<Clock className="w-5 h-5" />}
              color="success"
              loading={loading}
              animateValue={false}
            />
          </div>

          {/* Charts Row - Donut Charts */}
          <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <DonutChart
              title="Provider Distribution"
              data={analytics?.byProvider || []}
              centerLabel="Providers"
              loading={loading}
              showDrillDown={true}
            />
            <DonutChart
              title="Input Type Distribution"
              data={analytics?.byInputType || []}
              centerLabel="Types"
              loading={loading}
              showDrillDown={true}
            />
          </div>

          {/* Usage Chart - Full Width */}
          <div className="mb-8">
            <UsageChart
              title={`Usage Over Time (Last ${period === 'all' ? 'All Time' : period + ' days'})`}
              data={analytics?.dailyUsage || []}
              loading={loading}
            />
          </div>

          {/* Activity Heatmap */}
          <div ref={heatmapRef} className="mb-8">
            <ActivityHeatmap
              title="Activity Heatmap"
              data={analytics?.heatmapData || []}
              loading={loading}
            />
          </div>

          {/* Recent Analyses */}
          <RecentAnalysesList
            analyses={analytics?.recentAnalyses || []}
            loading={loading}
          />

          {/* Quick Actions - Empty State */}
          {!loading && analytics?.summary?.totalAnalyses === 0 && (
            <div className="mt-8 p-8 bg-primary/5 border border-primary/20 rounded-2xl text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2 font-primary">
                Welcome to ORIZON QA
              </h3>
              <p className="text-text-secondary-dark mb-6 font-secondary max-w-md mx-auto">
                Start analyzing your code to generate user stories, test cases, and acceptance criteria with AI.
              </p>
              <Link href="/analyze">
                <Button variant="primary" size="lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Your First Analysis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
