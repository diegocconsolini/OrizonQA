'use client';

/**
 * Period Selector Component
 *
 * Dropdown for selecting time period.
 */

import { ChevronDown } from 'lucide-react';

const periods = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export default function PeriodSelector({ value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-surface-dark border border-white/10 rounded-lg px-4 py-2 pr-10 text-sm text-white font-medium cursor-pointer hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      >
        {periods.map((period) => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary-dark pointer-events-none" />
    </div>
  );
}
