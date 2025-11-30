'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { Lock, Check, X } from 'lucide-react';

/**
 * ResetPasswordForm Component
 *
 * Allows users to set a new password using a reset token.
 *
 * Features:
 * - Password strength indicator
 * - Password criteria checklist
 * - Show/hide password toggles
 * - Token validation
 * - API integration with /api/auth/reset-password
 *
 * @param {string} token - Password reset token from URL
 */

export default function ResetPasswordForm({ token }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, label: '', color: '' };

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Determine strength level
    if (score <= 2) return { score: 25, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 50, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 5) return { score: 75, label: 'Good', color: 'bg-yellow-500' };
    return { score: 100, label: 'Strong', color: 'bg-green-400' };
  };

  // Password criteria checks
  const getPasswordCriteria = (password) => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[^a-zA-Z0-9]/.test(password) }
  ];

  const passwordStrength = calculatePasswordStrength(formData.password);
  const passwordCriteria = getPasswordCriteria(formData.password);

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

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else {
      const unmetCriteria = passwordCriteria.filter(c => !c.met);
      if (unmetCriteria.length > 0) {
        errors.password = 'Password does not meet all requirements';
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      // Show success state
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 3000);

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
          <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-green-400 font-medium mb-2 font-primary">
            Password Reset Successful!
          </p>
          <p className="text-sm text-text-secondary-dark font-secondary">
            Your password has been updated. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-text-secondary-dark font-secondary">
          Enter your new password below
        </p>
      </div>

      {/* Password */}
      <div>
        <Input
          type="password"
          name="password"
          label="New Password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
          icon={<Lock className="w-5 h-5" />}
          iconPosition="left"
          disabled={loading}
        />

        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary-dark">Password Strength</span>
              <span className={`font-medium ${
                passwordStrength.label === 'Weak' ? 'text-red-400' :
                passwordStrength.label === 'Fair' ? 'text-orange-500' :
                passwordStrength.label === 'Good' ? 'text-yellow-500' :
                'text-green-400'
              }`}>
                {passwordStrength.label}
              </span>
            </div>

            {/* Strength Bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                style={{ width: `${passwordStrength.score}%` }}
              />
            </div>
          </div>
        )}

        {/* Password Criteria Checklist */}
        {formData.password && (
          <div className="mt-4 space-y-2">
            {passwordCriteria.map((criterion, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {criterion.met ? (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span className={criterion.met ? 'text-green-400' : 'text-text-secondary-dark'}>
                  {criterion.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <Input
        type="password"
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Re-enter your password"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={fieldErrors.confirmPassword}
        icon={<Lock className="w-5 h-5" />}
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
        {loading ? 'Resetting Password...' : 'Reset Password'}
      </Button>
    </form>
  );
}
