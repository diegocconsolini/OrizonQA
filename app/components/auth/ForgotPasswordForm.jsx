'use client';

import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { Mail, ArrowLeft } from 'lucide-react';

/**
 * ForgotPasswordForm Component
 *
 * Allows users to request a password reset link via email.
 *
 * Features:
 * - Email validation
 * - Success state with instructions
 * - Back to login link
 * - Rate limiting feedback
 * - API integration with /api/auth/forgot-password
 */

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      // Show success state
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-green-400/10 border border-green-400/20 rounded-lg text-center">
          <p className="text-green-400 font-medium mb-2 font-primary">
            Check your email!
          </p>
          <p className="text-sm text-text-secondary-dark font-secondary">
            If an account exists with <span className="text-white font-semibold">{email}</span>,
            you'll receive password reset instructions shortly.
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-text-secondary-dark mb-4 font-secondary">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>
          <Button
            onClick={() => setSuccess(false)}
            variant="ghost"
            size="sm"
            className="mx-auto"
          >
            Send another email
          </Button>
        </div>

        <div className="pt-4 border-t border-white/10">
          <a
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors font-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </a>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-text-secondary-dark font-secondary">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      {/* Email Input */}
      <Input
        type="email"
        name="email"
        label="Email Address"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError('');
        }}
        error={error && error.includes('email') ? error : ''}
        icon={<Mail className="w-5 h-5" />}
        iconPosition="left"
        disabled={loading}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </Button>

      {/* Back to Login */}
      <div className="text-center pt-4 border-t border-white/10">
        <a
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors font-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </a>
      </div>
    </form>
  );
}
