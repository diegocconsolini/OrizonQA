'use client';

/**
 * Donut Chart Component
 *
 * Interactive SVG donut chart with hover effects and glow.
 * Inspired by Agent Control Tower dashboard design.
 */

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import Card from '@/app/components/ui/Card';

export default function DonutChart({
  title,
  data = [],
  centerLabel = '',
  centerValue = '',
  loading = false
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const donutRef = useRef(null);

  // Animate donut segments on mount
  useEffect(() => {
    if (donutRef.current && data.length > 0) {
      const segments = donutRef.current.querySelectorAll('.donut-segment');
      gsap.fromTo(
        segments,
        { strokeDashoffset: 100 },
        {
          strokeDashoffset: 0,
          duration: 1.5,
          stagger: 0.2,
          ease: 'power2.out',
          delay: 0.3,
        }
      );
    }
  }, [data]);

  const RADIUS = 15.9155;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~100

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Get hovered item data
  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  if (loading) {
    return (
      <Card className="h-full">
        <div className="p-6">
          <div className="h-5 w-40 bg-white/5 rounded animate-pulse mb-4" />
          <div className="flex items-center justify-center h-48">
            <div className="w-36 h-36 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white font-primary mb-4">{title}</h3>
          <div className="flex items-center justify-center h-48">
            <p className="text-text-secondary-dark text-sm">No data available</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white font-primary mb-4">{title}</h3>

        <div ref={donutRef} className="relative h-48 flex items-center justify-center">
          <svg viewBox="0 0 42 42" className="w-36 h-36" style={{ transform: 'rotate(-90deg)' }}>
            {data.map((item, i) => {
              const precedingTotal = data.slice(0, i).reduce((sum, a) => sum + a.percentage, 0);
              const offset = CIRCUMFERENCE - precedingTotal;

              return (
                <circle
                  key={i}
                  className="donut-segment transition-all cursor-pointer"
                  cx="21"
                  cy="21"
                  r={RADIUS}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={hoveredIndex === i ? '4' : '3'}
                  strokeLinecap="round"
                  strokeDasharray={`${item.percentage} ${CIRCUMFERENCE - item.percentage}`}
                  strokeDashoffset={offset}
                  style={{
                    filter: hoveredIndex === i
                      ? `drop-shadow(0 0 8px ${item.color})`
                      : `drop-shadow(0 0 4px ${item.color}50)`,
                    opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.4 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {hoveredItem ? (
                <>
                  <p className="text-2xl font-bold" style={{ color: hoveredItem.color }}>
                    {hoveredItem.percentage}%
                  </p>
                  <p className="text-xs text-text-secondary-dark max-w-[80px] truncate">
                    {hoveredItem.name}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-white">{centerValue || total}</p>
                  <p className="text-sm text-text-secondary-dark">{centerLabel || 'Total'}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 mt-4">
          {data.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between text-sm p-2 rounded transition-all cursor-pointer ${
                hoveredIndex === i ? 'bg-white/5 scale-[1.02]' : 'hover:bg-white/5'
              }`}
              style={{
                borderLeft: hoveredIndex === i ? `3px solid ${item.color}` : '3px solid transparent'
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-transform ${
                    hoveredIndex === i ? 'scale-125' : ''
                  }`}
                  style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}60` }}
                />
                <span className={`transition-colors ${
                  hoveredIndex === i ? 'text-white' : 'text-text-secondary-dark'
                }`}>
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{item.count}</span>
                <span className="text-text-secondary-dark">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
