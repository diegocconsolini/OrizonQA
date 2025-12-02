'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  Link as LinkIcon,
  BarChart3
} from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';
import CoverageMatrix from './components/CoverageMatrix';

export default function CoveragePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [uncovered, setUncovered] = useState([]);
  const [unlinked, setUnlinked] = useState([]);
  const [byType, setByType] = useState([]);
  const [byPriority, setByPriority] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('matrix'); // matrix, gaps, breakdown

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchCoverageData();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      if (response.ok) {
        setProject(data.project);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    }
  };

  const fetchCoverageData = async () => {
    try {
      setLoading(true);

      // Fetch all coverage data
      const response = await fetch(`/api/projects/${projectId}/coverage?view=all`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch coverage data');
      }

      setStats(data.stats);
      setMatrix(data.matrix);
      setUncovered(data.uncovered_requirements);
      setUnlinked(data.unlinked_test_cases);
      setByType(data.by_type);
      setByPriority(data.by_priority);
    } catch (err) {
      console.error('Error fetching coverage data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementClick = (reqId) => {
    router.push(`/projects/${projectId}/requirements/${reqId}`);
  };

  const handleTestClick = (testId) => {
    router.push(`/projects/${projectId}/tests/${testId}`);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-bg-dark">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 text-text-secondary-dark hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Project</span>
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Test Coverage</h1>
                {project && (
                  <p className="text-text-secondary-dark">
                    {project.name} - Requirements to Test Traceability
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Coverage Dashboard */}
          {!loading && !error && stats && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Overall Coverage */}
                <div className="bg-surface-dark border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <p className="text-xs text-text-muted-dark uppercase tracking-wider">Coverage</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.coverage_percentage}%</p>
                  <p className="text-xs text-text-secondary-dark mt-1">
                    {stats.covered_requirements} of {stats.total_requirements} requirements
                  </p>
                </div>

                {/* Total Requirements */}
                <div className="bg-surface-dark border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-text-muted-dark uppercase tracking-wider">Requirements</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.total_requirements}</p>
                  <p className="text-xs text-text-secondary-dark mt-1">
                    {stats.total_requirements - stats.covered_requirements} uncovered
                  </p>
                </div>

                {/* Total Tests */}
                <div className="bg-surface-dark border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <p className="text-xs text-text-muted-dark uppercase tracking-wider">Test Cases</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.total_tests}</p>
                  <p className="text-xs text-text-secondary-dark mt-1">
                    {stats.linked_tests} linked
                  </p>
                </div>

                {/* Total Links */}
                <div className="bg-surface-dark border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-purple-400" />
                    <p className="text-xs text-text-muted-dark uppercase tracking-wider">Coverage Links</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.total_links}</p>
                  <p className="text-xs text-text-secondary-dark mt-1">
                    Total traceability links
                  </p>
                </div>

                {/* Unlinked Tests */}
                <div className="bg-surface-dark border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <p className="text-xs text-text-muted-dark uppercase tracking-wider">Unlinked Tests</p>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {stats.total_tests - stats.linked_tests}
                  </p>
                  <p className="text-xs text-text-secondary-dark mt-1">
                    Tests without requirements
                  </p>
                </div>
              </div>

              {/* View Tabs */}
              <div className="flex gap-2 border-b border-white/10">
                <button
                  onClick={() => setActiveView('matrix')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeView === 'matrix'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary-dark hover:text-white'
                  }`}
                >
                  Traceability Matrix
                </button>
                <button
                  onClick={() => setActiveView('gaps')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeView === 'gaps'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary-dark hover:text-white'
                  }`}
                >
                  Coverage Gaps
                </button>
                <button
                  onClick={() => setActiveView('breakdown')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeView === 'breakdown'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary-dark hover:text-white'
                  }`}
                >
                  Coverage Breakdown
                </button>
              </div>

              {/* Matrix View */}
              {activeView === 'matrix' && (
                <div>
                  <CoverageMatrix
                    matrix={matrix}
                    onRequirementClick={handleRequirementClick}
                    onTestClick={handleTestClick}
                  />
                </div>
              )}

              {/* Gaps View */}
              {activeView === 'gaps' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Uncovered Requirements */}
                  <div className="bg-surface-dark border border-white/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      Uncovered Requirements ({uncovered.length})
                    </h3>
                    {uncovered.length === 0 ? (
                      <p className="text-text-muted-dark text-sm">All requirements have test coverage!</p>
                    ) : (
                      <div className="space-y-2">
                        {uncovered.map((req) => (
                          <div
                            key={req.id}
                            className="px-3 py-2 bg-surface-darker rounded-lg hover:bg-surface-darker/50 transition-colors cursor-pointer"
                            onClick={() => handleRequirementClick(req.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-primary">{req.key}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                req.priority === 'Critical' || req.priority === 'High'
                                  ? 'bg-error/10 text-error border border-error/20'
                                  : 'bg-surface-darker text-text-muted-dark border border-white/10'
                              }`}>
                                {req.priority}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary-dark mt-1 truncate">{req.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Unlinked Tests */}
                  <div className="bg-surface-dark border border-white/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      Unlinked Test Cases ({unlinked.length})
                    </h3>
                    {unlinked.length === 0 ? (
                      <p className="text-text-muted-dark text-sm">All tests are linked to requirements!</p>
                    ) : (
                      <div className="space-y-2">
                        {unlinked.map((test) => (
                          <div
                            key={test.id}
                            className="px-3 py-2 bg-surface-darker rounded-lg hover:bg-surface-darker/50 transition-colors cursor-pointer"
                            onClick={() => handleTestClick(test.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-primary">{test.key}</span>
                              {test.suite_name && (
                                <span className="text-xs text-text-muted-dark">/ {test.suite_name}</span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary-dark mt-1 truncate">{test.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Breakdown View */}
              {activeView === 'breakdown' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* By Type */}
                  <div className="bg-surface-dark border border-white/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Coverage by Type
                    </h3>
                    <div className="space-y-3">
                      {byType.map((item) => (
                        <div key={item.type}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-text-secondary-dark">{item.type}</span>
                            <span className="text-sm font-semibold text-white">
                              {item.coverage_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-surface-darker rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${item.coverage_percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-text-muted-dark mt-1">
                            {item.covered_requirements} of {item.total_requirements} requirements
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* By Priority */}
                  <div className="bg-surface-dark border border-white/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Coverage by Priority
                    </h3>
                    <div className="space-y-3">
                      {byPriority.map((item) => (
                        <div key={item.priority}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-text-secondary-dark">{item.priority}</span>
                            <span className="text-sm font-semibold text-white">
                              {item.coverage_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-surface-darker rounded-full h-2">
                            <div
                              className={`rounded-full h-2 transition-all ${
                                item.priority === 'Critical' || item.priority === 'High'
                                  ? 'bg-error'
                                  : item.priority === 'Medium'
                                  ? 'bg-warning'
                                  : 'bg-success'
                              }`}
                              style={{ width: `${item.coverage_percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-text-muted-dark mt-1">
                            {item.covered_requirements} of {item.total_requirements} requirements
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && stats && stats.total_requirements === 0 && (
            <div className="bg-surface-dark border border-white/10 rounded-lg p-12 text-center">
              <BarChart3 className="w-16 h-16 text-text-muted-dark mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Requirements Yet</h3>
              <p className="text-text-secondary-dark mb-6">
                Create requirements and link them to test cases to track coverage.
              </p>
              <Link
                href={`/projects/${projectId}/requirements/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Create First Requirement
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
