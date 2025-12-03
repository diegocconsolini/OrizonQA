'use client';

/**
 * KPI Card Component - Clean, Compact Version
 *
 * Simple stat card with subtle styling and minimal visual noise.
 * Focuses on displaying key metrics clearly without excessive effects.
 */

import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import gsap from 'gsap';

const colorConfig = {
  primary: {
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    text: 'text-primary',
  },
  quantum: {
    bg: 'bg-quantum/10',
    border: 'border-quantum/20',
    text: 'text-quantum',
  },
  accent: {
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    text: 'text-accent',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
  }
};

export default function KPICard({
  title,
  value,
  suffix = '',
  change,
  icon,
  color = 'primary',
  invertChange = false,
  loading = false,
  animateValue = true
}) {
  const valueRef = useRef(null);
  const config = colorConfig[color] || colorConfig.primary;

  // Animate the value counter
  useEffect(() => {
    if (!animateValue || loading || !valueRef.current) return;

    const target = typeof value === 'number' ? value : parseFloat(value) || 0;

    gsap.fromTo(
      { val: 0 },
      { val: target },
      {
        val: target,
        duration: 1.5,
        ease: 'power2.out',
        delay: 0.2,
        onUpdate: function () {
          if (valueRef.current) {
            const currentVal = this.targets()[0].val;
            if (suffix === 's' || suffix === '%') {
              valueRef.current.textContent = currentVal.toFixed(1);
            } else if (target >= 1000000) {
              valueRef.current.textContent = (currentVal / 1000000).toFixed(1) + 'M';
            } else if (target >= 1000) {
              valueRef.current.textContent = (currentVal / 1000).toFixed(1) + 'K';
            } else {
              valueRef.current.textContent = Math.floor(currentVal).toLocaleString();
            }
          }
        },
      }
    );
  }, [value, suffix, loading, animateValue]);

  const isPositive = invertChange ? change < 0 : change > 0;
  const hasChange = typeof change === 'number' && change !== 0;

  // Format display value for non-animated or loading state
  const formatValue = (val) => {
    if (typeof val !== 'number') return val;
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-surface-dark rounded-lg p-4 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 animate-pulse" />
          <div className="flex-1">
            <div className="h-3 w-16 bg-white/5 rounded animate-pulse mb-2" />
            <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-dark rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.bg} ${config.text} border ${config.border}`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-text-secondary-dark text-xs font-secondary truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-semibold font-primary text-white">
              <span ref={valueRef}>{animateValue ? '0' : formatValue(value)}</span>
              {suffix && <span className="text-sm text-text-secondary-dark ml-0.5">{suffix}</span>}
            </p>

            {/* Change indicator - compact */}
            {hasChange && (
              <div className={`flex items-center gap-0.5 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
