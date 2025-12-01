'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, FileText, TestTube2, Calendar, ExternalLink } from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';

export default function RequirementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;
  const reqId = params.reqId;

  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId && reqId) {
      fetchRequirement();
    }
  }, [projectId, reqId]);

  const fetchRequirement = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/requirements/${reqId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requirement');
      }

      setRequirement(data.requirement);
    } catch (err) {
      console.error('Error fetching requirement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this requirement? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${reqId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push(`/projects/${projectId}/requirements`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete requirement');
      }
    } catch (err) {
      console.error('Error deleting requirement:', err);
      alert('Failed to delete requirement');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading requirement...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !requirement) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Requirement not found</h3>
            <p className="text-slate-400 mb-6">{error || 'The requirement doesn\'t exist or you don\'t have access'}</p>
            <Link
              href={`/projects/${projectId}/requirements`}
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Requirements
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="px-6 py-6">
            <Link
              href={`/projects/${projectId}/requirements`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Requirements
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400 bg-slate-700 px-2 py-1 rounded">
                      {requirement.key}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-violet-500/10 text-violet-400">
                      {requirement.type}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-400">
                      {requirement.status}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">{requirement.title}</h1>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/projects/${projectId}/requirements/${reqId}/edit`)}
                  className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
          {/* Main Info */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Details</h2>

            {requirement.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Description</h3>
                <p className="text-slate-400 whitespace-pre-wrap">{requirement.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Priority</p>
                <p className="text-white font-medium">{requirement.priority}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Version</p>
                <p className="text-white font-medium">{requirement.version || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Created</p>
                <p className="text-white text-sm">{formatDate(requirement.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Updated</p>
                <p className="text-white text-sm">{formatDate(requirement.updated_at)}</p>
              </div>
            </div>

            {(requirement.external_id || requirement.external_url) && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-sm font-medium text-slate-300 mb-3">External Links</h3>
                <div className="flex items-center gap-4">
                  {requirement.external_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="w-4 h-4 text-violet-400" />
                      <span className="text-slate-400">External ID:</span>
                      <span className="text-white font-mono">{requirement.external_id}</span>
                    </div>
                  )}
                  {requirement.external_url && (
                    <a
                      href={requirement.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1"
                    >
                      View in external system
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Linked Test Cases */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <TestTube2 className="w-5 h-5 text-cyan-400" />
                Linked Test Cases ({requirement.test_cases?.length || 0})
              </h2>
              <Link
                href={`/projects/${projectId}/coverage?req=${requirement.id}`}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                Manage Coverage →
              </Link>
            </div>

            {requirement.test_cases && requirement.test_cases.length > 0 ? (
              <div className="space-y-2">
                {requirement.test_cases.map(tc => (
                  <Link
                    key={tc.id}
                    href={`/projects/${projectId}/tests/${tc.id}`}
                    className="block p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                          {tc.key}
                        </span>
                        <span className="text-white">{tc.title}</span>
                      </div>
                      <span className="text-xs text-slate-400">{tc.coverage_type}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                No test cases linked yet. Link tests to track coverage.
              </p>
            )}
          </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
