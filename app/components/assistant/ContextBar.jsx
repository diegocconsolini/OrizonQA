'use client';

import {
  FolderOpen,
  FileCode,
  Upload,
  GitBranch,
  Package,
  TestTube,
  LayoutDashboard
} from 'lucide-react';

const PAGE_ICONS = {
  analyze: FolderOpen,
  'analyze-v2': FolderOpen,
  projects: Package,
  execute: TestTube,
  reports: TestTube,
  dashboard: LayoutDashboard,
  default: FileCode
};

export default function ContextBar({ context }) {
  if (!context) return null;

  const Icon = PAGE_ICONS[context.page] || PAGE_ICONS.default;

  return (
    <div className="mx-3 mt-3 p-2.5 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center gap-2 text-xs">
        <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />

        {/* Page-specific context display */}
        {context.page === 'analyze' && context.data && (
          <>
            {context.data.sourceType === 'github' && (
              <>
                <span className="text-white font-medium">{context.data.fileCount || 0} files</span>
                <span className="text-text-secondary">from</span>
                <span className="text-primary truncate max-w-[120px]">{context.data.repo}</span>
                {context.data.branch && (
                  <>
                    <GitBranch className="w-3 h-3 text-text-secondary" />
                    <span className="text-text-secondary">{context.data.branch}</span>
                  </>
                )}
              </>
            )}
            {context.data.sourceType === 'paste' && (
              <>
                <span className="text-white font-medium">Pasted code</span>
                <span className="text-text-secondary">
                  ({context.data.charCount?.toLocaleString() || 0} chars)
                </span>
              </>
            )}
            {context.data.sourceType === 'upload' && (
              <>
                <Upload className="w-3 h-3 text-text-secondary" />
                <span className="text-white font-medium">{context.data.fileCount || 0} files</span>
                <span className="text-text-secondary">uploaded</span>
              </>
            )}
          </>
        )}

        {context.page === 'projects' && context.data && (
          <>
            <span className="text-white font-medium truncate max-w-[150px]">
              {context.data.projectName || 'Project'}
            </span>
            {context.data.reqCount !== undefined && (
              <>
                <span className="text-text-secondary">•</span>
                <span className="text-text-secondary">{context.data.reqCount} requirements</span>
              </>
            )}
            {context.data.testCount !== undefined && (
              <>
                <span className="text-text-secondary">•</span>
                <span className="text-text-secondary">{context.data.testCount} tests</span>
              </>
            )}
          </>
        )}

        {context.page === 'execute' && context.data && (
          <>
            <span className="text-white font-medium">{context.data.testCount || 0} tests</span>
            <span className="text-text-secondary">selected</span>
            {context.data.framework && (
              <>
                <span className="text-text-secondary">•</span>
                <span className="text-primary">{context.data.framework}</span>
              </>
            )}
          </>
        )}

        {context.page === 'reports' && context.data && (
          <>
            <span className="text-white font-medium">Test Results</span>
            {context.data.passed !== undefined && (
              <>
                <span className="text-green-400">{context.data.passed} passed</span>
                <span className="text-text-secondary">/</span>
                <span className="text-red-400">{context.data.failed} failed</span>
              </>
            )}
          </>
        )}

        {/* Fallback for pages without specific context */}
        {!['analyze', 'analyze-v2', 'projects', 'execute', 'reports'].includes(context.page) && (
          <span className="text-white font-medium">{context.title || context.page}</span>
        )}
      </div>
    </div>
  );
}
