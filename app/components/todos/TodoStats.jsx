'use client';

import { CheckCircle2, Circle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

export default function TodoStats({ stats }) {
  if (!stats) return null;

  const total = parseInt(stats.total) || 0;
  const completed = parseInt(stats.completed) || 0;
  const pending = parseInt(stats.pending) || 0;
  const inProgress = parseInt(stats.in_progress) || 0;
  const overdue = parseInt(stats.overdue) || 0;
  const highPriority = parseInt(stats.high_priority) || 0;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const statItems = [
    {
      label: 'Total',
      value: total,
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Pending',
      value: pending,
      icon: Circle,
      color: 'text-slate-400',
      bg: 'bg-slate-500/10'
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10'
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      hide: overdue === 0
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {statItems.filter(item => !item.hide).map((item) => (
        <div
          key={item.label}
          className={`${item.bg} rounded-xl p-4 border border-slate-700/50`}
        >
          <div className="flex items-center gap-2 mb-2">
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className="text-sm text-slate-400">{item.label}</span>
          </div>
          <div className={`text-2xl font-bold ${item.color}`}>
            {item.value}
          </div>
        </div>
      ))}

      {/* Completion Rate */}
      {total > 0 && (
        <div className="col-span-2 sm:col-span-3 lg:col-span-5 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Completion Rate</span>
            <span className="text-sm font-medium text-white">{completionRate}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
