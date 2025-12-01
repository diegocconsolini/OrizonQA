'use client';

import Link from 'next/link';
import { TestTube2, Calendar, FileText, CheckCircle2, Bot, Zap } from 'lucide-react';

/**
 * TestCaseCard Component
 *
 * Displays a test case card with key information, status, and metadata
 */
export default function TestCaseCard({ test, projectId }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTypeColor = (type) => {
    const colors = {
      'Functional': 'text-blue-400 bg-blue-500/10',
      'Integration': 'text-purple-400 bg-purple-500/10',
      'E2E': 'text-cyan-400 bg-cyan-500/10',
      'Performance': 'text-orange-400 bg-orange-500/10',
      'Security': 'text-red-400 bg-red-500/10',
      'API': 'text-green-400 bg-green-500/10',
      'UI': 'text-pink-400 bg-pink-500/10'
    };
    return colors[type] || 'text-slate-400 bg-slate-500/10';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'text-slate-400 bg-slate-500/10',
      'Ready': 'text-cyan-400 bg-cyan-500/10',
      'Active': 'text-green-400 bg-green-500/10',
      'Deprecated': 'text-orange-400 bg-orange-500/10'
    };
    return colors[status] || 'text-slate-400 bg-slate-500/10';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'text-red-400',
      'High': 'text-orange-400',
      'Medium': 'text-yellow-400',
      'Low': 'text-green-400'
    };
    return colors[priority] || 'text-slate-400';
  };

  return (
    <Link href={`/projects/${projectId}/tests/${test.id}`}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-cyan-500 transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                {test.key}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(test.type)}`}>
                {test.type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(test.status)}`}>
                {test.status}
              </span>
              {test.is_automated && (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Automated
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
              {test.title}
            </h3>
          </div>
          <div className={`text-lg font-bold ${getPriorityColor(test.priority)}`}>
            {test.priority === 'Critical' && '!!!'}
            {test.priority === 'High' && '!!'}
            {test.priority === 'Medium' && '!'}
            {test.priority === 'Low' && '·'}
          </div>
        </div>

        {/* Description */}
        {test.description && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-3">
            {test.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-sm">
            <FileText className="w-4 h-4 text-violet-400" />
            <span className="text-slate-300">{test.requirement_count || 0}</span>
            <span className="text-slate-500 text-xs">req{test.requirement_count !== 1 && 's'}</span>
          </div>
          {test.estimated_duration && (
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">{test.estimated_duration}</span>
              <span className="text-slate-500 text-xs">min</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>Created {formatDate(test.created_at)}</span>
          </div>
          {test.automation_status && test.is_automated && (
            <div className="flex items-center gap-1.5 text-xs">
              <Bot className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">{test.automation_status}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
