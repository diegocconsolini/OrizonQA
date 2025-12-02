'use client';

import Link from 'next/link';
import { FolderKanban, TestTube2, FileText, Bug, Calendar, TrendingUp } from 'lucide-react';

/**
 * ProjectCard Component
 *
 * Displays a project card with statistics and quick actions
 */
export default function ProjectCard({ project }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-cyan-500 transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {project.name}
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                  {project.key}
                </span>
              </div>
            </div>
            {project.description && (
              <p className="text-sm text-slate-400 line-clamp-2 mt-2">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center">
              <TestTube2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Tests</p>
              <p className="text-lg font-semibold text-white">
                {project.test_count || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Requirements</p>
              <p className="text-lg font-semibold text-white">
                {project.requirement_count || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Test Runs</p>
              <p className="text-lg font-semibold text-white">
                {project.run_count || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center">
              <Bug className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Defects</p>
              <p className="text-lg font-semibold text-white">
                {project.defect_count || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>Created {formatDate(project.created_at)}</span>
          </div>
          {project.is_active && (
            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded">
              Active
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
