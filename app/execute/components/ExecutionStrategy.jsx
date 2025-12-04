'use client';

/**
 * ExecutionStrategy Component
 *
 * Choose execution method: WebContainer (browser) or Docker (future).
 */

import {
  Globe,
  Server,
  Zap,
  Clock,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const STRATEGIES = [
  {
    id: 'webcontainer',
    name: 'Browser (WebContainer)',
    description: 'Run tests directly in your browser using WebContainers',
    icon: Globe,
    available: true,
    features: [
      'Instant startup',
      'No server required',
      'Jest, Vitest, Mocha support',
      'Real-time output'
    ],
    limitations: [
      'JavaScript/Node.js only',
      'Browser memory limits',
      'No network access in tests'
    ],
    estimatedSpeed: 'fast',
    cost: 'Free'
  },
  {
    id: 'docker',
    name: 'Docker Container',
    description: 'Run tests in isolated Docker containers',
    icon: Server,
    available: false,
    comingSoon: true,
    features: [
      'All languages supported',
      'Full isolation',
      'Network access',
      'Custom dependencies'
    ],
    limitations: [
      'Requires Docker setup',
      'Slower startup',
      'Uses server resources'
    ],
    estimatedSpeed: 'medium',
    cost: 'Free (self-hosted)'
  }
];

const FRAMEWORKS = {
  jest: { name: 'Jest', color: 'text-red-400' },
  vitest: { name: 'Vitest', color: 'text-yellow-400' },
  mocha: { name: 'Mocha', color: 'text-amber-600' },
  auto: { name: 'Auto-detect', color: 'text-slate-400' }
};

export default function ExecutionStrategy({
  framework = 'auto',
  testCount = 0,
  strategy = 'webcontainer',
  onStrategyChange
}) {
  const estimateTime = (strat) => {
    if (testCount === 0) return 'N/A';

    const baseTime = strat === 'webcontainer' ? 0.5 : 2;
    const setupTime = strat === 'webcontainer' ? 3 : 10;
    const totalSeconds = setupTime + (testCount * baseTime);

    if (totalSeconds < 60) {
      return `~${Math.round(totalSeconds)}s`;
    }
    return `~${Math.round(totalSeconds / 60)}m`;
  };

  const frameworkInfo = FRAMEWORKS[framework] || FRAMEWORKS.auto;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-white font-medium">Execution Strategy</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${frameworkInfo.color}`}>
              {frameworkInfo.name}
            </span>
            {testCount > 0 && (
              <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                {testCount} tests
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Strategy Options */}
      <div className="p-4 space-y-3">
        {STRATEGIES.map(strat => {
          const Icon = strat.icon;
          const isSelected = strategy === strat.id;
          const isDisabled = !strat.available;

          return (
            <div
              key={strat.id}
              onClick={() => !isDisabled && onStrategyChange(strat.id)}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-700 hover:border-slate-600'
                }
              `}
            >
              {/* Coming Soon Badge */}
              {strat.comingSoon && (
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full">
                  Coming Soon
                </span>
              )}

              {/* Strategy Header */}
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${isSelected ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-400'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-medium">{strat.name}</h4>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{strat.description}</p>
                </div>
              </div>

              {/* Features & Limitations */}
              {isSelected && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* Features */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Features</p>
                    <ul className="space-y-1">
                      {strat.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Limitations</p>
                    <ul className="space-y-1">
                      {strat.limitations.map((limitation, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Stats */}
              {isSelected && (
                <div className="mt-4 flex gap-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">
                      Est. Time: {estimateTime(strat.id)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">
                      Cost: {strat.cost}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-2 p-3 bg-slate-900/50 rounded-lg">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            WebContainers run a full Node.js environment directly in your browser.
            Your test code never leaves your machine.
          </p>
        </div>
      </div>
    </div>
  );
}
