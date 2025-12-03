'use client';

/**
 * Activity Heatmap Component
 *
 * Shows when users run analyses across the week.
 * 7 days x 24 hours grid with intensity-based coloring.
 * Inspired by Agent Control Tower dashboard design.
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Card from '@/app/components/ui/Card';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ActivityHeatmap({
  title = 'Activity Heatmap',
  data = [], // Array of { day: 0-6, hour: 0-23, count: number }
  loading = false
}) {
  const heatmapRef = useRef(null);

  // Create a lookup map for fast access
  const dataMap = new Map();
  data.forEach(item => {
    dataMap.set(`${item.day}-${item.hour}`, item.count);
  });

  // Find max value for intensity calculation
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.count)) : 1;

  // Animate cells on mount
  useEffect(() => {
    if (heatmapRef.current && data.length > 0) {
      const cells = heatmapRef.current.querySelectorAll('.heatmap-cell');
      gsap.fromTo(
        cells,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          stagger: { amount: 1.2, from: 'random' },
          ease: 'back.out(2)',
          delay: 0.3
        }
      );
    }
  }, [data]);

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="h-5 w-40 bg-white/5 rounded animate-pulse mb-4" />
          <div className="space-y-1">
            {DAYS.map((_, dayIdx) => (
              <div key={dayIdx} className="flex gap-1">
                <div className="w-10 h-5 bg-white/5 rounded animate-pulse" />
                {HOURS.map((_, hourIdx) => (
                  <div key={hourIdx} className="flex-1 h-5 bg-white/5 rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white font-primary mb-4">{title}</h3>

        <div ref={heatmapRef} className="space-y-1">
          {/* Hour labels */}
          <div className="flex gap-1 mb-2">
            <div className="w-10" />
            {HOURS.map(hour => (
              <div key={hour} className="flex-1 text-center text-xs text-text-secondary-dark font-medium">
                {hour % 4 === 0 ? `${hour}h` : ''}
              </div>
            ))}
          </div>

          {/* Rows for each day */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex gap-1 items-center">
              <div className="w-10 text-sm text-text-secondary-dark font-medium">{day}</div>
              {HOURS.map(hour => {
                const count = dataMap.get(`${dayIdx}-${hour}`) || 0;
                const intensity = count / maxValue;

                return (
                  <div
                    key={hour}
                    className="heatmap-cell flex-1 h-5 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:z-10 group relative"
                    style={{
                      backgroundColor: count > 0
                        ? `rgba(0, 212, 255, ${intensity * 0.8 + 0.1})`
                        : 'rgba(255, 255, 255, 0.03)',
                      boxShadow: intensity > 0.6
                        ? `0 0 10px rgba(0, 212, 255, ${intensity * 0.5})`
                        : 'none'
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-dark border border-white/10 rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-30 whitespace-nowrap pointer-events-none">
                      <p className="text-xs font-medium text-white">{count} analyses</p>
                      <p className="text-xs text-text-secondary-dark">{day} {hour}:00</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex justify-end items-center gap-2 mt-4 text-xs text-text-secondary-dark">
            <span>Less</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: `rgba(0, 212, 255, ${opacity})`,
                  boxShadow: opacity > 0.5 ? `0 0 6px rgba(0, 212, 255, ${opacity * 0.5})` : 'none'
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
