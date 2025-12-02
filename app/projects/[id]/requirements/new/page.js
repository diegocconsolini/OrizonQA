'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FilePlus } from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';
import RequirementForm from '../components/RequirementForm';

export default function NewRequirementPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  return (
    <AppLayout>
      <div className="min-h-screen bg-bg-dark">
        <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
          <div className="px-6 py-6">
            <Link
              href={`/projects/${projectId}/requirements`}
              className="inline-flex items-center gap-2 text-text-secondary-dark hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Requirements
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                <FilePlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create Requirement</h1>
                <p className="text-sm text-text-secondary-dark">Add a new requirement or user story</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          <div className="bg-surface-dark border border-white/10 rounded-lg p-6">
            <RequirementForm
              projectId={projectId}
              onCancel={() => router.push(`/projects/${projectId}/requirements`)}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
