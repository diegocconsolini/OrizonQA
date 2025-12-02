'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TestTube2 } from 'lucide-react';
import AppLayout from '@/app/components/layout/AppLayout';
import TestCaseForm from '../components/TestCaseForm';

export default function NewTestCasePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  const handleSuccess = (data) => {
    // Redirect to the newly created test case
    router.push(`/projects/${projectId}/tests/${data.testCase.id}`);
  };

  const handleCancel = () => {
    router.push(`/projects/${projectId}/tests`);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-bg-dark">
        <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
          <div className="px-6 py-6">
            <Link
              href={`/projects/${projectId}/tests`}
              className="inline-flex items-center gap-2 text-text-secondary-dark hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Test Cases
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <TestTube2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create Test Case</h1>
                <p className="text-sm text-text-secondary-dark">Add a new test case to your project</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          <div className="bg-surface-dark border border-white/10 rounded-lg p-6">
            <TestCaseForm
              projectId={projectId}
              onCancel={handleCancel}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
