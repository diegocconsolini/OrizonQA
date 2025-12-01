'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Settings, TestTube2, FileText, TrendingUp,
  Bug, Calendar, FolderKanban, Plus
} from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch project');
      }

      setProject(data.project);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading project...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Project not found</h3>
            <p className="text-slate-400 mb-6">{error || 'The project you\'re looking for doesn\'t exist or you don\'t have access.'}</p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const stats = project.stats || {};

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="px-6 py-6">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                    <span className="text-xs font-mono text-slate-400 bg-slate-700 px-2 py-1 rounded">
                      {project.key}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-slate-400">{project.description}</p>
                  )}
                </div>
              </div>
              <button className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Test Cases */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <TestTube2 className="w-5 h-5 text-cyan-400" />
                </div>
                <Link
                  href={`/projects/${project.id}/tests`}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  View all →
                </Link>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.total_tests || 0}</p>
              <p className="text-sm text-slate-400">Test Cases</p>
              <p className="text-xs text-green-400 mt-2">
                {stats.ready_tests || 0} ready
              </p>
            </div>

            {/* Requirements */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-400" />
                </div>
                <Link
                  href={`/projects/${project.id}/requirements`}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  View all →
                </Link>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.total_requirements || 0}</p>
              <p className="text-sm text-slate-400">Requirements</p>
            </div>

            {/* Test Runs */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <Link
                  href={`/projects/${project.id}/runs`}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  View all →
                </Link>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.total_runs || 0}</p>
              <p className="text-sm text-slate-400">Test Runs</p>
              <p className="text-xs text-green-400 mt-2">
                {stats.active_runs || 0} active
              </p>
            </div>

            {/* Defects */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Bug className="w-5 h-5 text-red-400" />
                </div>
                <Link
                  href={`/projects/${project.id}/defects`}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  View all →
                </Link>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.total_defects || 0}</p>
              <p className="text-sm text-slate-400">Defects</p>
              <p className="text-xs text-red-400 mt-2">
                {stats.open_defects || 0} open
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href={`/projects/${project.id}/tests/new`}
                className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Plus className="w-5 h-5 text-cyan-400" />
                <span className="text-white">Create Test Case</span>
              </Link>
              <Link
                href={`/projects/${project.id}/requirements/new`}
                className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Plus className="w-5 h-5 text-violet-400" />
                <span className="text-white">Add Requirement</span>
              </Link>
              <Link
                href={`/projects/${project.id}/runs/new`}
                className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Plus className="w-5 h-5 text-green-400" />
                <span className="text-white">Start Test Run</span>
              </Link>
              <Link
                href={`/projects/${project.id}/coverage`}
                className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <span className="text-white">View Coverage</span>
              </Link>
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Project Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Owner:</span>
                <span className="text-white">{project.owner_name || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="text-white">{formatDate(project.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Updated:</span>
                <span className="text-white">{formatDate(project.updated_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  project.is_active
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {project.is_active ? 'Active' : 'Archived'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
