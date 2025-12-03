'use client';

/**
 * Usage Chart Component
 *
 * Animated bar chart showing daily usage over time.
 * Inspired by Agent Control Tower dashboard design.
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Card from '@/app/components/ui/Card';

export default function UsageChart({
  title = 'Usage Over Time',
  data = [],
  loading = false
}) {
  const chartRef = useRef(null);

  // Animate bars on mount
  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      const bars = chartRef.current.querySelectorAll('.chart-bar');
      gsap.fromTo(
        bars,
        { scaleY: 0, transformOrigin: 'bottom' },
        {
          scaleY: 1,
          duration: 1,
          stagger: 0.05,
          ease: 'elastic.out(1, 0.5)',
          delay: 0.5,
        }
      );
    }
  }, [data]);

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="h-5 w-40 bg-white/5 rounded animate-pulse mb-4" />
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

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white font-primary mb-4">{title}</h3>

        <div ref={chartRef} className="h-64 flex items-end justify-between gap-3 px-4">
          {data.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative" style={{ height: '200px' }}>
                <div
                  className="chart-bar absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-primary to-quantum transition-all hover:from-primary/80 hover:to-quantum/80 cursor-pointer group"
                  style={{ height: `${(item.count / maxCount) * 100}%` }}
                >
                  {/* Glow effect on hover */}
                  <div
                    className="absolute inset-0 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)' }}
                  />

                  {/* Tooltip */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-surface-dark border border-white/10 rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    <p className="text-xs font-medium text-white">{item.count} analyses</p>
                    <p className="text-xs text-text-secondary-dark">{(item.tokens / 1000).toFixed(1)}K tokens</p>
                  </div>
                </div>
              </div>
              <span className="text-sm text-text-secondary-dark font-medium">{formatDate(item.date)}</span>
            </div>
          ))}
        </div>

        {/* Summary row */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-quantum" />
              <span className="text-sm text-text-secondary-dark">Analyses per day</span>
            </div>
          </div>
          <div className="text-sm text-text-secondary-dark">
            Total: <span className="text-white font-semibold">{data.reduce((sum, d) => sum + d.count, 0)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
