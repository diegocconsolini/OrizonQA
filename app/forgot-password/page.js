/**
 * Forgot Password Page
 *
 * Allows users to request a password reset link.
 *
 * Features:
 * - ForgotPasswordForm component
 * - Success state with instructions
 * - Back to login link
 *
 * Design: Dark cosmic theme matching other auth pages
 */

'use client';

import ForgotPasswordForm from '@/app/components/auth/ForgotPasswordForm.jsx';
import Logo from '@/app/components/ui/Logo.jsx';
import { KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Logo variant="full" color="blue" size="md" background="dark" className="mx-auto mb-6" />

          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 font-primary">
            Forgot Password?
          </h1>
          <p className="text-text-secondary-dark font-secondary">
            No worries, we'll send you reset instructions
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-dark rounded-2xl shadow-xl border border-white/10 p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
