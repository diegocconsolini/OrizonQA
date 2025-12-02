'use client';

/**
 * Config Presets Component
 *
 * Quick-select analysis configuration presets.
 * Users can choose between predefined configurations for common use cases.
 */

import { Zap, Search, Shield, FileText, Check } from 'lucide-react';

const PRESETS = {
  quick: {
    id: 'quick',
    name: 'Quick Scan',
    description: 'Fast analysis with essential tests',
    icon: Zap,
    color: 'amber',
    config: {
      userStories: true,
      testCases: true,
      acceptanceCriteria: false,
      edgeCases: false,
      securityTests: false,
      outputFormat: 'markdown',
      testFramework: 'generic'
    }
  },
  comprehensive: {
    id: 'comprehensive',
    name: 'Deep Analysis',
    description: 'Thorough analysis with all artifacts',
    icon: Search,
    color: 'primary',
    config: {
      userStories: true,
      testCases: true,
      acceptanceCriteria: true,
      edgeCases: true,
      securityTests: false,
      outputFormat: 'markdown',
      testFramework: 'generic'
    }
  },
  security: {
    id: 'security',
    name: 'Security Focus',
    description: 'Security-oriented testing',
    icon: Shield,
    color: 'red',
    config: {
      userStories: false,
      testCases: true,
      acceptanceCriteria: false,
      edgeCases: true,
      securityTests: true,
      outputFormat: 'markdown',
      testFramework: 'generic'
    }
  },
  documentation: {
    id: 'documentation',
    name: 'Documentation',
    description: 'User stories and acceptance criteria',
    icon: FileText,
    color: 'green',
    config: {
      userStories: true,
      testCases: false,
      acceptanceCriteria: true,
      edgeCases: false,
      securityTests: false,
      outputFormat: 'markdown',
      testFramework: 'generic'
    }
  }
};

const colorClasses = {
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    activeBg: 'bg-amber-500/20',
    activeBorder: 'border-amber-500',
  },
  primary: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    activeBg: 'bg-primary/20',
    activeBorder: 'border-primary',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    activeBg: 'bg-red-500/20',
    activeBorder: 'border-red-500',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    activeBg: 'bg-green-500/20',
    activeBorder: 'border-green-500',
  }
};

export default function ConfigPresets({ config, setConfig, activePreset, setActivePreset }) {
  const handlePresetSelect = (preset) => {
    setActivePreset(preset.id);
    setConfig({ ...config, ...preset.config });
  };

  // Check if current config matches a preset
  const matchesPreset = (preset) => {
    return Object.keys(preset.config).every(
      key => config[key] === preset.config[key]
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-text-secondary-dark">
          Quick Presets
        </h4>
        {activePreset && (
          <span className="text-xs text-primary">
            {PRESETS[activePreset]?.name} selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.values(PRESETS).map((preset) => {
          const Icon = preset.icon;
          const colors = colorClasses[preset.color];
          const isActive = activePreset === preset.id || (!activePreset && matchesPreset(preset));

          return (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group
                ${isActive
                  ? `${colors.activeBg} ${colors.activeBorder}`
                  : `bg-surface-dark border-white/10 hover:border-white/20 hover:bg-white/5`
                }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className={`absolute top-2 right-2 w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center`}>
                  <Check className={`w-3 h-3 ${colors.text}`} />
                </div>
              )}

              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${colors.text}`} />
              </div>

              {/* Content */}
              <p className={`text-sm font-medium mb-0.5 ${isActive ? 'text-white' : 'text-white group-hover:text-white'}`}>
                {preset.name}
              </p>
              <p className="text-xs text-text-secondary-dark line-clamp-1">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { PRESETS };
