import { Sparkles } from 'lucide-react';

export default function ConfigSection({ config, setConfig }) {
  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5 md:p-6 mb-6">
      <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
        <Sparkles size={18} className="text-indigo-400" />
        Analysis Options
      </h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { key: 'userStories', label: 'Generate User Stories', default: true },
            { key: 'testCases', label: 'Generate Test Cases', default: true },
            { key: 'acceptanceCriteria', label: 'Generate Acceptance Criteria', default: true },
            { key: 'edgeCases', label: 'Include Edge Cases', default: false },
            { key: 'securityTests', label: 'Include Security Test Scenarios', default: false },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={config[item.key]}
                onChange={(e) => setConfig({...config, [item.key]: e.target.checked})}
                className="w-5 h-5 rounded-md bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
            </label>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2 font-medium">Output Format</label>
            <select
              value={config.outputFormat}
              onChange={(e) => setConfig({...config, outputFormat: e.target.value})}
              className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
            >
              <option value="markdown">Markdown</option>
              <option value="json">JSON</option>
              <option value="jira">Jira Format</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2 font-medium">Test Framework Style</label>
            <select
              value={config.testFramework}
              onChange={(e) => setConfig({...config, testFramework: e.target.value})}
              className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
            >
              <option value="generic">Generic</option>
              <option value="jest">Jest</option>
              <option value="pytest">Pytest</option>
              <option value="junit">JUnit</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-sm text-slate-400 mb-2 font-medium">Additional Context (optional)</label>
        <input
          type="text"
          value={config.additionalContext}
          onChange={(e) => setConfig({...config, additionalContext: e.target.value})}
          placeholder="Describe the project purpose, tech stack, or specific focus areas..."
          className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>
    </div>
  );
}
