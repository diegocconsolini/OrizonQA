'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, TestTube2, ArrowLeft, Filter } from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';
import TestCaseCard from './components/TestCaseCard';

export default function TestsPage() {
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: '',
    automated: ''
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchTests();
    }
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, tests]);

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

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/tests`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch test cases');
      }

      setTests(data.tests);
      setFilteredTests(data.tests);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = tests;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(test =>
        test.title.toLowerCase().includes(term) ||
        test.key.toLowerCase().includes(term) ||
        (test.description && test.description.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(test => test.status === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(test => test.priority === filters.priority);
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(test => test.type === filters.type);
    }

    // Automated filter
    if (filters.automated) {
      const isAutomated = filters.automated === 'true';
      filtered = filtered.filter(test => test.is_automated === isAutomated);
    }

    setFilteredTests(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: '',
      priority: '',
      type: '',
      automated: ''
    });
  };

  const hasActiveFilters = searchTerm || filters.status || filters.priority || filters.type || filters.automated;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="px-6 py-6">
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <TestTube2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Test Cases</h1>
                  <p className="text-sm text-slate-400">
                    {project?.name || 'Project'} - Manage test cases and scenarios
                  </p>
                </div>
              </div>
              <Link
                href={`/projects/${projectId}/tests/new`}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Test Case
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search test cases by title, key, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Ready">Ready</option>
                <option value="Active">Active</option>
                <option value="Deprecated">Deprecated</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Types</option>
                <option value="Functional">Functional</option>
                <option value="Integration">Integration</option>
                <option value="E2E">E2E</option>
                <option value="Performance">Performance</option>
                <option value="Security">Security</option>
                <option value="API">API</option>
                <option value="UI">UI</option>
              </select>

              <select
                value={filters.automated}
                onChange={(e) => setFilters(prev => ({ ...prev, automated: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">All (Manual & Automated)</option>
                <option value="true">Automated Only</option>
                <option value="false">Manual Only</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Loading test cases...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchTests}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredTests.length === 0 && !hasActiveFilters && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TestTube2 className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No test cases yet</h3>
              <p className="text-slate-400 mb-6">
                Create your first test case to start building your test suite
              </p>
              <Link
                href={`/projects/${projectId}/tests/new`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Your First Test Case
              </Link>
            </div>
          )}

          {/* No Search Results */}
          {!loading && !error && filteredTests.length === 0 && hasActiveFilters && (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No test cases match your filters
              </h3>
              <p className="text-slate-400 mb-6">
                Try adjusting your search criteria or filters
              </p>
              <button
                onClick={clearFilters}
                className="text-sm text-cyan-400 hover:text-cyan-300 underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Test Cases Grid */}
          {!loading && !error && filteredTests.length > 0 && (
            <>
              <div className="mb-4 text-sm text-slate-400">
                {filteredTests.length} {filteredTests.length === 1 ? 'test case' : 'test cases'}
                {hasActiveFilters && ' matching your filters'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.map(test => (
                  <TestCaseCard
                    key={test.id}
                    test={test}
                    projectId={projectId}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
