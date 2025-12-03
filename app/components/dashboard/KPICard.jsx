'use client';

/**
 * KPI Card Component
 *
 * Animated stat card with trend indicator and sparkline.
 * Inspired by Agent Control Tower dashboard design.
 */

import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import Card from '@/app/components/ui/Card';

const colorClasses = {
  primary: 'bg-primary/20 text-primary',
  accent: 'bg-accent/20 text-accent',
  quantum: 'bg-quantum/20 text-quantum',
  success: 'bg-green-500/20 text-green-400',
};

const glowClasses = {
  primary: 'shadow-[0_0_20px_rgba(0,212,255,0.3)]',
  accent: 'shadow-[0_0_20px_rgba(255,149,0,0.3)]',
  quantum: 'shadow-[0_0_20px_rgba(106,0,255,0.3)]',
  success: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
};

export default function KPICard({
  title,
  value,
  suffix = '',
  change,
  icon,
  color = 'primary',
  invertChange = false,
  sparklineData = [],
  loading = false,
  animateValue = true
}) {
  const valueRef = useRef(null);
  const cardRef = useRef(null);

  // Animate the value counter
  useEffect(() => {
    if (!animateValue || loading || !valueRef.current) return;

    const target = typeof value === 'number' ? value : parseFloat(value) || 0;

    gsap.fromTo(
      { val: 0 },
      { val: target },
      {
        val: target,
        duration: 2,
        ease: 'power2.out',
        delay: 0.3,
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

  return (
    <Card
      ref={cardRef}
      className={`cursor-pointer group hover:scale-[1.02] transition-all duration-300 ${glowClasses[color]}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
          <ArrowUpRight className="w-4 h-4 text-text-secondary-dark opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <p className="text-text-secondary-dark text-sm mb-1 font-secondary">{title}</p>

        {loading ? (
          <div className="h-8 w-24 bg-white/5 rounded animate-pulse mb-2" />
        ) : (
          <p className="text-2xl font-bold mb-2 font-primary">
            <span ref={valueRef}>{animateValue ? '0' : formatValue(value)}</span>
            {suffix && <span className="text-lg text-text-secondary-dark ml-1">{suffix}</span>}
          </p>
        )}

        {hasChange && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(change)}% from last period</span>
          </div>
        )}

        {/* Sparkline */}
        {sparklineData.length > 0 && (
          <div className="mt-3 h-8">
            <Sparkline data={sparklineData} color={color} />
          </div>
        )}
      </div>
    </Card>
  );
}

// Simple sparkline component
function Sparkline({ data, color = 'primary' }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const width = 100;
  const height = 30;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const colorMap = {
    primary: '#00D4FF',
    accent: '#FF9500',
    quantum: '#6A00FF',
    success: '#10B981',
  };

  const strokeColor = colorMap[color] || colorMap.primary;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill={`url(#sparkline-gradient-${color})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
