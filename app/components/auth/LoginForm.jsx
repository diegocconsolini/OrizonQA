'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { Mail, Lock } from 'lucide-react';

/**
 * LoginForm Component
 *
 * A login form with email/password authentication using Next-Auth.
 *
 * Features:
 * - Email and password input fields
 * - Show/hide password toggle (built into Input component)
 * - "Remember me" checkbox
 * - "Forgot password?" link
 * - Client-side validation
 * - Loading states
 * - Error message display
 * - Next-Auth signIn integration
 *
 * Error Handling:
 * - Invalid credentials
 * - Unverified email
 * - Rate limiting
 * - Inactive accounts
 */

export default function LoginForm() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  // Client-side validation
  const validateForm = () => {
    const errors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call Next-Auth signIn
      const result = await signIn('credentials', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        redirect: false, // Handle redirect manually
      });

      if (result?.error) {
        // Handle specific error messages from Next-Auth
        if (result.error === 'Please verify your email first') {
          setError('Please verify your email before logging in. Check your inbox for the verification link.');
        } else if (result.error === 'Account is inactive. Contact support.') {
          setError('Your account has been deactivated. Please contact support for assistance.');
        } else if (result.error.includes('Too many failed login attempts')) {
          setError('Too many failed login attempts. Please try again in 15 minutes.');
        } else {
          setError('Invalid email or password. Please try again.');
        }
      } else if (result?.ok) {
        // Successful login - redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Email */}
      <Input
        type="email"
        name="email"
        label="Email Address"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
        error={fieldErrors.email}
        icon={<Mail className="w-5 h-5" />}
        iconPosition="left"
        disabled={loading}
        autoComplete="email"
      />

      {/* Password */}
      <Input
        type="password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        value={formData.password}
        onChange={handleChange}
        error={fieldErrors.password}
        icon={<Lock className="w-5 h-5" />}
        iconPosition="left"
        disabled={loading}
        autoComplete="current-password"
      />

      {/* Remember Me & Forgot Password Row */}
      <div className="flex items-center justify-between">
        {/* Remember Me Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 rounded border-0 bg-surface-dark text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 cursor-pointer disabled:opacity-50"
          />
          <span className="text-sm text-text-secondary-dark group-hover:text-text-primary-dark transition-colors">
            Remember me
          </span>
        </label>

        {/* Forgot Password Link */}
        <a
          href="/forgot-password"
          className="text-sm text-primary hover:text-primary-hover transition-colors font-medium"
        >
          Forgot password?
        </a>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
