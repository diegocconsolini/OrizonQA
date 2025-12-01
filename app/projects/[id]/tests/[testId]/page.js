'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, TestTube2, Calendar, FileText, Zap } from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';
import TestCaseForm from '../components/TestCaseForm';

export default function TestCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;
  const testId = params.testId;

  const [testCase, setTestCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (projectId && testId) {
      fetchTestCase();
    }
  }, [projectId, testId]);

  const fetchTestCase = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/tests/${testId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch test case');
      }

      setTestCase(data.testCase);
    } catch (err) {
      console.error('Error fetching test case:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this test case? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/tests/${testId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push(`/projects/${projectId}/tests`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete test case');
      }
    } catch (err) {
      console.error('Error deleting test case:', err);
      alert('Failed to delete test case');
    }
  };

  const handleUpdateSuccess = (data) => {
    setTestCase(data.testCase);
    setEditMode(false);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-400';
      case 'High': return 'text-orange-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ready': return 'bg-green-500/10 text-green-400';
      case 'Draft': return 'bg-yellow-500/10 text-yellow-400';
      case 'Deprecated': return 'bg-red-500/10 text-red-400';
      case 'Active': return 'bg-cyan-500/10 text-cyan-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'Functional': 'bg-blue-500/10 text-blue-400',
      'Integration': 'bg-purple-500/10 text-purple-400',
      'E2E': 'bg-indigo-500/10 text-indigo-400',
      'Performance': 'bg-orange-500/10 text-orange-400',
      'Security': 'bg-red-500/10 text-red-400',
      'API': 'bg-green-500/10 text-green-400',
      'UI': 'bg-pink-500/10 text-pink-400'
    };
    return colors[type] || 'bg-slate-500/10 text-slate-400';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading test case...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !testCase) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <TestTube2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Test case not found</h3>
            <p className="text-slate-400 mb-6">{error || 'The test case doesn\'t exist or you don\'t have access'}</p>
            <Link
              href={`/projects/${projectId}/tests`}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Test Cases
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (editMode) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <div className="px-6 py-6">
              <button
                onClick={() => setEditMode(false)}
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel Editing
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Edit Test Case</h1>
                  <p className="text-sm text-slate-400">Update test case details</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="max-w-4xl mx-auto bg-slate-800 border border-slate-700 rounded-lg p-6">
              <TestCaseForm
                projectId={projectId}
                testCase={testCase}
                onCancel={() => setEditMode(false)}
                onSuccess={handleUpdateSuccess}
              />
            </div>
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
              href={`/projects/${projectId}/tests`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Test Cases
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <TestTube2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400 bg-slate-700 px-2 py-1 rounded">
                      {testCase.key}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getTypeColor(testCase.type)}`}>
                      {testCase.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(testCase.status)}`}>
                      {testCase.status}
                    </span>
                    {testCase.automated && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Automated
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white">{testCase.title}</h1>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(true)}
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
          <div className="space-y-6">
            {/* Main Info */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Details</h2>

              {testCase.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Description</h3>
                  <p className="text-slate-400 whitespace-pre-wrap">{testCase.description}</p>
                </div>
              )}

              {testCase.preconditions && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Preconditions</h3>
                  <p className="text-slate-400 whitespace-pre-wrap">{testCase.preconditions}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Priority</p>
                  <p className={`font-medium ${getPriorityColor(testCase.priority)}`}>
                    {testCase.priority}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Type</p>
                  <p className="text-white font-medium">{testCase.type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Created</p>
                  <p className="text-white text-sm">{formatDate(testCase.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Updated</p>
                  <p className="text-white text-sm">{formatDate(testCase.updated_at)}</p>
                </div>
              </div>

              {testCase.tags && testCase.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {testCase.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Test Steps */}
            {testCase.steps && testCase.steps.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Test Steps</h2>
                <div className="space-y-4">
                  {testCase.steps.map((step, index) => (
                    <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          {step.step && (
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Action</p>
                              <p className="text-white">{step.step}</p>
                            </div>
                          )}
                          {step.expected && (
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Expected Result</p>
                              <p className="text-green-400">{step.expected}</p>
                            </div>
                          )}
                          {step.data && (
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Test Data</p>
                              <p className="text-slate-300 font-mono text-sm">{step.data}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Result */}
            {testCase.expected_result && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Expected Result</h2>
                <p className="text-slate-400 whitespace-pre-wrap">{testCase.expected_result}</p>
              </div>
            )}

            {/* Requirements Coverage */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-400" />
                  Requirements Coverage ({testCase.requirement_count || 0})
                </h2>
                <Link
                  href={`/projects/${projectId}/coverage?test=${testCase.id}`}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Manage Coverage →
                </Link>
              </div>
              {testCase.requirement_count > 0 ? (
                <p className="text-slate-400">
                  This test case covers {testCase.requirement_count} requirement(s)
                </p>
              ) : (
                <p className="text-slate-400 text-center py-4">
                  No requirements linked yet. Link requirements to track coverage.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
