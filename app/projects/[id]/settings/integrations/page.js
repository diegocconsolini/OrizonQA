'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, Link as LinkIcon, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';
import IntegrationConfigForm from './components/IntegrationConfigForm';

export default function IntegrationsPage() {
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const integrations = [
    {
      id: 'azure_devops',
      name: 'Azure DevOps',
      description: 'Sync work items, test plans, and CI/CD pipelines',
      icon: '🔷',
      color: 'blue',
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Import issues, link PRs, and trigger test runs',
      icon: '🐙',
      color: 'purple',
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      description: 'Sync issues, merge requests, and pipelines',
      icon: '🦊',
      color: 'orange',
    },
  ];

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
            <Settings className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Project not found</h3>
            <p className="text-slate-400 mb-6">{error || 'The project doesn\'t exist'}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isIntegrationActive = project.integration_type !== null;
  const activeIntegration = integrations.find(i => i.id === project.integration_type);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="px-6 py-6">
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Integrations</h1>
                <p className="text-sm text-slate-400">Connect {project.name} to external systems</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          {/* Current Integration Status */}
          {isIntegrationActive && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{activeIntegration?.icon}</div>
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      {activeIntegration?.name}
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </h2>
                    <p className="text-sm text-slate-400">Connected</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIntegration(project.integration_type)}
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Manage
                </button>
              </div>

              {/* Webhook URL */}
              {project.webhook_secret && (
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Webhook URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/api/integrations/${project.integration_type}/webhook?project=${projectId}`}
                      readOnly
                      className="flex-1 bg-slate-900 border border-slate-600 text-slate-300 px-3 py-2 rounded-lg font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/api/integrations/${project.integration_type}/webhook?project=${projectId}`)}
                      className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                      {copiedWebhook ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Configure this URL in your {activeIntegration?.name} project webhooks
                  </p>
                </div>
              )}

              {/* Sync Status */}
              <div className="border-t border-slate-700 pt-4 mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Sync Status</p>
                  <p className={`font-medium ${
                    project.sync_status === 'syncing' ? 'text-yellow-400' :
                    project.sync_status === 'error' ? 'text-red-400' :
                    'text-green-400'
                  }`}>
                    {project.sync_status || 'idle'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Last Synced</p>
                  <p className="text-white text-sm">
                    {project.last_sync_at
                      ? new Date(project.last_sync_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Available Integrations */}
          {!isIntegrationActive && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Available Integrations</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                  <button
                    key={integration.id}
                    onClick={() => setSelectedIntegration(integration.id)}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-cyan-500 transition-colors text-left"
                  >
                    <div className="text-4xl mb-4">{integration.icon}</div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-slate-400">{integration.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Integration Config Form */}
          {selectedIntegration && (
            <IntegrationConfigForm
              projectId={projectId}
              integrationType={selectedIntegration}
              currentConfig={isIntegrationActive && selectedIntegration === project.integration_type ? project : null}
              onClose={() => {
                setSelectedIntegration(null);
                fetchProject();
              }}
              onSuccess={() => {
                fetchProject();
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
