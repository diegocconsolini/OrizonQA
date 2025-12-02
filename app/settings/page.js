/**
 * Settings Page
 *
 * Allows authenticated users to manage their account settings:
 * - Save Claude API key (encrypted)
 * - Save LM Studio URL
 * - Manage preferences
 */

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SettingsPageClient from './SettingsPageClient';

function SettingsLoading() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-text-secondary-dark font-secondary">Loading settings...</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPageClient />
    </Suspense>
  );
}
