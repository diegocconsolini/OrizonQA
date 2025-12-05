'use client';

/**
 * Goal Selector Component
 *
 * Allows users to select an analysis goal instead of manually picking files.
 * Each goal auto-configures file selection and output settings.
 */

import { useMemo } from 'react';
import {
  Layers, Server, Wrench, TestTube, FileText, ClipboardList, Settings,
  Play, Check, ChevronRight, Sparkles, AlertCircle
} from 'lucide-react';
import { getAvailableGoals } from '@/lib/analysisGoals';

// Icon mapping
const ICONS = {
  Layers,
  Server,
  Wrench,
  TestTube,
  FileText,
  ClipboardList,
  Settings
};

// Color classes mapping
const COLORS = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    selected: 'bg-blue-500/20 border-blue-500/50'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    selected: 'bg-green-500/20 border-green-500/50'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    selected: 'bg-purple-500/20 border-purple-500/50'
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    selected: 'bg-amber-500/20 border-amber-500/50'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    selected: 'bg-cyan-500/20 border-cyan-500/50'
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    selected: 'bg-rose-500/20 border-rose-500/50'
  },
  gray: {
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-text-secondary-dark',
    selected: 'bg-white/10 border-white/30'
  }
};

export default function GoalSelector({
  repoAnalysis,
  selectedGoal,
  onSelectGoal,
  className = ''
}) {
  // Get available goals based on repo analysis
  const availableGoals = useMemo(() => {
    return getAvailableGoals(repoAnalysis);
  }, [repoAnalysis]);

  // Separate goals with files from custom
  const goalsWithFiles = availableGoals.filter(g => g.id !== 'custom' && g.fileCount > 0);
  const customGoal = availableGoals.find(g => g.id === 'custom');

  if (!repoAnalysis) {
    return (
      <div className={`bg-surface-dark border border-white/10 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 text-text-secondary-dark">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Select a repository to see available analysis goals</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-surface-dark border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-primary/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-white">What do you want to generate?</h3>
        </div>
        <p className="text-xs text-text-secondary-dark mt-1">
          Select a goal to auto-configure files and settings
        </p>
      </div>

      <div className="p-4">
        {/* Goals Grid */}
        {goalsWithFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {goalsWithFiles.map(goal => {
              const Icon = ICONS[goal.icon] || Settings;
              const colors = COLORS[goal.color] || COLORS.gray;
              const isSelected = selectedGoal?.id === goal.id;

              return (
                <button
                  key={goal.id}
                  onClick={() => onSelectGoal(goal)}
                  className={`relative p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? colors.selected + ' ring-2 ring-primary/50'
                      : colors.bg + ' ' + colors.border + ' hover:border-white/30'
                  }`}
                >
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  {/* Icon and Title */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {goal.name}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary-dark mt-0.5 line-clamp-2">
                        {goal.description}
                      </p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                    <span className="text-xs text-text-secondary-dark">
                      {goal.fileCount} file{goal.fileCount !== 1 ? 's' : ''}
                    </span>
                    {goal.executable && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <Play className="w-3 h-3" />
                        Executable
                      </span>
                    )}
                    {!goal.executable && goal.outputs.includes('testCases') && (
                      <span className="text-xs text-amber-400">
                        Documentation
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-text-secondary-dark">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No categorizable files found</p>
            <p className="text-xs mt-1">Use custom selection to pick files manually</p>
          </div>
        )}

        {/* Custom Selection Option */}
        {customGoal && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => onSelectGoal(customGoal)}
              className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                selectedGoal?.id === 'custom'
                  ? 'bg-white/10 border-white/30 ring-2 ring-primary/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-text-secondary-dark" />
                <div>
                  <span className="text-sm font-medium text-white">Custom Selection</span>
                  <p className="text-xs text-text-secondary-dark">
                    Manually pick files and configure all options
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-text-secondary-dark transition-transform ${
                selectedGoal?.id === 'custom' ? 'rotate-90' : ''
              }`} />
            </button>
          </div>
        )}

        {/* Selected Goal Summary */}
        {selectedGoal && selectedGoal.id !== 'custom' && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">
                  {selectedGoal.name} selected
                </p>
                <p className="text-xs text-text-secondary-dark mt-0.5">
                  {selectedGoal.fileCount} files will be analyzed.
                  {selectedGoal.executable
                    ? ' Tests will be executable.'
                    : ' Output will be documentation.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
