'use client';

/**
 * Usage Chart Component - Enhanced Version
 *
 * Animated bar chart showing daily usage with multi-metric support.
 * Shows both analyses count and token usage with stacked visualization.
 * Inspired by Agent Control Tower dashboard design.
 */

import { useState, useEffect, useRef } from 'react';
import { BarChart3, Zap } from 'lucide-react';
import gsap from 'gsap';
import Card from '@/app/components/ui/Card';

export default function UsageChart({
  title = 'Usage Over Time',
  data = [],
  loading = false
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [metric, setMetric] = useState('count'); // 'count' or 'tokens'
  const chartRef = useRef(null);

  // Animate bars on mount and metric change
  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      const bars = chartRef.current.querySelectorAll('.chart-bar');
      gsap.fromTo(
        bars,
        { scaleY: 0, transformOrigin: 'bottom' },
        {
          scaleY: 1,
          duration: 0.8,
          stagger: 0.04,
          ease: 'elastic.out(1, 0.6)',
          delay: 0.3,
        }
      );
    }
  }, [data, metric]);

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="h-5 w-40 bg-white/5 rounded animate-pulse" />
            <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="h-64 flex items-end gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-1 bg-white/5 rounded-t animate-pulse" style={{ height: `${30 + Math.random() * 50}%` }} />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white font-primary mb-4">{title}</h3>
          <div className="flex items-center justify-center h-64">
            <p className="text-text-secondary-dark text-sm">No usage data available</p>
          </div>
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const maxTokens = Math.max(...data.map(d => d.tokens || 0), 1);
  const maxValue = metric === 'count' ? maxCount : maxTokens;

  // Calculate totals
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  const totalTokens = data.reduce((sum, d) => sum + (d.tokens || 0), 0);

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Format day of month
  const formatDayNum = (dateStr) => {
    const date = new Date(dateStr);
    return date.getDate();
  };

  const getValue = (item) => metric === 'count' ? item.count : (item.tokens || 0);

  return (
    <Card>
      <div className="p-6">
        {/* Header with metric toggle */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white font-primary">{title}</h3>

          {/* Metric Toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setMetric('count')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                metric === 'count'
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-secondary-dark hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analyses
            </button>
            <button
              onClick={() => setMetric('tokens')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                metric === 'tokens'
                  ? 'bg-quantum/20 text-quantum'
                  : 'text-text-secondary-dark hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              Tokens
            </button>
          </div>
        </div>

        {/* Chart */}
        <div ref={chartRef} className="h-56 flex items-end justify-between gap-2 px-2">
          {data.map((item, i) => {
            const value = getValue(item);
            const height = (value / maxValue) * 100;
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-2"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="w-full relative" style={{ height: '180px' }}>
                  {/* Background bar (shows max height reference) */}
                  <div
                    className="absolute bottom-0 w-full rounded-t-lg bg-white/5 transition-all"
                    style={{ height: '100%' }}
                  />

                  {/* Actual bar */}
                  <div
                    className={`chart-bar absolute bottom-0 w-full rounded-t-lg transition-all cursor-pointer ${
                      metric === 'count'
                        ? 'bg-gradient-to-t from-primary to-primary/60'
                        : 'bg-gradient-to-t from-quantum to-quantum/60'
                    }`}
                    style={{
                      height: `${Math.max(height, 2)}%`,
                      boxShadow: isHovered
                        ? metric === 'count'
                          ? '0 0 20px rgba(0, 212, 255, 0.5)'
                          : '0 0 20px rgba(106, 0, 255, 0.5)'
                        : 'none',
                      transform: isHovered ? 'scaleX(1.1)' : 'scaleX(1)',
                    }}
                  >
                    {/* Tooltip */}
                    <div
                      className={`absolute -top-16 left-1/2 -translate-x-1/2 bg-surface-dark border border-white/10 rounded-lg px-3 py-2 transition-all whitespace-nowrap z-20 ${
                        isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                      }`}
                    >
                      <p className="text-xs font-medium text-white">{item.count} analyses</p>
                      <p className="text-xs text-text-secondary-dark">
                        {((item.tokens || 0) / 1000).toFixed(1)}K tokens
                      </p>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-surface-dark border-r border-b border-white/10 rotate-45" />
                    </div>
                  </div>
                </div>

                {/* Date label */}
                <div className="text-center">
                  <span className={`text-xs font-semibold transition-colors ${
                    isHovered ? 'text-white' : 'text-text-secondary-dark'
                  }`}>
                    {formatDate(item.date)}
                  </span>
                  <span className={`block text-xs transition-colors ${
                    isHovered ? 'text-white/70' : 'text-text-secondary-dark/50'
                  }`}>
                    {formatDayNum(item.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary row */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" style={{ boxShadow: '0 0 8px rgba(0, 212, 255, 0.5)' }} />
              <span className="text-sm text-text-secondary-dark">
                Total: <span className="text-white font-semibold">{totalCount}</span> analyses
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-quantum" style={{ boxShadow: '0 0 8px rgba(106, 0, 255, 0.5)' }} />
              <span className="text-sm text-text-secondary-dark">
                <span className="text-white font-semibold">{formatNumber(totalTokens)}</span> tokens
              </span>
            </div>
          </div>
          <div className="text-sm text-text-secondary-dark">
            Avg: <span className="text-white font-semibold">
              {metric === 'count'
                ? (totalCount / data.length).toFixed(1)
                : formatNumber(Math.round(totalTokens / data.length))
              }
            </span> per day
          </div>
        </div>
      </div>
    </Card>
  );
}

// Helper function
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}
