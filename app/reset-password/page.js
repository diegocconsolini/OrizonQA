/**
 * Reset Password Page
 *
 * Allows users to set a new password using a reset token.
 *
 * Features:
 * - Token validation from URL query parameter
 * - ResetPasswordForm component
 * - Password strength indicator
 * - Success/error states
 * - Auto-redirect to login on success
 *
 * Design: Dark cosmic theme matching other auth pages
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ResetPasswordForm from '@/app/components/auth/ResetPasswordForm.jsx';
import Logo from '@/app/components/ui/Logo.jsx';
import { KeyRound, AlertCircle, Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if token exists
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  // Invalid token state
  if (error || !token) {
    return (
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Logo variant="full" color="blue" size="md" background="dark" className="mx-auto mb-6" />

          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 font-primary">
            Invalid Reset Link
          </h1>
          <p className="text-text-secondary-dark font-secondary">
            This password reset link is invalid or has expired
          </p>
        </div>

        {/* Error Card */}
        <div className="bg-surface-dark rounded-2xl shadow-xl border border-red-500/20 p-8">
          <div className="text-center space-y-4">
            <p className="text-text-secondary-dark font-secondary">
              Reset links expire after 1 hour for security reasons.
            </p>

            <a
              href="/forgot-password"
              className="inline-block px-6 py-3 bg-primary text-bg-dark font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              Request New Reset Link
            </a>

            <div className="pt-4">
              <a
                href="/login"
                className="text-sm text-primary hover:text-primary-hover transition-colors font-secondary"
              >
                Back to login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Valid token state
  return (
    <div className="w-full max-w-md">
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <Logo variant="full" color="blue" size="md" background="dark" className="mx-auto mb-6" />

        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 font-primary">
          Reset Your Password
        </h1>
        <p className="text-text-secondary-dark font-secondary">
          Enter your new password below
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-surface-dark rounded-2xl shadow-xl border border-white/10 p-8">
        <ResetPasswordForm token={token} />
      </div>

      {/* Back to Login */}
      <div className="mt-6 text-center">
        <a
          href="/login"
          className="text-sm text-primary hover:text-primary-hover transition-colors font-secondary"
        >
          Back to login
        </a>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="w-full max-w-md text-center">
      <Logo variant="full" color="blue" size="md" background="dark" className="mx-auto mb-6" />
      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
      <p className="text-text-secondary-dark mt-4 font-secondary">Loading...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-6 py-12">
      <Suspense fallback={<LoadingState />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
