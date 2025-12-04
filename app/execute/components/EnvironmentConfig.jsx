'use client';

/**
 * EnvironmentConfig Component
 *
 * Configure execution environment: env vars, timeout, node version, etc.
 */

import { useState } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Clock,
  Server,
  AlertTriangle
} from 'lucide-react';

const NODE_VERSIONS = [
  { value: '18', label: 'Node.js 18 LTS' },
  { value: '20', label: 'Node.js 20 LTS' },
  { value: '21', label: 'Node.js 21' }
];

const TIMEOUT_OPTIONS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' }
];

const DEFAULT_CONFIG = {
  nodeVersion: '20',
  timeout: 60,
  envVars: [],
  mockApiUrl: ''
};

export default function EnvironmentConfig({
  config = DEFAULT_CONFIG,
  onConfigChange
}) {
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  const updateConfig = (key, value) => {
    onConfigChange({
      ...config,
      [key]: value
    });
  };

  const addEnvVar = () => {
    if (!newEnvKey.trim()) return;

    const newVar = {
      id: Date.now(),
      key: newEnvKey.trim(),
      value: newEnvValue
    };

    updateConfig('envVars', [...(config.envVars || []), newVar]);
    setNewEnvKey('');
    setNewEnvValue('');
  };

  const removeEnvVar = (id) => {
    updateConfig('envVars', config.envVars.filter(v => v.id !== id));
  };

  const updateEnvVar = (id, field, value) => {
    updateConfig('envVars', config.envVars.map(v =>
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  // Check for potentially dangerous env vars
  const getDangerousVars = () => {
    const dangerous = ['PATH', 'HOME', 'USER', 'SHELL', 'PWD', 'NODE_PATH'];
    return (config.envVars || []).filter(v =>
      dangerous.includes(v.key.toUpperCase())
    );
  };

  const dangerousVars = getDangerousVars();

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-white font-medium">Environment Configuration</h3>
      </div>

      <div className="p-4 space-y-5">
        {/* Node Version */}
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <Server className="w-4 h-4" />
            Node.js Version
          </label>
          <select
            value={config.nodeVersion || '20'}
            onChange={(e) => updateConfig('nodeVersion', e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
          >
            {NODE_VERSIONS.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Timeout */}
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <Clock className="w-4 h-4" />
            Execution Timeout
          </label>
          <select
            value={config.timeout || 60}
            onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
          >
            {TIMEOUT_OPTIONS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Mock API URL */}
        <div>
          <label className="text-sm text-slate-300 mb-2 block">
            Mock API Base URL (optional)
          </label>
          <input
            type="text"
            placeholder="http://localhost:3001"
            value={config.mockApiUrl || ''}
            onChange={(e) => updateConfig('mockApiUrl', e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-slate-500 mt-1">
            Tests can use process.env.API_URL to access this
          </p>
        </div>

        {/* Environment Variables */}
        <div>
          <label className="text-sm text-slate-300 mb-2 block">
            Environment Variables
          </label>

          {/* Warning for dangerous vars */}
          {dangerousVars.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-yellow-400 font-medium">Warning</p>
                <p className="text-yellow-400/80">
                  Variables like {dangerousVars.map(v => v.key).join(', ')} may be blocked for security.
                </p>
              </div>
            </div>
          )}

          {/* Existing env vars */}
          <div className="space-y-2 mb-3">
            {(config.envVars || []).map(envVar => (
              <div key={envVar.id} className="flex gap-2">
                <input
                  type="text"
                  placeholder="KEY"
                  value={envVar.key}
                  onChange={(e) => updateEnvVar(envVar.id, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="value"
                  value={envVar.value}
                  onChange={(e) => updateEnvVar(envVar.id, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => removeEnvVar(envVar.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new env var */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="KEY"
              value={newEnvKey}
              onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addEnvVar()}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="value"
              value={newEnvValue}
              onChange={(e) => setNewEnvValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addEnvVar()}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary"
            />
            <button
              onClick={addEnvVar}
              disabled={!newEnvKey.trim()}
              className="p-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Default environment info */}
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <p className="text-xs text-slate-500 mb-2">Default environment variables:</p>
          <div className="font-mono text-xs space-y-1">
            <p className="text-slate-400">
              <span className="text-primary">NODE_ENV</span>=test
            </p>
            <p className="text-slate-400">
              <span className="text-primary">CI</span>=true
            </p>
            {config.mockApiUrl && (
              <p className="text-slate-400">
                <span className="text-primary">API_URL</span>={config.mockApiUrl}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
