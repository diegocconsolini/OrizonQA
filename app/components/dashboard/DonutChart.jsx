'use client';

/**
 * Donut Chart Component - Enhanced Version
 *
 * Interactive SVG donut chart with flip card drill-down,
 * hover effects, and detailed stats on click.
 * Inspired by Agent Control Tower dashboard design.
 */

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, BarChart3, Clock, Zap, MousePointerClick } from 'lucide-react';
import gsap from 'gsap';
import Card from '@/app/components/ui/Card';

export default function DonutChart({
  title,
  data = [],
  centerLabel = '',
  centerValue = '',
  loading = false,
  showDrillDown = true
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const donutRef = useRef(null);
  const flipCardRef = useRef(null);

  const RADIUS = 15.9155;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~100

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Get hovered item data
  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;
  const selectedItem = selectedIndex !== null ? data[selectedIndex] : null;

  // Animate donut segments on mount
  useEffect(() => {
    if (donutRef.current && data.length > 0) {
      const segments = donutRef.current.querySelectorAll('.donut-segment');

      // Set initial state
      segments.forEach((segment, i) => {
        const item = data[i];
        const precedingTotal = data.slice(0, i).reduce((sum, a) => sum + a.percentage, 0);
        const offset = CIRCUMFERENCE - precedingTotal;

        gsap.set(segment, {
          strokeDasharray: `0 ${CIRCUMFERENCE}`,
          strokeDashoffset: offset
        });
      });

      // Animate each segment
      segments.forEach((segment, i) => {
        const item = data[i];
        gsap.to(segment, {
          strokeDasharray: `${item.percentage} ${CIRCUMFERENCE - item.percentage}`,
          duration: 0.8,
          delay: 0.3 + i * 0.15,
          ease: 'power2.out'
        });
      });
    }
  }, [data, CIRCUMFERENCE]);

  // Handle flip animation
  const handleItemClick = (index) => {
    if (!showDrillDown) return;

    setSelectedIndex(index);
    setIsFlipped(true);
    setHasInteracted(true);

    if (flipCardRef.current) {
      gsap.to(flipCardRef.current, {
        rotateY: 180,
        duration: 0.6,
        ease: 'power2.inOut'
      });
    }
  };

  const handleReturn = () => {
    if (flipCardRef.current) {
      gsap.to(flipCardRef.current, {
        rotateY: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
          setIsFlipped(false);
          setSelectedIndex(null);
        }
      });
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <div className="p-6">
          <div className="h-5 w-40 bg-white/5 rounded animate-pulse mb-4" />
          <div className="flex items-center justify-center h-48">
            <div className="w-36 h-36 rounded-full bg-white/5 animate-pulse" />
          </div>
          <div className="space-y-2 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
            ))}
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
    <div className="relative h-full" style={{ perspective: '1000px' }}>
      {/* Interactive hint badge */}
      {showDrillDown && !hasInteracted && !isFlipped && (
        <div className="absolute -top-2 -right-2 z-20 animate-bounce">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-quantum text-black text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
            <MousePointerClick className="w-3 h-3" />
            <span>Click</span>
          </div>
        </div>
      )}

      <div
        ref={flipCardRef}
        className="h-full"
        style={{ transformStyle: 'preserve-3d', transition: 'transform 0.6s' }}
      >
        {/* Front - Donut Chart */}
        <Card
          className={`h-full transition-all duration-300 ${!hasInteracted && showDrillDown ? 'ring-1 ring-primary/30 animate-pulse' : ''}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white font-primary">{title}</h3>
              {showDrillDown && !hasInteracted && (
                <span className="flex items-center gap-1 text-xs text-primary animate-pulse">
                  <ArrowRight className="w-3 h-3" />
                  Click to drill down
                </span>
              )}
            </div>

            <div ref={donutRef} className="relative h-44 flex items-center justify-center">
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
                      strokeWidth={hoveredIndex === i ? '4.5' : '3.5'}
                      strokeLinecap="round"
                      strokeDasharray={`${item.percentage} ${CIRCUMFERENCE - item.percentage}`}
                      strokeDashoffset={offset}
                      style={{
                        filter: hoveredIndex === i
                          ? `drop-shadow(0 0 10px ${item.color})`
                          : `drop-shadow(0 0 5px ${item.color}60)`,
                        opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.4 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={() => {
                        setHoveredIndex(i);
                        setHasInteracted(true);
                      }}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => handleItemClick(i)}
                    />
                  );
                })}
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
            <div className="space-y-1.5 mt-4">
              {data.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between text-sm p-2 rounded-lg transition-all cursor-pointer ${
                    hoveredIndex === i ? 'bg-white/10 scale-[1.02]' : 'hover:bg-white/5'
                  }`}
                  style={{
                    borderLeft: hoveredIndex === i ? `3px solid ${item.color}` : '3px solid transparent'
                  }}
                  onMouseEnter={() => {
                    setHoveredIndex(i);
                    setHasInteracted(true);
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleItemClick(i)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full transition-transform ${
                        hoveredIndex === i ? 'scale-125' : ''
                      }`}
                      style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}60` }}
                    />
                    <span className={`font-medium transition-colors ${
                      hoveredIndex === i ? 'text-white' : 'text-text-secondary-dark'
                    }`}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{item.count}</span>
                    <span className="text-text-secondary-dark text-xs">({item.percentage}%)</span>
                    {showDrillDown && (
                      <ArrowRight className={`w-4 h-4 transition-all ${
                        hoveredIndex === i ? 'text-primary opacity-100' : 'opacity-0'
                      }`} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Back - Drill Down Details */}
        <Card
          className="absolute inset-0 h-full"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleReturn}
                className="flex items-center gap-2 text-text-secondary-dark hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </button>
              {selectedItem && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedItem.color, boxShadow: `0 0 8px ${selectedItem.color}` }}
                  />
                  <span className="font-semibold" style={{ color: selectedItem.color }}>
                    {selectedItem.name}
                  </span>
                </div>
              )}
            </div>

            {/* Details Content */}
            {selectedItem && (
              <div className="flex-1 space-y-4">
                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-secondary-dark text-xs mb-2">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Total Count
                    </div>
                    <p className="text-2xl font-bold" style={{ color: selectedItem.color }}>
                      {selectedItem.count}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-secondary-dark text-xs mb-2">
                      <Zap className="w-3.5 h-3.5" />
                      Tokens Used
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {selectedItem.tokens ? formatNumber(selectedItem.tokens) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Average Stats */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-text-secondary-dark text-xs mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    Avg Tokens per Analysis
                  </div>
                  <p className="text-xl font-bold text-white">
                    {selectedItem.tokens && selectedItem.count
                      ? formatNumber(Math.round(selectedItem.tokens / selectedItem.count))
                      : 'N/A'}
                  </p>
                </div>

                {/* Percentage Bar */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-secondary-dark">Share of Total</span>
                    <span className="font-semibold text-white">{selectedItem.percentage}%</span>
                  </div>
                  <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${selectedItem.percentage}%`,
                        backgroundColor: selectedItem.color,
                        boxShadow: `0 0 10px ${selectedItem.color}`
                      }}
                    />
                  </div>
                </div>

                {/* Trend (if available) */}
                {selectedItem.trend && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-text-secondary-dark mb-3">Weekly Trend</p>
                    <div className="flex items-end gap-1 h-12">
                      {selectedItem.trend.map((val, i) => {
                        const max = Math.max(...selectedItem.trend);
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t transition-all hover:opacity-80"
                            style={{
                              height: `${(val / max) * 100}%`,
                              backgroundColor: selectedItem.color,
                              boxShadow: `0 0 4px ${selectedItem.color}50`
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-text-secondary-dark mt-2">
                      <span>7 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Helper function
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}
