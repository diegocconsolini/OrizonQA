'use client';

import { Zap, DollarSign } from 'lucide-react';

/**
 * TokenUsageBar
 *
 * Real-time token usage tracking with visual bars:
 * - Input tokens with progress bar
 * - Output tokens with progress bar
 * - Actual cost calculation
 * - Comparison to estimates
 */
export default function TokenUsageBar({
  tokenUsage = { input: 0, output: 0 },
  actualCost,
  estimatedCost,
  estimatedTokens
}) {
  // Calculate percentages against estimates
  const inputPercentage = estimatedTokens
    ? Math.min((tokenUsage.input / estimatedTokens) * 100, 100)
    : 0;

  // Estimate output tokens as 20% of input
  const estimatedOutputTokens = estimatedTokens ? Math.ceil(estimatedTokens * 0.2) : 10000;
  const outputPercentage = Math.min((tokenUsage.output / estimatedOutputTokens) * 100, 100);

  // Parse estimated cost for comparison
  const estimatedCostNum = estimatedCost ? parseFloat(estimatedCost.replace('$', '')) : 1;
  const actualCostNum = actualCost ? parseFloat(actualCost.replace('$', '')) : 0;
  const costPercentage = Math.min((actualCostNum / estimatedCostNum) * 100, 100);

  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-white font-medium">Token Usage</span>
      </div>

      <div className="space-y-4">
        {/* Input tokens */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Input Tokens</span>
            <span className="text-slate-300 font-mono">
              {tokenUsage.input?.toLocaleString() || 0}
              {estimatedTokens && (
                <span className="text-slate-500"> / ~{estimatedTokens.toLocaleString()}</span>
              )}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${inputPercentage}%` }}
            />
          </div>
        </div>

        {/* Output tokens */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Output Tokens</span>
            <span className="text-slate-300 font-mono">
              {tokenUsage.output?.toLocaleString() || 0}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${outputPercentage}%` }}
            />
          </div>
        </div>

        {/* Cost */}
        <div className="pt-2 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-slate-400 text-sm">Cost</span>
            </div>
            <div className="text-right">
              <span className="text-green-400 font-mono text-lg">{actualCost || '$0.00'}</span>
              {estimatedCost && (
                <span className="text-slate-500 text-sm ml-2">
                  / est. {estimatedCost}
                </span>
              )}
            </div>
          </div>

          {/* Cost progress bar */}
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-300 ${
                costPercentage > 100 ? 'bg-red-500' :
                costPercentage > 80 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(costPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Token breakdown tooltip */}
        <div className="text-xs text-slate-500 flex justify-between">
          <span>Input: $3/1M tokens</span>
          <span>Output: $15/1M tokens</span>
        </div>
      </div>
    </div>
  );
}
