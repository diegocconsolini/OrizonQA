'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, FileText, ArrowLeft, Filter } from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';
import RequirementCard from './components/RequirementCard';

export default function RequirementsPage() {
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [filteredRequirements, setFilteredRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: ''
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchRequirements();
    }
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, requirements]);

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

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/requirements`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requirements');
      }

      setRequirements(data.requirements);
      setFilteredRequirements(data.requirements);
    } catch (err) {
      console.error('Error fetching requirements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = requirements;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(term) ||
        req.key.toLowerCase().includes(term) ||
        (req.description && req.description.toLowerCase().includes(term))
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(req => req.type === filters.type);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(req => req.status === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(req => req.priority === filters.priority);
    }

    setFilteredRequirements(filtered);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Requirements</h1>
                  <p className="text-sm text-slate-400">
                    {project?.name || 'Project'} - Manage requirements and user stories
                  </p>
                </div>
              </div>
              <Link
                href={`/projects/${projectId}/requirements/new`}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                New Requirement
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search requirements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="flex gap-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">All Types</option>
                <option value="Story">Story</option>
                <option value="Epic">Epic</option>
                <option value="Bug">Bug</option>
                <option value="Feature">Feature</option>
                <option value="Task">Task</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Loading requirements...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredRequirements.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm || filters.type || filters.status || filters.priority
                  ? 'No requirements match your filters'
                  : 'No requirements yet'}
              </h3>
              <p className="text-slate-400 mb-6">
                {searchTerm || filters.type || filters.status || filters.priority
                  ? 'Try adjusting your filters'
                  : 'Create your first requirement to get started'}
              </p>
            </div>
          )}

          {/* Requirements Grid */}
          {!loading && !error && filteredRequirements.length > 0 && (
            <>
              <div className="mb-4 text-sm text-slate-400">
                {filteredRequirements.length} {filteredRequirements.length === 1 ? 'requirement' : 'requirements'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequirements.map(requirement => (
                  <RequirementCard
                    key={requirement.id}
                    requirement={requirement}
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
