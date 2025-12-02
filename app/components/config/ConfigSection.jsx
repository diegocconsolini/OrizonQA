'use client';

/**
 * Config Section Component
 *
 * Analysis options configuration for code analysis.
 * Uses ORIZON design system colors and styling.
 */

import { Sparkles, Settings2 } from 'lucide-react';

export default function ConfigSection({ config, setConfig, showHeader = true }) {
  const analysisOptions = [
    { key: 'userStories', label: 'Generate User Stories', description: 'Create user stories from code functionality' },
    { key: 'testCases', label: 'Generate Test Cases', description: 'Generate comprehensive test cases' },
    { key: 'acceptanceCriteria', label: 'Generate Acceptance Criteria', description: 'Define acceptance criteria for features' },
    { key: 'edgeCases', label: 'Include Edge Cases', description: 'Add edge case scenarios to tests' },
    { key: 'securityTests', label: 'Include Security Tests', description: 'Add security-focused test scenarios' },
  ];

  return (
    <div className="bg-surface-dark rounded-2xl border border-white/10 p-5 md:p-6">
      {showHeader && (
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Analysis Options</h3>
            <p className="text-xs text-text-secondary-dark">
              Select what QA artifacts to generate
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Checkboxes */}
        <div className="space-y-3">
          {analysisOptions.map(item => (
            <label
              key={item.key}
              className="flex items-start gap-3 cursor-pointer group p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={config[item.key]}
                  onChange={(e) => setConfig({ ...config, [item.key]: e.target.checked })}
                  className="w-5 h-5 rounded-md bg-bg-dark border-white/20 text-primary
                           focus:ring-primary focus:ring-offset-0 focus:ring-offset-bg-dark
                           cursor-pointer checked:bg-primary checked:border-primary"
                />
              </div>
              <div>
                <span className="text-sm text-white group-hover:text-white transition-colors block">
                  {item.label}
                </span>
                <span className="text-xs text-text-secondary-dark">
                  {item.description}
                </span>
              </div>
            </label>
          ))}
        </div>

        {/* Dropdowns */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary-dark mb-2 font-medium">
              Output Format
            </label>
            <select
              value={config.outputFormat}
              onChange={(e) => setConfig({ ...config, outputFormat: e.target.value })}
              className="w-full bg-bg-dark border border-white/10 rounded-xl p-3 text-sm text-white
                       focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                       transition-all cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="markdown">Markdown</option>
              <option value="json">JSON</option>
              <option value="jira">Jira Format</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-secondary-dark mb-2 font-medium">
              Test Framework Style
            </label>
            <select
              value={config.testFramework}
              onChange={(e) => setConfig({ ...config, testFramework: e.target.value })}
              className="w-full bg-bg-dark border border-white/10 rounded-xl p-3 text-sm text-white
                       focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                       transition-all cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="generic">Generic</option>
              <option value="jest">Jest (JavaScript)</option>
              <option value="pytest">Pytest (Python)</option>
              <option value="junit">JUnit (Java)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Additional Context */}
      <div className="mt-5">
        <label className="block text-sm text-text-secondary-dark mb-2 font-medium">
          Additional Context <span className="text-text-muted-dark">(optional)</span>
        </label>
        <input
          type="text"
          value={config.additionalContext}
          onChange={(e) => setConfig({ ...config, additionalContext: e.target.value })}
          placeholder="Describe the project purpose, tech stack, or specific focus areas..."
          className="w-full bg-bg-dark border border-white/10 rounded-xl p-3 text-sm text-white
                   placeholder-text-muted-dark focus:outline-none focus:border-primary/50
                   focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>
    </div>
  );
}
