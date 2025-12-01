/**
 * Signup Page
 *
 * Split-screen layout for user registration:
 * - Left: Brand content with ORIZON logo and feature highlights
 * - Right: SignupForm component
 *
 * Design: Dark cosmic theme with purple/blue gradients
 * Responsive: Stacks on mobile devices
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SignupForm from '@/app/components/auth/SignupForm.jsx';
import Logo from '@/app/components/ui/Logo.jsx';
import { Check, Sparkles, Zap, Shield } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-primary text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-dark flex">
      {/* Left Side - Brand Content */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        {/* Background Gradient with Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-quantum via-bg-dark to-primary/20 animate-gradient" />

        {/* Animated Cosmic Elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-quantum/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-accent/5 rounded-full blur-2xl animate-pulse-slow" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          {/* Logo */}
          <div className="mb-12">
            <Logo variant="full" color="blue" size="lg" background="dark" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-white mb-6 font-primary">
            Join thousands of developers
          </h1>

          <p className="text-xl text-text-secondary-dark mb-12 font-secondary">
            Transform your codebase analysis with AI-powered QA automation
          </p>

          {/* Feature Highlights */}
          <div className="space-y-5">
            <FeatureItem
              icon={<Zap className="w-6 h-6" />}
              text="Free to start"
              description="No credit card required, start analyzing immediately"
            />
            <FeatureItem
              icon={<Shield className="w-6 h-6" />}
              text="No credit card required"
              description="Try all features without any financial commitment"
            />
            <FeatureItem
              icon={<Sparkles className="w-6 h-6" />}
              text="Instant setup"
              description="Get started in minutes, not hours"
            />
          </div>

          {/* Decorative Quote */}
          <div className="mt-16 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-primary/20">
            <p className="text-text-secondary-dark italic font-secondary">
              "ORIZON transformed how we approach QA. What used to take days now takes minutes."
            </p>
            <p className="text-primary text-sm mt-3 font-semibold">
              - Development Team Lead
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center px-6 sm:px-12 lg:px-16 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Logo variant="full" color="blue" size="xl" background="dark" className="mx-auto" />
          </div>

          {/* Form Card */}
          <div className="bg-surface-dark rounded-2xl shadow-xl border border-white/10 p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 font-primary">
                Create your account
              </h2>
              <p className="text-text-secondary-dark font-secondary">
                Start analyzing your codebase with AI
              </p>
            </div>

            <SignupForm />

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-text-secondary-dark text-sm font-secondary">
                Already have an account?{' '}
                <a
                  href="/login"
                  className="text-primary hover:text-primary-hover font-semibold transition-colors"
                >
                  Log in
                </a>
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <p className="text-xs text-text-secondary-dark font-secondary">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Item Component
 * Used in the brand content section
 */
function FeatureItem({ icon, text, description }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <div className="text-primary">
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-white font-semibold font-primary">{text}</span>
        </div>
        <p className="text-text-secondary-dark text-sm mt-1 font-secondary">
          {description}
        </p>
      </div>
    </div>
  );
}
