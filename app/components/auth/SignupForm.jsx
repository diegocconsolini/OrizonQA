'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { User, Mail, Lock, Check, X } from 'lucide-react';

/**
 * SignupForm Component
 *
 * A comprehensive signup form with password strength validation,
 * client-side validation, and terms acceptance.
 *
 * Features:
 * - Password strength indicator with visual bar
 * - Password criteria checklist
 * - Show/hide password toggles
 * - Client-side validation
 * - Terms & Privacy acceptance
 * - API integration with /api/auth/signup
 */

export default function SignupForm() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

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

    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

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

    // Terms acceptance
    if (!termsAccepted) {
      errors.terms = 'You must accept the Terms and Privacy Policy';
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Redirect to email verification page with email parameter
      const emailParam = encodeURIComponent(formData.email.trim().toLowerCase());
      router.push(`/verify-email?email=${emailParam}`);
    } catch (err) {
      setError(err.message || 'An error occurred during signup. Please try again.');
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

      {/* Full Name */}
      <Input
        type="text"
        name="fullName"
        label="Full Name"
        placeholder="John Doe"
        value={formData.fullName}
        onChange={handleChange}
        error={fieldErrors.fullName}
        icon={<User className="w-5 h-5" />}
        iconPosition="left"
        disabled={loading}
      />

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
      />

      {/* Password */}
      <div>
        <Input
          type="password"
          name="password"
          label="Password"
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

      {/* Terms & Privacy Checkbox */}
      <div className="space-y-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              if (fieldErrors.terms) {
                setFieldErrors(prev => ({ ...prev, terms: '' }));
              }
            }}
            disabled={loading}
            className="mt-1 w-4 h-4 rounded border-0 bg-surface-dark text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 cursor-pointer disabled:opacity-50"
          />
          <span className="text-sm text-text-secondary-dark group-hover:text-text-primary-dark transition-colors">
            I agree to the{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover underline"
              onClick={(e) => e.stopPropagation()}
            >
              Terms of Service
            </a>
            {' '}and{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover underline"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </a>
          </span>
        </label>
        {fieldErrors.terms && (
          <p className="text-sm text-red-400 ml-7">{fieldErrors.terms}</p>
        )}
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
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
}
