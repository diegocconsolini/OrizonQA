'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { User, Mail, Lock, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';

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

  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

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

  // Step definitions
  const steps = [
    { number: 1, title: 'Account', description: 'Email and password' },
    { number: 2, title: 'Profile', description: 'Your information' },
    { number: 3, title: 'Review', description: 'Confirm details' }
  ];

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

  // Validate current step
  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
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
    } else if (step === 2) {
      // Full name validation
      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (formData.fullName.trim().length < 2) {
        errors.fullName = 'Full name must be at least 2 characters';
      }
    } else if (step === 3) {
      // Terms acceptance
      if (!termsAccepted) {
        errors.terms = 'You must accept the Terms and Privacy Policy';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    setError('');
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setError('');
    setFieldErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle form submission (on final step)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate final step
    if (!validateStep(3)) {
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
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex-1">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.number
                      ? 'border-primary bg-primary text-black'
                      : 'border-white/20 bg-white/5 text-text-secondary-dark'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                      currentStep > step.number ? 'bg-primary' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white font-primary">
              {steps[currentStep - 1].title}
            </h3>
            <p className="text-sm text-text-secondary-dark font-secondary">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>
      </div>

      {/* Global Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Step 1: Account (Email & Password) */}
      {currentStep === 1 && (
        <div className="space-y-6 fade-in">
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
            autoFocus
          />

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
        </div>
      )}

      {/* Step 2: Profile (Name) */}
      {currentStep === 2 && (
        <div className="space-y-6 fade-in">
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
            autoFocus
          />

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-text-secondary-dark">
              This will be displayed on your profile and used for communication.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Review & Terms */}
      {currentStep === 3 && (
        <div className="space-y-6 fade-in">
          {/* Review Information */}
          <div className="space-y-4 p-6 bg-surface-hover-dark rounded-lg border border-white/10">
            <div>
              <p className="text-sm text-text-secondary-dark mb-1">Email</p>
              <p className="text-white font-medium font-secondary">{formData.email}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary-dark mb-1">Full Name</p>
              <p className="text-white font-medium font-secondary">{formData.fullName}</p>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-text-secondary-dark">
                <Check className="w-4 h-4 text-green-400 inline mr-1" />
                Password strength: <span className="text-primary font-semibold">{passwordStrength.label}</span>
              </p>
            </div>
          </div>

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
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handlePrevious}
            disabled={loading}
            className="flex-1"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        )}

        {currentStep < totalSteps ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={loading}
            className="flex-1"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        )}
      </div>
    </div>
  );
}
