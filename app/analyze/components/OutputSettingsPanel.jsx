'use client';

/**
 * Output Settings Panel
 *
 * Comprehensive output configuration with:
 * - Format selection (12 formats with samples)
 * - Test framework selection (15 frameworks with samples)
 * - Context builder with presets
 */

import { useState, useMemo, useEffect } from 'react';
import {
  FileText, Globe, Braces, FileCode, Table, Trello, LayoutList,
  Radar, Cloud, CheckSquare, Bot, Code, ChevronDown, ChevronRight,
  Eye, Copy, Check, Rocket, Building, Server, Github, Star,
  Lock, Shield, CheckCircle, Database, Layout, FileInput,
  AlertCircle, AlertTriangle, ShieldCheck, Zap, Smile, X
} from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import {
  OUTPUT_FORMATS,
  FORMAT_CATEGORIES,
  getFormat,
  getFormatsByCategory
} from '@/lib/outputFormats';
import {
  TEST_FRAMEWORKS,
  FRAMEWORK_LANGUAGES,
  getFramework,
  getRecommendedFrameworks,
  detectLanguagesFromFiles
} from '@/lib/testFrameworks';
import {
  CONTEXT_PRESETS,
  PROJECT_TYPES,
  PRIORITY_AREAS,
  TEST_STYLES,
  TECH_STACK_SUGGESTIONS,
  getDefaultContext,
  applyPreset,
  buildContextPrompt
} from '@/lib/contextBuilder';

// Icon mapping
const ICONS = {
  FileText, Globe, Braces, FileCode, Table, Trello, LayoutList,
  Radar, Cloud, CheckSquare, Bot, Code, Plug: Server,
  Database, Rocket, Building, Server, Github, Star, Lock,
  Shield, CheckCircle, Layout, FileInput, AlertCircle,
  AlertTriangle, ShieldCheck, Zap, Smile
};

// Color classes
const COLOR_CLASSES = {
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  green: 'text-green-400 bg-green-500/10 border-green-500/30',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  red: 'text-red-400 bg-red-500/10 border-red-500/30',
  yellow: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  brown: 'text-amber-600 bg-amber-600/10 border-amber-600/30',
  gray: 'text-slate-400 bg-slate-500/10 border-slate-500/30'
};

export default function OutputSettingsPanel({
  selectedFiles = [],
  config,
  setConfig,
  onOutputSettingsChange
}) {
  // Expanded sections
  const [expandedSection, setExpandedSection] = useState('format');

  // Preview states
  const [showFormatPreview, setShowFormatPreview] = useState(false);
  const [showFrameworkPreview, setShowFrameworkPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Context state
  const [context, setContext] = useState(getDefaultContext());

  // Detected languages from files
  const detectedLanguages = useMemo(() => {
    return detectLanguagesFromFiles(selectedFiles);
  }, [selectedFiles]);

  // Recommended frameworks
  const recommendedFrameworks = useMemo(() => {
    return getRecommendedFrameworks(selectedFiles);
  }, [selectedFiles]);

  // Current selections
  const selectedFormat = getFormat(config.outputFormat || 'markdown');
  const selectedFramework = getFramework(config.testFramework || 'generic');

  // Update parent when settings change
  useEffect(() => {
    const contextPrompt = buildContextPrompt(context);
    onOutputSettingsChange?.({
      format: selectedFormat,
      framework: selectedFramework,
      context,
      contextPrompt,
      formatInstructions: selectedFormat.promptInstructions,
      frameworkInstructions: selectedFramework.promptInstructions
    });
  }, [config.outputFormat, config.testFramework, context]);

  // Handle format selection
  const handleFormatSelect = (formatId) => {
    setConfig(prev => ({ ...prev, outputFormat: formatId }));
  };

  // Handle framework selection
  const handleFrameworkSelect = (frameworkId) => {
    setConfig(prev => ({ ...prev, testFramework: frameworkId }));
  };

  // Copy sample to clipboard
  const handleCopySample = async (sample) => {
    await navigator.clipboard.writeText(sample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Apply context preset
  const handleApplyPreset = (presetId) => {
    setContext(applyPreset(presetId, context));
  };

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Render format selector
  const renderFormatSelector = () => {
    const isExpanded = expandedSection === 'format';

    return (
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection('format')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Output Format</h3>
              <p className="text-sm text-text-secondary-dark">
                {selectedFormat.name} ({selectedFormat.extension})
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-text-secondary-dark" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-secondary-dark" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 border-t border-white/10">
            {/* Format categories */}
            {Object.entries(FORMAT_CATEGORIES).map(([catId, category]) => (
              <div key={catId} className="mb-4 last:mb-0">
                <h4 className="text-xs font-medium text-text-secondary-dark uppercase tracking-wide mb-2">
                  {category.label}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {getFormatsByCategory(catId).map(format => {
                    const isSelected = format.id === config.outputFormat;
                    const Icon = ICONS[format.icon] || FileText;

                    return (
                      <button
                        key={format.id}
                        onClick={() => handleFormatSelect(format.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-white'}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-white'}`}>
                            {format.name}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary-dark line-clamp-1">
                          {format.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Format preview */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowFormatPreview(!showFormatPreview)}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
              >
                <Eye className="w-4 h-4" />
                {showFormatPreview ? 'Hide' : 'Show'} Sample Output
              </button>

              {showFormatPreview && (
                <div className="mt-3 relative">
                  <pre className="p-4 bg-bg-dark rounded-lg text-xs text-text-secondary-dark overflow-x-auto max-h-64 overflow-y-auto">
                    {selectedFormat.sample}
                  </pre>
                  <button
                    onClick={() => handleCopySample(selectedFormat.sample)}
                    className="absolute top-2 right-2 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  // Render framework selector
  const renderFrameworkSelector = () => {
    const isExpanded = expandedSection === 'framework';

    // Group frameworks by language
    const frameworksByLanguage = useMemo(() => {
      const grouped = {};
      Object.values(TEST_FRAMEWORKS).forEach(fw => {
        const lang = fw.language === 'any' ? 'any' : fw.language;
        if (!grouped[lang]) grouped[lang] = [];
        grouped[lang].push(fw);
      });
      return grouped;
    }, []);

    return (
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection('framework')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Code className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Test Framework</h3>
              <p className="text-sm text-text-secondary-dark">
                {selectedFramework.name}
                {detectedLanguages.length > 0 && (
                  <span className="ml-2 text-green-400">
                    (detected: {detectedLanguages.join(', ')})
                  </span>
                )}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-text-secondary-dark" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-secondary-dark" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 border-t border-white/10">
            {/* Recommended frameworks */}
            {recommendedFrameworks.length > 0 && recommendedFrameworks[0].id !== 'generic' && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400 mb-2">
                  Recommended for your files:
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendedFrameworks.slice(0, 4).map(fw => (
                    <button
                      key={fw.id}
                      onClick={() => handleFrameworkSelect(fw.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        fw.id === config.testFramework
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {fw.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All frameworks by language */}
            {Object.entries(frameworksByLanguage).map(([langId, frameworks]) => {
              const lang = langId === 'any' ? null : FRAMEWORK_LANGUAGES[langId];
              const langName = lang?.name || 'Universal';
              const isDetected = detectedLanguages.includes(langId);

              return (
                <div key={langId} className="mb-4 last:mb-0">
                  <h4 className={`text-xs font-medium uppercase tracking-wide mb-2 ${
                    isDetected ? 'text-green-400' : 'text-text-secondary-dark'
                  }`}>
                    {langName}
                    {isDetected && ' (detected)'}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {frameworks.map(fw => {
                      const isSelected = fw.id === config.testFramework;
                      const colorClass = COLOR_CLASSES[fw.color] || COLOR_CLASSES.gray;

                      return (
                        <button
                          key={fw.id}
                          onClick={() => handleFrameworkSelect(fw.id)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${colorClass.split(' ')[1]}`} />
                            <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-white'}`}>
                              {fw.name}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary-dark">
                            {fw.type}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Framework preview */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowFrameworkPreview(!showFrameworkPreview)}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
              >
                <Eye className="w-4 h-4" />
                {showFrameworkPreview ? 'Hide' : 'Show'} Syntax Sample
              </button>

              {showFrameworkPreview && (
                <div className="mt-3 relative">
                  <pre className="p-4 bg-bg-dark rounded-lg text-xs text-text-secondary-dark overflow-x-auto max-h-64 overflow-y-auto">
                    {selectedFramework.sample}
                  </pre>
                  <button
                    onClick={() => handleCopySample(selectedFramework.sample)}
                    className="absolute top-2 right-2 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  // Render context builder
  const renderContextBuilder = () => {
    const isExpanded = expandedSection === 'context';

    return (
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection('context')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Star className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Analysis Context</h3>
              <p className="text-sm text-text-secondary-dark">
                {context.projectName || 'Configure project details'}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-text-secondary-dark" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-secondary-dark" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 border-t border-white/10">
            {/* Context presets */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-text-secondary-dark uppercase tracking-wide mb-2">
                Quick Presets
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(CONTEXT_PRESETS).map(([presetId, preset]) => {
                  const Icon = ICONS[preset.icon] || Star;

                  return (
                    <button
                      key={presetId}
                      onClick={() => handleApplyPreset(presetId)}
                      className="p-3 rounded-lg border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-white">{preset.name}</span>
                      </div>
                      <p className="text-xs text-text-secondary-dark">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project name */}
            <div className="mb-4">
              <label className="block text-sm text-text-secondary-dark mb-2">
                Project Name (optional)
              </label>
              <input
                type="text"
                value={context.projectName}
                onChange={(e) => setContext({ ...context, projectName: e.target.value })}
                placeholder="My Project"
                className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-sm text-white
                         focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Project type */}
            <div className="mb-4">
              <label className="block text-sm text-text-secondary-dark mb-2">
                Project Type
              </label>
              <select
                value={context.projectType}
                onChange={(e) => setContext({ ...context, projectType: e.target.value })}
                className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-sm text-white
                         focus:outline-none focus:border-primary/50"
              >
                {PROJECT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Focus areas */}
            <div className="mb-4">
              <label className="block text-sm text-text-secondary-dark mb-2">
                Focus Areas
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_AREAS.map(area => {
                  const isSelected = context.priority?.includes(area.id);
                  const Icon = ICONS[area.icon] || Star;

                  return (
                    <button
                      key={area.id}
                      onClick={() => {
                        const newPriority = isSelected
                          ? context.priority.filter(p => p !== area.id)
                          : [...(context.priority || []), area.id];
                        setContext({ ...context, priority: newPriority });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {area.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Test style */}
            <div className="mb-4">
              <label className="block text-sm text-text-secondary-dark mb-2">
                Test Style
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {TEST_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setContext({ ...context, testStyle: style.id })}
                    className={`p-2 rounded-lg border transition-all text-center ${
                      context.testStyle === style.id
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-white/10 hover:border-white/20 text-text-secondary-dark'
                    }`}
                  >
                    <p className="text-xs font-medium">{style.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Coverage target */}
            <div className="mb-4">
              <label className="block text-sm text-text-secondary-dark mb-2">
                Target Coverage: {context.coverageTarget}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={context.coverageTarget}
                onChange={(e) => setContext({ ...context, coverageTarget: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-text-secondary-dark mt-1">
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Additional instructions */}
            <div>
              <label className="block text-sm text-text-secondary-dark mb-2">
                Additional Instructions
              </label>
              <textarea
                value={context.instructions}
                onChange={(e) => setContext({ ...context, instructions: e.target.value })}
                placeholder="Any specific requirements, conventions, or focus areas..."
                rows={3}
                className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-sm text-white
                         focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {renderFormatSelector()}
      {renderFrameworkSelector()}
      {renderContextBuilder()}
    </div>
  );
}
