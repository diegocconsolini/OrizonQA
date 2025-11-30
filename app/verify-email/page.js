/**
 * Email Verification Page
 *
 * Allows users to verify their email address using a 6-digit code.
 *
 * Features:
 * - VerificationCodeInput with auto-focus
 * - Automatic submission when 6 digits entered
 * - Resend code functionality with rate limiting
 * - Countdown timer for code expiration
 * - Success/error feedback
 * - Redirect to login on successful verification
 *
 * Design: Dark cosmic theme matching signup/login pages
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VerificationCodeInput from '@/app/components/auth/VerificationCodeInput.jsx';
import Button from '@/app/components/ui/Button.jsx';
import Logo from '@/app/components/ui/Logo.jsx';
import { Mail, Check, RefreshCw, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email');

  const [email, setEmail] = useState(emailFromUrl || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for code expiration
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle code change
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setError('');
  };

  // Handle code completion (auto-submit)
  const handleCodeComplete = async (fullCode) => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          code: fullCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Success!
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    if (resendCooldown > 0) {
      return;
    }

    setResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      // Reset timer and set cooldown
      setTimeLeft(600); // 10 minutes
      setResendCooldown(60); // 1 minute cooldown

      // Show success message briefly
      const successMsg = error;
      setError('');
      setTimeout(() => {
        setError('');
      }, 3000);

    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If no email provided, show email input
  if (!email) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="full" color="blue" size="lg" background="dark" className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2 font-primary">
            Verify Your Email
          </h1>
          <p className="text-text-secondary-dark font-secondary">
            Please enter your email address to continue
          </p>
        </div>

        <div className="bg-surface-dark rounded-2xl shadow-xl border border-white/10 p-8">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) {
              // Update URL with email
              router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
            }
          }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              className="w-full px-4 py-3 bg-bg-dark border-2 border-white/10 rounded-lg text-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              disabled={!email.trim()}
            >
              Continue
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <Logo variant="full" color="blue" size="lg" background="dark" className="mx-auto mb-6" />

        {success ? (
          <>
            <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-primary">
              Email Verified!
            </h1>
            <p className="text-text-secondary-dark font-secondary">
              Redirecting you to login...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-primary">
              Check Your Email
            </h1>
            <p className="text-text-secondary-dark font-secondary">
              We sent a verification code to
            </p>
            <p className="text-primary font-semibold mt-1 font-secondary">
              {email}
            </p>
          </>
        )}
      </div>

      {/* Verification Form */}
      {!success && (
        <div className="bg-surface-dark rounded-2xl shadow-xl border border-white/10 p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary-dark mb-4 text-center font-secondary">
              Enter 6-digit code
            </label>

            <VerificationCodeInput
              onComplete={handleCodeComplete}
              onChange={handleCodeChange}
              disabled={loading || timeLeft === 0}
              error={error}
            />
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            {timeLeft > 0 ? (
              <p className="text-sm text-text-secondary-dark font-secondary">
                Code expires in{' '}
                <span className={`font-semibold ${timeLeft < 60 ? 'text-red-400' : 'text-primary'}`}>
                  {formatTime(timeLeft)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-400 font-secondary">
                Code expired. Please request a new one.
              </p>
            )}
          </div>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-sm text-text-secondary-dark mb-3 font-secondary">
              Didn't receive the code?
            </p>
            <Button
              onClick={handleResendCode}
              variant="ghost"
              size="sm"
              disabled={resending || resendCooldown > 0}
              className="mx-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : resending
                  ? 'Sending...'
                  : 'Resend Code'
              }
            </Button>
          </div>

          {/* Change Email */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-text-secondary-dark font-secondary">
              Wrong email?{' '}
              <button
                onClick={() => router.push('/verify-email')}
                className="text-primary hover:text-primary-hover font-semibold transition-colors"
              >
                Change it
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Success State */}
      {success && (
        <div className="bg-surface-dark rounded-2xl shadow-xl border border-green-400/20 p-8 text-center">
          <p className="text-green-400 font-secondary">
            Your email has been verified successfully!
          </p>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="w-full max-w-md text-center">
      <Logo variant="full" color="blue" size="lg" background="dark" className="mx-auto mb-6" />
      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
      <p className="text-text-secondary-dark mt-4 font-secondary">Loading...</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-6 py-12">
      <Suspense fallback={<LoadingState />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
