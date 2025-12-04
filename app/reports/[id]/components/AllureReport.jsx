'use client';

/**
 * AllureReport Component
 *
 * Visual Allure-style report with charts:
 * - Pie chart: pass/fail/skip distribution
 * - Bar chart: test duration comparison
 * - Timeline view
 */

import { useMemo } from 'react';
import {
  PieChart,
  BarChart3,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';

// Simple SVG Pie Chart
function PieChartSVG({ data, size = 200 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  let currentAngle = -90; // Start from top

  const segments = data.map((d, idx) => {
    const percentage = d.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const radius = size / 2 - 10;
    const cx = size / 2;
    const cy = size / 2;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathData = d.value === total
      ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return (
      <path
        key={idx}
        d={pathData}
        fill={d.color}
        className="transition-opacity hover:opacity-80"
      >
        <title>{d.label}: {d.value} ({Math.round(percentage * 100)}%)</title>
      </path>
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments}
      {/* Center circle for donut effect */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 4}
        fill="#1e293b"
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white text-2xl font-bold"
      >
        {total}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 20}
        textAnchor="middle"
        className="fill-slate-400 text-xs"
      >
        tests
      </text>
    </svg>
  );
}

// Simple Bar Chart
function BarChartSVG({ data, width = 400, height = 200 }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.min(40, (width - 60) / data.length - 5);
  const chartHeight = height - 40;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((percent, idx) => (
        <g key={idx}>
          <line
            x1={40}
            y1={20 + (1 - percent) * chartHeight}
            x2={width - 20}
            y2={20 + (1 - percent) * chartHeight}
            stroke="#334155"
            strokeDasharray="4"
          />
          <text
            x={35}
            y={25 + (1 - percent) * chartHeight}
            textAnchor="end"
            className="fill-slate-500 text-xs"
          >
            {Math.round(maxValue * percent)}ms
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.slice(0, 10).map((d, idx) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = 50 + idx * (barWidth + 5);
        const y = 20 + chartHeight - barHeight;

        return (
          <g key={idx}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={d.color || '#6366f1'}
              className="transition-opacity hover:opacity-80"
            >
              <title>{d.label}: {d.value}ms</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

export default function AllureReport({ execution, results = [] }) {
  // Prepare pie chart data
  const pieData = useMemo(() => {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    return [
      { label: 'Passed', value: passed, color: '#22c55e' },
      { label: 'Failed', value: failed, color: '#ef4444' },
      { label: 'Skipped', value: skipped, color: '#64748b' }
    ].filter(d => d.value > 0);
  }, [results]);

  // Prepare bar chart data (top slowest tests)
  const barData = useMemo(() => {
    return results
      .filter(r => r.duration)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10)
      .map(r => ({
        label: r.name || 'Unknown',
        value: r.duration || 0,
        color: r.status === 'passed' ? '#22c55e' :
               r.status === 'failed' ? '#ef4444' : '#64748b'
      }));
  }, [results]);

  // Calculate stats
  const stats = useMemo(() => {
    const durations = results.filter(r => r.duration).map(r => r.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = durations.length > 0 ? totalDuration / durations.length : 0;
    const maxDuration = Math.max(...durations, 0);
    const minDuration = Math.min(...durations, 0);

    return {
      totalDuration,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      minDuration
    };
  }, [results]);

  if (!execution && results.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No data available for report</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="text-white font-medium">Test Distribution</h3>
          </div>

          <div className="flex items-center justify-center">
            <PieChartSVG data={pieData} size={180} />
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-sm text-slate-400">
                  {d.label} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart - Slowest Tests */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-white font-medium">Slowest Tests</h3>
          </div>

          {barData.length > 0 ? (
            <div className="overflow-x-auto">
              <BarChartSVG data={barData} width={350} height={180} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500">
              No duration data available
            </div>
          )}
        </div>
      </div>

      {/* Duration Stats */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-white font-medium">Timing Analysis</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">
              {stats.totalDuration < 1000
                ? `${stats.totalDuration}ms`
                : `${(stats.totalDuration / 1000).toFixed(1)}s`
              }
            </p>
            <p className="text-xs text-slate-400">Total Duration</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-cyan-400">{stats.avgDuration}ms</p>
            <p className="text-xs text-slate-400">Average</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.maxDuration}ms</p>
            <p className="text-xs text-slate-400">Slowest</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.minDuration}ms</p>
            <p className="text-xs text-slate-400">Fastest</p>
          </div>
        </div>
      </div>

      {/* Test Timeline (simplified) */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-white font-medium">Execution Timeline</h3>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2">
          {results.slice(0, 50).map((r, idx) => (
            <div
              key={idx}
              className={`
                w-3 h-8 rounded-sm flex-shrink-0 transition-transform hover:scale-110
                ${r.status === 'passed' ? 'bg-green-500' :
                  r.status === 'failed' ? 'bg-red-500' : 'bg-slate-500'
                }
              `}
              title={`${r.name}: ${r.status}`}
            />
          ))}
          {results.length > 50 && (
            <span className="text-xs text-slate-500 self-center ml-2">
              +{results.length - 50} more
            </span>
          )}
        </div>

        <div className="flex justify-center gap-6 mt-4 text-xs text-slate-500">
          <span>Left = First | Right = Last</span>
        </div>
      </div>
    </div>
  );
}
