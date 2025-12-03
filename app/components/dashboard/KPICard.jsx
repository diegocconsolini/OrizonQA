'use client';

/**
 * KPI Card Component - Enhanced Version
 *
 * Animated stat card with GSAP counter animation, glow effects,
 * and interactive hover states. Inspired by Agent Control Tower.
 */

import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import Card from '@/app/components/ui/Card';

const colorConfig = {
  primary: {
    bg: 'bg-primary/20',
    text: 'text-primary',
    hex: '#00D4FF',
    glow: 'rgba(0, 212, 255, 0.4)',
  },
  quantum: {
    bg: 'bg-quantum/20',
    text: 'text-quantum',
    hex: '#6A00FF',
    glow: 'rgba(106, 0, 255, 0.4)',
  },
  accent: {
    bg: 'bg-accent/20',
    text: 'text-accent',
    hex: '#FF9500',
    glow: 'rgba(255, 149, 0, 0.4)',
  },
  success: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    hex: '#22C55E',
    glow: 'rgba(34, 197, 94, 0.4)',
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
  sparklineData = [],
  loading = false,
  animateValue = true
}) {
  const valueRef = useRef(null);
  const cardRef = useRef(null);
  const iconRef = useRef(null);
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

  // Hover animation for icon
  useEffect(() => {
    if (!iconRef.current) return;

    const icon = iconRef.current;
    const card = cardRef.current;

    const handleEnter = () => {
      gsap.to(icon, {
        scale: 1.15,
        duration: 0.3,
        ease: 'back.out(1.7)'
      });
    };

    const handleLeave = () => {
      gsap.to(icon, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    card?.addEventListener('mouseenter', handleEnter);
    card?.addEventListener('mouseleave', handleLeave);

    return () => {
      card?.removeEventListener('mouseenter', handleEnter);
      card?.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

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
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
          </div>
          <div className="h-4 w-24 bg-white/5 rounded animate-pulse mb-3" />
          <div className="h-9 w-32 bg-white/5 rounded animate-pulse mb-3" />
          <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <div ref={cardRef} className="cursor-pointer group">
      <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.02]">
        <div className="p-6 relative">
          {/* Glow effect on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 20% 20%, ${config.glow}, transparent 50%)`
            }}
          />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div
                ref={iconRef}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg} ${config.text} transition-all duration-300`}
                style={{
                  boxShadow: `0 0 25px ${config.glow}`,
                }}
              >
                {icon}
              </div>
              <ArrowUpRight className="w-5 h-5 text-text-secondary-dark opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>

            {/* Title */}
            <p className="text-text-secondary-dark text-sm mb-2 font-secondary">{title}</p>

            {/* Value */}
            <p className="text-3xl font-bold mb-3 font-primary text-white">
              <span ref={valueRef}>{animateValue ? '0' : formatValue(value)}</span>
              {suffix && <span className="text-xl text-text-secondary-dark ml-1">{suffix}</span>}
            </p>

            {/* Change indicator */}
            {hasChange && (
              <div className={`flex items-center gap-1.5 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-medium">{Math.abs(change)}%</span>
                <span className="text-text-secondary-dark">vs last period</span>
              </div>
            )}

            {/* Sparkline */}
            {sparklineData.length > 0 && (
              <div className="mt-4 h-10">
                <Sparkline data={sparklineData} color={config.hex} />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Enhanced Sparkline component
function Sparkline({ data, color = '#00D4FF' }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const width = 100;
  const height = 40;
  const padding = 4;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Get last point coordinates
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);
  const lastY = height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Area fill */}
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill={`url(#sparkline-gradient-${color.replace('#', '')})`}
      />

      {/* Line with glow */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* End dot with pulse effect */}
      <circle
        cx={lastX}
        cy={lastY}
        r="4"
        fill={color}
        filter="url(#glow)"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="6"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.5"
      >
        <animate
          attributeName="r"
          values="4;8;4"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0;0.5"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
