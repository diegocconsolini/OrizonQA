'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FolderPlus } from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';
import ProjectForm from '../components/ProjectForm';

export default function NewProjectPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="min-h-screen bg-bg-dark">
        {/* Header */}
        <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
          <div className="px-6 py-6">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-text-secondary-dark hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center">
                <FolderPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New Project</h1>
                <p className="text-sm text-text-secondary-dark">
                  Set up a new test project to organize your QA work
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="bg-surface-dark border border-white/10 rounded-lg p-6">
            <ProjectForm onCancel={() => router.push('/projects')} />
          </div>

          {/* Help Text */}
          <div className="mt-6 bg-surface-dark/50 border border-white/10/50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-white mb-3">What's a project?</h3>
            <ul className="space-y-2 text-sm text-text-secondary-dark">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>
                  A project is a container for organizing test cases, requirements, and test runs
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>
                  Each project has a unique key (like "PROJ" or "AUTH") used to identify test cases
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>
                  You can invite team members to collaborate on your projects
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>
                  Projects can be linked to external systems like Jira for seamless workflow integration
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
