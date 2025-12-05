'use client';

/**
 * Repository Analysis Summary Component
 *
 * Displays the results of automatic repository pre-analysis:
 * - Detected tech stack
 * - Detected test framework
 * - File categories with counts
 * - Recommendations for what can be generated
 */

import { useMemo } from 'react';
import {
  Code, TestTube, Layers, FileCode, FolderTree, Sparkles,
  Check, X, Zap, AlertTriangle, Info, Play, ChevronRight
} from 'lucide-react';

export default function RepoAnalysisSummary({
  analysis,
  onSelectRecommendation,
  selectedRecommendation,
  isLoading = false,
  className = ''
}) {
  if (isLoading) {
    return (
      <div className={`bg-surface-dark border border-white/10 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary-dark">Analyzing repository...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const { techStack, testFramework, categories, recommendations, summary } = analysis;

  return (
    <div className={`bg-surface-dark border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-primary/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-white">Repository Analysis</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Tech Stack & Test Framework Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tech Stack */}
          <div className="p-3 bg-bg-dark/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-text-secondary-dark">Tech Stack</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {techStack.length > 0 ? (
                techStack.map(tech => (
                  <span
                    key={tech.id}
                    className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400"
                  >
                    {tech.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-secondary-dark">Not detected</span>
              )}
            </div>
          </div>

          {/* Test Framework */}
          <div className="p-3 bg-bg-dark/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TestTube className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-text-secondary-dark">Test Framework</span>
            </div>
            {testFramework ? (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                  {testFramework.name}
                </span>
                {testFramework.executable && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <Play className="w-3 h-3" />
                    Executable
                  </span>
                )}
                <span className="text-xs text-text-secondary-dark">
                  (from {testFramework.source})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400">No framework detected</span>
                <span className="text-xs text-text-secondary-dark">
                  - will use Jest by default
                </span>
              </div>
            )}
          </div>
        </div>

        {/* File Categories */}
        <div className="p-3 bg-bg-dark/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FolderTree className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-text-secondary-dark">
              Found in Repository ({summary.totalFiles} files)
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(categories).map(([catId, category]) => (
              <div
                key={catId}
                className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5"
              >
                <span className="text-xs text-white">{category.name}</span>
                <span className="text-xs font-semibold text-primary">{category.count}</span>
              </div>
            ))}
          </div>
          {summary.hasExistingTests && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{summary.existingTestCount} existing test files found</span>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white">What You Can Generate</span>
            </div>
            <div className="space-y-2">
              {recommendations.map(rec => (
                <button
                  key={rec.id}
                  onClick={() => onSelectRecommendation?.(rec)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedRecommendation?.id === rec.id
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{rec.title}</span>
                        {rec.executable && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 rounded text-xs text-green-400">
                            <Play className="w-3 h-3" />
                            Executable
                          </span>
                        )}
                        {rec.priority === 'high' && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 rounded text-xs text-amber-400">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary-dark mt-1">{rec.description}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-text-secondary-dark transition-transform ${
                      selectedRecommendation?.id === rec.id ? 'rotate-90 text-primary' : ''
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Executability Status Banner */}
        <div className={`p-3 rounded-lg ${
          summary.canGenerateExecutableTests
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-amber-500/10 border border-amber-500/30'
        }`}>
          {summary.canGenerateExecutableTests ? (
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-200 font-medium">
                  Executable tests can be generated
                </p>
                <p className="text-xs text-green-300/70 mt-0.5">
                  Using {testFramework?.name || 'Jest'}. Tests can be run with the Execute button.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-200 font-medium">
                  No test framework detected
                </p>
                <p className="text-xs text-amber-300/70 mt-0.5">
                  Tests will be generated using Jest format by default.
                  Add jest/vitest/mocha to package.json for auto-detection.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
