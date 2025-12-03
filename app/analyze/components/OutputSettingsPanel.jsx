'use client';

/**
 * Output Settings Panel - Streamlined Version
 *
 * Compact dropdown-based interface replacing the card-heavy design.
 * Features:
 * - Format dropdown with grouped categories
 * - Framework dropdown with recommended options
 * - Simple context text input
 * - Optional advanced settings (collapsed by default)
 */

import { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, Eye, Copy, Check, Settings2,
  FileText, Code, Sparkles
} from 'lucide-react';
import Card from '@/app/components/ui/Card';
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
  PRIORITY_AREAS,
  TEST_STYLES,
  getDefaultContext,
  buildContextPrompt
} from '@/lib/contextBuilder';

export default function OutputSettingsPanel({
  selectedFiles = [],
  config,
  setConfig,
  onOutputSettingsChange
}) {
  // State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(null); // 'format' | 'framework' | null
  const [copied, setCopied] = useState(false);
  const [context, setContext] = useState(getDefaultContext());

  // Detected languages from files
  const detectedLanguages = useMemo(() => {
    return detectLanguagesFromFiles(selectedFiles);
  }, [selectedFiles]);

  // Recommended frameworks based on files
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

  // Handle format change
  const handleFormatChange = (e) => {
    setConfig(prev => ({ ...prev, outputFormat: e.target.value }));
  };

  // Handle framework change
  const handleFrameworkChange = (e) => {
    setConfig(prev => ({ ...prev, testFramework: e.target.value }));
  };

  // Handle context change
  const handleContextChange = (e) => {
    setContext(prev => ({ ...prev, instructions: e.target.value }));
  };

  // Copy sample to clipboard
  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle focus area
  const toggleFocusArea = (areaId) => {
    const current = context.priority || [];
    const newPriority = current.includes(areaId)
      ? current.filter(p => p !== areaId)
      : [...current, areaId];
    setContext(prev => ({ ...prev, priority: newPriority }));
  };

  // Group frameworks by language for dropdown
  const frameworkGroups = useMemo(() => {
    const groups = {};
    Object.values(TEST_FRAMEWORKS).forEach(fw => {
      const lang = fw.language === 'any' ? 'universal' : fw.language;
      if (!groups[lang]) groups[lang] = [];
      groups[lang].push(fw);
    });
    return groups;
  }, []);

  // Build recommended IDs for highlighting
  const recommendedIds = useMemo(() => {
    return new Set(recommendedFrameworks.map(f => f.id));
  }, [recommendedFrameworks]);

  return (
    <Card className="p-6">
      {/* Main Controls - 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Format Dropdown */}
        <div>
          <label className="block text-sm font-medium text-text-secondary-dark mb-2">
            <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Output Format
          </label>
          <select
            value={config.outputFormat || 'markdown'}
            onChange={handleFormatChange}
            className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-sm text-white
                     focus:outline-none focus:border-primary/50 appearance-none cursor-pointer
                     hover:border-white/20 transition-colors"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
          >
            {Object.entries(FORMAT_CATEGORIES).map(([catId, category]) => (
              <optgroup key={catId} label={category.label}>
                {getFormatsByCategory(catId).map(format => (
                  <option key={format.id} value={format.id}>
                    {format.name} ({format.extension})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {/* Preview link */}
          <button
            onClick={() => setShowPreview(showPreview === 'format' ? null : 'format')}
            className="mt-1.5 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            {showPreview === 'format' ? 'Hide' : 'Preview'} sample
          </button>
        </div>

        {/* Framework Dropdown */}
        <div>
          <label className="block text-sm font-medium text-text-secondary-dark mb-2">
            <Code className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Test Framework
            {detectedLanguages.length > 0 && (
              <span className="ml-2 text-xs text-green-400">
                ({detectedLanguages.join(', ')} detected)
              </span>
            )}
          </label>
          <select
            value={config.testFramework || 'generic'}
            onChange={handleFrameworkChange}
            className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-sm text-white
                     focus:outline-none focus:border-primary/50 appearance-none cursor-pointer
                     hover:border-white/20 transition-colors"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
          >
            {/* Recommended section if we have recommendations */}
            {recommendedFrameworks.length > 0 && recommendedFrameworks[0].id !== 'generic' && (
              <optgroup label="Recommended">
                {recommendedFrameworks.slice(0, 3).map(fw => (
                  <option key={`rec-${fw.id}`} value={fw.id}>
                    {fw.name} (recommended)
                  </option>
                ))}
              </optgroup>
            )}
            {/* All frameworks by language */}
            {Object.entries(frameworkGroups).map(([lang, frameworks]) => {
              const langName = lang === 'universal' ? 'Universal' : (FRAMEWORK_LANGUAGES[lang]?.name || lang);
              return (
                <optgroup key={lang} label={langName}>
                  {frameworks.map(fw => (
                    <option key={fw.id} value={fw.id}>
                      {fw.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          {/* Preview link */}
          <button
            onClick={() => setShowPreview(showPreview === 'framework' ? null : 'framework')}
            className="mt-1.5 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            {showPreview === 'framework' ? 'Hide' : 'Preview'} syntax
          </button>
        </div>

        {/* Context Input */}
        <div>
          <label className="block text-sm font-medium text-text-secondary-dark mb-2">
            <Sparkles className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Context (optional)
          </label>
          <input
            type="text"
            value={context.instructions || ''}
            onChange={handleContextChange}
            placeholder="e.g. React app, auth system, e-commerce..."
            className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-sm text-white
                     focus:outline-none focus:border-primary/50 placeholder:text-white/30
                     hover:border-white/20 transition-colors"
          />
          <p className="mt-1.5 text-xs text-text-secondary-dark">
            Helps generate more relevant test cases
          </p>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="mb-4 p-4 bg-bg-dark rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-white">
              {showPreview === 'format' ? `${selectedFormat.name} Sample` : `${selectedFramework.name} Syntax`}
            </h4>
            <button
              onClick={() => handleCopy(showPreview === 'format' ? selectedFormat.sample : selectedFramework.sample)}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-text-secondary-dark" />
              )}
            </button>
          </div>
          <pre className="text-xs text-text-secondary-dark overflow-x-auto max-h-48 overflow-y-auto">
            {showPreview === 'format' ? selectedFormat.sample : selectedFramework.sample}
          </pre>
        </div>
      )}

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-text-secondary-dark hover:text-white transition-colors"
      >
        <Settings2 className="w-4 h-4" />
        Advanced Options
        {showAdvanced ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Advanced Options Section */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          {/* Focus Areas */}
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-2">
              Focus Areas
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_AREAS.slice(0, 8).map(area => {
                const isSelected = context.priority?.includes(area.id);
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleFocusArea(area.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-primary/20 text-primary border border-primary'
                        : 'bg-white/5 text-text-secondary-dark hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {area.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Style */}
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-2">
              Test Style
            </label>
            <div className="flex flex-wrap gap-2">
              {TEST_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setContext(prev => ({ ...prev, testStyle: style.id }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    context.testStyle === style.id
                      ? 'bg-primary/20 text-primary border border-primary'
                      : 'bg-white/5 text-text-secondary-dark hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coverage Target */}
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-2">
              Target Coverage: {context.coverageTarget || 80}%
            </label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={context.coverageTarget || 80}
              onChange={(e) => setContext(prev => ({ ...prev, coverageTarget: parseInt(e.target.value) }))}
              className="w-full max-w-xs accent-primary"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
