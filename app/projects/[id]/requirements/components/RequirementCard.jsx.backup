'use client';

import Link from 'next/link';
import { FileText, TestTube2, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';

/**
 * RequirementCard Component
 *
 * Displays a requirement card with key information and coverage
 */
export default function RequirementCard({ requirement, projectId }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTypeColor = (type) => {
    const colors = {
      'Story': 'text-cyan-400 bg-cyan-500/10',
      'Epic': 'text-purple-400 bg-purple-500/10',
      'Bug': 'text-red-400 bg-red-500/10',
      'Feature': 'text-green-400 bg-green-500/10',
      'Task': 'text-yellow-400 bg-yellow-500/10'
    };
    return colors[type] || 'text-slate-400 bg-slate-500/10';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': 'text-cyan-400 bg-cyan-500/10',
      'In Progress': 'text-yellow-400 bg-yellow-500/10',
      'Done': 'text-green-400 bg-green-500/10',
      'Cancelled': 'text-slate-400 bg-slate-500/10'
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
    <Link href={`/projects/${projectId}/requirements/${requirement.id}`}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-violet-500 transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                {requirement.key}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(requirement.type)}`}>
                {requirement.type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(requirement.status)}`}>
                {requirement.status}
              </span>
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-violet-400 transition-colors line-clamp-2">
              {requirement.title}
            </h3>
          </div>
          <div className={`text-lg font-bold ${getPriorityColor(requirement.priority)}`}>
            {requirement.priority === 'Critical' && '!!!'}
            {requirement.priority === 'High' && '!!'}
            {requirement.priority === 'Medium' && '!'}
            {requirement.priority === 'Low' && '·'}
          </div>
        </div>

        {/* Description */}
        {requirement.description && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-3">
            {requirement.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-sm">
            <TestTube2 className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">{requirement.test_count || 0}</span>
            <span className="text-slate-500 text-xs">tests</span>
          </div>
          {requirement.version && (
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">{requirement.version}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>Created {formatDate(requirement.created_at)}</span>
          </div>
          {requirement.external_id && (
            <div className="flex items-center gap-1.5 text-xs text-violet-400">
              <ExternalLink className="w-3 h-3" />
              <span>{requirement.external_id}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
