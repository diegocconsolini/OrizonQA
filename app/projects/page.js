'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, FolderKanban } from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';
import ProjectCard from './components/ProjectCard';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Filter projects based on search term
    if (searchTerm.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(term) ||
        project.key.toLowerCase().includes(term) ||
        (project.description && project.description.toLowerCase().includes(term))
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      setProjects(data.projects);
      setFilteredProjects(data.projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Projects</h1>
                  <p className="text-sm text-slate-400">
                    Manage your QA test projects
                  </p>
                </div>
              </div>
              <Link
                href="/projects/new"
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects by name, key, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Loading projects...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchProjects}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredProjects.length === 0 && searchTerm === '' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
              <p className="text-slate-400 mb-6">
                Create your first project to start organizing your test cases
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Your First Project
              </Link>
            </div>
          )}

          {/* No Search Results */}
          {!loading && !error && filteredProjects.length === 0 && searchTerm !== '' && (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-2">
                No projects found matching "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-cyan-400 hover:text-cyan-300 underline"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Projects Grid */}
          {!loading && !error && filteredProjects.length > 0 && (
            <>
              <div className="mb-4 text-sm text-slate-400">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
