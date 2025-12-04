'use client';

import { useState } from 'react';
import { Play, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useTestExecution, ExecutionStatus, getStatusMessage } from '@/app/hooks/useTestExecution';
import ExecutionModal from './ExecutionModal';

/**
 * Execute Tests Button
 *
 * Triggers test execution and shows progress modal.
 *
 * @param {string} testCode - The test code to execute
 * @param {string} framework - Test framework (jest, vitest, mocha)
 * @param {number} analysisId - Optional analysis ID to link execution
 * @param {boolean} disabled - Disable the button
 * @param {string} size - Button size (sm, md, lg)
 * @param {string} variant - Button variant (primary, secondary, outline)
 * @param {function} onComplete - Callback when execution completes
 */
export default function ExecuteButton({
  testCode,
  framework = 'auto',
  analysisId = null,
  disabled = false,
  size = 'md',
  variant = 'primary',
  onComplete,
  onError,
  className = ''
}) {
  const [showModal, setShowModal] = useState(false);
  const execution = useTestExecution();

  const handleExecute = async () => {
    if (!testCode || testCode.trim().length === 0) {
      onError?.('No test code to execute');
      return;
    }

    setShowModal(true);

    try {
      await execution.execute(testCode, {
        framework,
        analysisId
      });
    } catch (err) {
      onError?.(err.message);
    }
  };

  // Handle execution completion
  const handleClose = () => {
    if (execution.isComplete) {
      onComplete?.(execution.results);
    }
    setShowModal(false);
    execution.reset();
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 gap-2',
    lg: 'px-6 py-3 text-lg gap-2'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-green-500 to-emerald-500
      hover:from-green-600 hover:to-emerald-600
      text-white shadow-lg shadow-green-500/20
    `,
    secondary: `
      bg-slate-700 hover:bg-slate-600
      text-white
    `,
    outline: `
      border border-green-500/50 hover:border-green-500
      text-green-400 hover:bg-green-500/10
    `
  };

  const isDisabled = disabled || execution.isRunning || !testCode;

  return (
    <>
      <button
        onClick={handleExecute}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          disabled:opacity-50 disabled:cursor-not-allowed
          rounded-xl font-medium transition-all
          ${className}
        `}
        title={!testCode ? 'No test code available' : 'Execute tests in browser'}
      >
        {execution.isRunning ? (
          <>
            <Loader2 className={`${iconSizes[size]} animate-spin`} />
            <span>{getStatusLabel(execution.status)}</span>
          </>
        ) : execution.isComplete ? (
          <>
            <CheckCircle2 className={iconSizes[size]} />
            <span>View Results</span>
          </>
        ) : execution.isFailed ? (
          <>
            <XCircle className={iconSizes[size]} />
            <span>Retry</span>
          </>
        ) : (
          <>
            <Play className={iconSizes[size]} />
            <span>Execute Tests</span>
          </>
        )}
      </button>

      {showModal && (
        <ExecutionModal
          execution={execution}
          onClose={handleClose}
        />
      )}
    </>
  );
}

function getStatusLabel(status) {
  switch (status) {
    case ExecutionStatus.STARTING: return 'Starting...';
    case ExecutionStatus.BOOTING: return 'Booting...';
    case ExecutionStatus.MOUNTING: return 'Setting up...';
    case ExecutionStatus.INSTALLING: return 'Installing...';
    case ExecutionStatus.RUNNING: return 'Running...';
    default: return 'Executing...';
  }
}

/**
 * Compact version for inline use
 */
export function ExecuteButtonCompact({ testCode, framework, analysisId, disabled }) {
  return (
    <ExecuteButton
      testCode={testCode}
      framework={framework}
      analysisId={analysisId}
      disabled={disabled}
      size="sm"
      variant="outline"
    />
  );
}
