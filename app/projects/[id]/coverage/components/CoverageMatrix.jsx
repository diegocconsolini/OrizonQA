'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Link as LinkIcon } from 'lucide-react';

/**
 * Coverage Matrix Component
 *
 * Displays a traceability matrix showing requirements and their linked test cases
 * with execution status and pass rates
 */
export default function CoverageMatrix({ matrix, onRequirementClick, onTestClick }) {
  const [expandedReqs, setExpandedReqs] = useState(new Set());

  const toggleRequirement = (reqId) => {
    const newExpanded = new Set(expandedReqs);
    if (newExpanded.has(reqId)) {
      newExpanded.delete(reqId);
    } else {
      newExpanded.add(reqId);
    }
    setExpandedReqs(newExpanded);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Passed': 'text-success',
      'Failed': 'text-error',
      'Blocked': 'text-warning',
      'Untested': 'text-text-muted-dark',
      'Open': 'text-primary',
      'Closed': 'text-text-muted-dark'
    };
    return colors[status] || 'text-text-secondary-dark';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Passed': <CheckCircle2 className="w-4 h-4" />,
      'Failed': <XCircle className="w-4 h-4" />,
      'Blocked': <AlertCircle className="w-4 h-4" />,
      'Untested': <Clock className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      'Critical': 'bg-error/10 text-error border border-error/20',
      'High': 'bg-warning/10 text-warning border border-warning/20',
      'Medium': 'bg-primary/10 text-primary border border-primary/20',
      'Low': 'bg-surface-darker text-text-muted-dark border border-white/10'
    };
    return styles[priority] || styles['Medium'];
  };

  const getTypeBadge = (type) => {
    const styles = {
      'Story': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      'Bug': 'bg-red-500/10 text-red-400 border border-red-500/20',
      'Task': 'bg-green-500/10 text-green-400 border border-green-500/20',
      'Epic': 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
    };
    return styles[type] || styles['Story'];
  };

  if (!matrix || matrix.length === 0) {
    return (
      <div className="bg-surface-dark border border-white/10 rounded-lg p-8 text-center">
        <p className="text-text-muted-dark">No requirements found. Create requirements to see coverage data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matrix.map((req) => {
        const isExpanded = expandedReqs.has(req.requirement_id);
        const hasTests = req.test_count > 0;
        const passRate = req.pass_rate || 0;

        return (
          <div
            key={req.requirement_id}
            className="bg-surface-dark border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors"
          >
            {/* Requirement Header */}
            <div
              className="px-4 py-3 cursor-pointer flex items-center gap-4"
              onClick={() => toggleRequirement(req.requirement_id)}
            >
              {/* Expand Icon */}
              <div className="flex-shrink-0">
                <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                  <svg className="w-5 h-5 text-text-secondary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Requirement Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className="font-mono text-sm font-semibold text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequirementClick?.(req.requirement_id);
                    }}
                  >
                    {req.requirement_key}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(req.requirement_type)}`}>
                    {req.requirement_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(req.requirement_priority)}`}>
                    {req.requirement_priority}
                  </span>
                  <span className={`text-xs ${getStatusColor(req.requirement_status)}`}>
                    {req.requirement_status}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-white truncate">{req.requirement_title}</h3>
              </div>

              {/* Test Coverage Stats */}
              <div className="flex items-center gap-6 flex-shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-text-muted-dark" />
                    <span className="text-sm font-medium text-white">{req.test_count}</span>
                    <span className="text-xs text-text-muted-dark">tests</span>
                  </div>
                </div>

                {hasTests && (
                  <div className="text-right min-w-[80px]">
                    <div className="text-sm font-semibold text-white">{passRate}%</div>
                    <div className="text-xs text-text-muted-dark">pass rate</div>
                  </div>
                )}

                {hasTests && (
                  <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span className="text-text-secondary-dark">{req.passed_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-error" />
                      <span className="text-text-secondary-dark">{req.failed_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-warning" />
                      <span className="text-text-secondary-dark">{req.blocked_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-text-muted-dark" />
                      <span className="text-text-secondary-dark">{req.untested_count}</span>
                    </div>
                  </div>
                )}

                {!hasTests && (
                  <div className="px-3 py-1 bg-warning/10 text-warning text-xs rounded-full border border-warning/20">
                    No tests linked
                  </div>
                )}
              </div>
            </div>

            {/* Linked Tests (Expanded) */}
            {isExpanded && hasTests && req.linked_tests && (
              <div className="border-t border-white/10 bg-surface-darker">
                <div className="px-4 py-3">
                  <p className="text-xs text-text-muted-dark uppercase tracking-wider mb-3">Linked Test Cases</p>
                  <div className="space-y-2">
                    {req.linked_tests.map((test) => (
                      <div
                        key={test.test_id}
                        className="flex items-center gap-3 px-3 py-2 bg-surface-dark rounded-lg hover:bg-surface-dark/50 transition-colors cursor-pointer"
                        onClick={() => onTestClick?.(test.test_id)}
                      >
                        <div className={getStatusColor(test.last_result)}>
                          {getStatusIcon(test.last_result)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-primary">{test.test_key}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {test.coverage_type}
                            </span>
                            {test.last_result && (
                              <span className={`text-xs ${getStatusColor(test.last_result)}`}>
                                {test.last_result}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary-dark truncate mt-0.5">{test.test_title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
