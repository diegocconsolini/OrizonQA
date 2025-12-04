'use client';

/**
 * Smart Configuration Panel
 *
 * Three-mode configuration interface:
 * - Easy: AI auto-configure with one-click
 * - Guided: Step-by-step wizard
 * - Expert: Full pattern control
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Settings2, Code2, Monitor, Server, Database,
  TestTube, Settings, Wrench, File, ChevronDown, ChevronRight,
  CheckSquare, FileText, Shield, AlertTriangle, Layers, X, Check,
  Info, Zap, RefreshCw
} from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import CardFileSelector from './CardFileSelector';
import {
  classifyFiles,
  getRecommendedConfig,
  estimateTokens,
  buildSmartConfig,
  CATEGORIES,
  OUTPUT_TYPES,
  ANALYSIS_GOALS
} from '@/lib/fileClassifier';

// Icon mapping
const ICONS = {
  Monitor, Server, Database, TestTube, Settings, Wrench, File,
  BookOpen: FileText, TestTube2: TestTube, CheckSquare, AlertTriangle, Shield, X, Layers
};

// Color classes mapping
const COLOR_CLASSES = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', activeBg: 'bg-blue-500/20', activeBorder: 'border-blue-500' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', activeBg: 'bg-green-500/20', activeBorder: 'border-green-500' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', activeBg: 'bg-purple-500/20', activeBorder: 'border-purple-500' },
  yellow: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', activeBg: 'bg-amber-500/20', activeBorder: 'border-amber-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', activeBg: 'bg-amber-500/20', activeBorder: 'border-amber-500' },
  gray: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', activeBg: 'bg-slate-500/20', activeBorder: 'border-slate-500' },
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', activeBg: 'bg-slate-500/20', activeBorder: 'border-slate-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', activeBg: 'bg-orange-500/20', activeBorder: 'border-orange-500' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', activeBg: 'bg-red-500/20', activeBorder: 'border-red-500' },
  primary: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', activeBg: 'bg-primary/20', activeBorder: 'border-primary' }
};

export default function SmartConfigPanel({
  selectedFiles = [],
  config,
  setConfig,
  onSmartConfigChange,
  fileTree = [],
  cardFiles = {},
  onCardFilesChange,
  onToggleSharedFiles
}) {
  // Mode state
  const [mode, setMode] = useState('guided'); // 'easy' | 'guided' | 'expert'

  // Classification results
  const [categories, setCategories] = useState({});

  // Goal selection (guided mode)
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Per-category config
  const [categoryConfig, setCategoryConfig] = useState({});

  // Expanded category (for file list view)
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Classify files when selection changes
  useEffect(() => {
    if (selectedFiles.length > 0) {
      const classified = classifyFiles(selectedFiles);
      setCategories(classified);

      // Initialize category config with defaults
      const initialConfig = {};
      Object.entries(classified).forEach(([catId, cat]) => {
        initialConfig[catId] = {
          enabled: !CATEGORIES[catId].alwaysSkip && cat.count > 0,
          outputTypes: CATEGORIES[catId].alwaysSkip ? ['skip'] : ['testCases'],
          files: cat.files,
          count: cat.count
        };
      });
      setCategoryConfig(initialConfig);
    }
  }, [selectedFiles]);

  // Apply goal-based recommendations
  useEffect(() => {
    if (selectedGoal && Object.keys(categories).length > 0) {
      const recommended = getRecommendedConfig(categories, selectedGoal);
      setCategoryConfig(recommended);
    }
  }, [selectedGoal, categories]);

  // Update smart config when category config changes
  useEffect(() => {
    if (Object.keys(categoryConfig).length > 0) {
      const smartConfig = buildSmartConfig(categoryConfig, config);
      onSmartConfigChange?.(smartConfig);

      // Also update legacy config for backward compatibility
      setConfig(prev => ({
        ...prev,
        userStories: smartConfig.userStories,
        testCases: smartConfig.testCases,
        acceptanceCriteria: smartConfig.acceptanceCriteria,
        edgeCases: smartConfig.edgeCases,
        securityTests: smartConfig.securityTests
      }));
    }
  }, [categoryConfig, config.outputFormat, config.testFramework, config.additionalContext]);

  // Token estimation
  const tokenEstimate = useMemo(() => {
    return estimateTokens(categoryConfig);
  }, [categoryConfig]);

  // Toggle category enabled
  const toggleCategory = (catId) => {
    setCategoryConfig(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        enabled: !prev[catId].enabled
      }
    }));
  };

  // Set category output type
  const setCategoryOutput = (catId, outputType) => {
    setCategoryConfig(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        outputTypes: [outputType],
        enabled: outputType !== 'skip'
      }
    }));
  };

  // Toggle specific output for category (multi-select)
  const toggleCategoryOutputType = (catId, outputType) => {
    setCategoryConfig(prev => {
      const current = prev[catId].outputTypes || [];
      const hasOutput = current.includes(outputType);

      let newOutputs;
      if (outputType === 'skip') {
        newOutputs = ['skip'];
      } else if (hasOutput) {
        newOutputs = current.filter(o => o !== outputType);
        if (newOutputs.length === 0) newOutputs = ['skip'];
      } else {
        newOutputs = [...current.filter(o => o !== 'skip'), outputType];
      }

      return {
        ...prev,
        [catId]: {
          ...prev[catId],
          outputTypes: newOutputs,
          enabled: !newOutputs.includes('skip')
        }
      };
    });
  };

  // Render mode tabs
  const renderModeTabs = () => (
    <div className="flex gap-2 mb-6">
      {[
        { id: 'easy', label: 'Easy Mode', icon: Sparkles, desc: 'AI recommends' },
        { id: 'guided', label: 'Guided', icon: Settings2, desc: 'Step by step' },
        { id: 'expert', label: 'Expert', icon: Code2, desc: 'Full control' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setMode(tab.id)}
          className={`flex-1 p-3 rounded-xl border-2 transition-all ${
            mode === tab.id
              ? 'border-primary bg-primary/10'
              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <tab.icon className={`w-4 h-4 ${mode === tab.id ? 'text-primary' : 'text-white'}`} />
            <span className={`text-sm font-medium ${mode === tab.id ? 'text-primary' : 'text-white'}`}>
              {tab.label}
            </span>
          </div>
          <p className="text-xs text-text-secondary-dark">{tab.desc}</p>
        </button>
      ))}
    </div>
  );

  // Render codebase scan results
  const renderScanResults = () => {
    const nonEmptyCategories = Object.entries(categories).filter(([_, cat]) => cat.count > 0);

    if (nonEmptyCategories.length === 0) {
      return (
        <Card className="p-6 bg-amber-500/5 border-amber-500/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-white font-medium">No files selected</p>
              <p className="text-sm text-text-secondary-dark">
                Select files from the Input tab to see classification
              </p>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Codebase Scan ({selectedFiles.length} files)
          </h4>
          <button
            onClick={() => {
              const classified = classifyFiles(selectedFiles);
              setCategories(classified);
            }}
            className="text-xs text-text-secondary-dark hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Rescan
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {nonEmptyCategories.map(([catId, cat]) => {
            const catDef = CATEGORIES[catId];
            const colors = COLOR_CLASSES[catDef.color];
            const Icon = ICONS[catDef.icon] || File;
            const isExpanded = expandedCategory === catId;

            return (
              <div key={catId}>
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : catId)}
                  className={`w-full p-3 rounded-lg ${colors.bg} border ${colors.border} text-left transition-all hover:opacity-80`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                      <span className="text-sm font-medium text-white">{catDef.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-text-secondary-dark" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-text-secondary-dark" />
                    )}
                  </div>
                  <p className={`text-lg font-bold ${colors.text}`}>{cat.count} files</p>
                </button>

                {isExpanded && (
                  <div className="mt-2 p-2 bg-bg-dark rounded-lg border border-white/10 max-h-40 overflow-y-auto">
                    {cat.files.slice(0, 20).map((file, i) => (
                      <p key={i} className="text-xs text-text-secondary-dark truncate py-0.5">
                        {file}
                      </p>
                    ))}
                    {cat.files.length > 20 && (
                      <p className="text-xs text-primary mt-1">+{cat.files.length - 20} more</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  // Render goal selector (guided mode step 1)
  const renderGoalSelector = () => (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-text-secondary-dark mb-3">
        Step 1: What do you need?
      </h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(ANALYSIS_GOALS).map(([goalId, goal]) => {
          const colors = COLOR_CLASSES[goal.color];
          const Icon = ICONS[goal.icon] || Layers;
          const isActive = selectedGoal === goalId;

          return (
            <button
              key={goalId}
              onClick={() => setSelectedGoal(goalId)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isActive
                  ? `${colors.activeBg} ${colors.activeBorder}`
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute top-2 right-2">
                  <Check className={`w-4 h-4 ${colors.text}`} />
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${colors.text}`} />
              </div>
              <p className={`font-medium mb-1 ${isActive ? 'text-white' : 'text-white'}`}>
                {goal.name}
              </p>
              <p className="text-xs text-text-secondary-dark">
                {goal.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render category configurator (guided mode step 2)
  const renderCategoryConfigurator = () => {
    const nonEmptyCategories = Object.entries(categories).filter(([_, cat]) => cat.count > 0);

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-text-secondary-dark mb-3">
          Step 2: Configure per category
        </h4>

        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-dark border-b border-white/10">
                <th className="text-left p-3 text-xs font-medium text-text-secondary-dark">Category</th>
                <th className="text-center p-3 text-xs font-medium text-text-secondary-dark">Files</th>
                <th className="text-center p-3 text-xs font-medium text-text-secondary-dark">Include</th>
                <th className="text-left p-3 text-xs font-medium text-text-secondary-dark">Output Type</th>
              </tr>
            </thead>
            <tbody>
              {nonEmptyCategories.map(([catId, cat]) => {
                const catDef = CATEGORIES[catId];
                const catConf = categoryConfig[catId] || {};
                const colors = COLOR_CLASSES[catDef.color];
                const Icon = ICONS[catDef.icon] || File;

                return (
                  <tr key={catId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${colors.bg}`}>
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <span className="text-sm text-white">{catDef.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-sm font-medium ${colors.text}`}>{cat.count}</span>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={catConf.enabled}
                        onChange={() => toggleCategory(catId)}
                        disabled={catDef.alwaysSkip}
                        className="w-5 h-5 rounded bg-bg-dark border-white/20 text-primary
                                 focus:ring-primary disabled:opacity-50"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={catConf.outputTypes?.[0] || 'skip'}
                        onChange={(e) => setCategoryOutput(catId, e.target.value)}
                        disabled={!catConf.enabled}
                        className="w-full bg-bg-dark border border-white/10 rounded-lg p-2 text-sm text-white
                                 focus:outline-none focus:border-primary/50 disabled:opacity-50"
                      >
                        {Object.entries(OUTPUT_TYPES).map(([outId, out]) => (
                          <option key={outId} value={outId}>{out.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // Render token estimate
  const renderTokenEstimate = () => (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-white">Estimated Usage</p>
            <p className="text-xs text-text-secondary-dark">
              {tokenEstimate.fileCount} files to analyze
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">
            ~{(tokenEstimate.totalTokens / 1000).toFixed(1)}K tokens
          </p>
          <p className="text-xs text-text-secondary-dark">
            Est. cost: {tokenEstimate.formattedCost}
          </p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      {renderModeTabs()}

      {/* Codebase Scan Results - Always visible */}
      {renderScanResults()}

      {/* Mode-specific content */}
      {mode === 'easy' && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-medium text-white">AI Auto-Configure</h3>
              <p className="text-sm text-text-secondary-dark">
                Select a goal and we&apos;ll configure everything automatically
              </p>
            </div>
          </div>

          {renderGoalSelector()}

          {selectedGoal && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Configuration Ready</span>
              </div>
              <p className="text-xs text-text-secondary-dark">
                {Object.values(categoryConfig).filter(c => c.enabled).length} categories will be analyzed
              </p>
            </div>
          )}
        </Card>
      )}

      {mode === 'guided' && (
        <>
          {renderGoalSelector()}
          {selectedGoal && renderCategoryConfigurator()}
        </>
      )}

      {mode === 'expert' && (
        <div className="space-y-6">
          {/* Per-Card File Selection */}
          {onCardFilesChange && (
            <CardFileSelector
              selectedFiles={selectedFiles}
              fileTree={fileTree}
              cardFiles={cardFiles}
              onCardFilesChange={onCardFilesChange}
              onToggleSharedFiles={onToggleSharedFiles}
              useSharedFiles={cardFiles.useSharedFiles}
            />
          )}

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Code2 className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium text-white">Category Configuration</h3>
                <p className="text-sm text-text-secondary-dark">
                  Full control over each category with multi-select outputs
                </p>
              </div>
            </div>

            {/* Advanced category config with multi-select */}
            <div className="space-y-3">
            {Object.entries(categories)
              .filter(([_, cat]) => cat.count > 0)
              .map(([catId, cat]) => {
                const catDef = CATEGORIES[catId];
                const catConf = categoryConfig[catId] || {};
                const colors = COLOR_CLASSES[catDef.color];
                const Icon = ICONS[catDef.icon] || File;

                return (
                  <div key={catId} className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={catConf.enabled}
                          onChange={() => toggleCategory(catId)}
                          disabled={catDef.alwaysSkip}
                          className="w-5 h-5 rounded bg-bg-dark border-white/20 text-primary"
                        />
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{catDef.name}</p>
                          <p className="text-xs text-text-secondary-dark">{cat.count} files</p>
                        </div>
                      </div>
                    </div>

                    {catConf.enabled && (
                      <div className="flex flex-wrap gap-2 ml-12">
                        {Object.entries(OUTPUT_TYPES)
                          .filter(([id]) => id !== 'skip')
                          .map(([outId, out]) => {
                            const isActive = catConf.outputTypes?.includes(outId);
                            const outColors = COLOR_CLASSES[out.color];

                            return (
                              <button
                                key={outId}
                                onClick={() => toggleCategoryOutputType(catId, outId)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                  isActive
                                    ? `${outColors.activeBg} ${outColors.text} border ${outColors.activeBorder}`
                                    : 'bg-white/5 text-text-secondary-dark border border-white/10 hover:border-white/20'
                                }`}
                              >
                                {out.name}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>
        </div>
      )}

      {/* Token Estimate - Always visible */}
      {tokenEstimate.fileCount > 0 && renderTokenEstimate()}
    </div>
  );
}
