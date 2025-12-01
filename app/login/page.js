/**
 * Login Page
 *
 * Split-screen layout for user authentication:
 * - Left: Brand content with ORIZON logo and feature highlights
 * - Right: LoginForm component
 *
 * Design: Dark cosmic theme with purple/blue gradients
 * Responsive: Stacks on mobile devices
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoginForm from '@/app/components/auth/LoginForm.jsx';
import Logo from '@/app/components/ui/Logo.jsx';
import { Check, Sparkles, GitBranch, FileCode, Zap, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentFeature, setCurrentFeature] = useState(0);

  // Rotating features for brand panel
  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      text: "AI-powered QA analysis",
      description: "Generate comprehensive test cases and user stories"
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      text: "GitHub integration",
      description: "Analyze repositories directly from GitHub"
    },
    {
      icon: <FileCode className="w-6 h-6" />,
      text: "Multiple output formats",
      description: "Export to Markdown, JSON, or Jira-ready format"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      text: "Lightning-fast analysis",
      description: "Get results in seconds, not hours"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      text: "Secure & private",
      description: "Your code is never stored, only processed"
    }
  ];

  // Rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

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
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-quantum via-bg-dark to-primary/20" />

        {/* Cosmic Elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-quantum/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          {/* Logo */}
          <div className="mb-12">
            <Logo variant="full" color="blue" size="xl" background="dark" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-white mb-6 font-primary">
            Welcome back
          </h1>

          <p className="text-xl text-text-secondary-dark mb-12 font-secondary">
            Continue your AI-powered QA journey
          </p>

          {/* Feature Highlights */}
          <div className="space-y-5">
            <FeatureItem
              icon={<Sparkles className="w-6 h-6" />}
              text="AI-powered QA analysis"
              description="Generate comprehensive test cases and user stories"
            />
            <FeatureItem
              icon={<GitBranch className="w-6 h-6" />}
              text="GitHub integration"
              description="Analyze repositories directly from GitHub"
            />
            <FeatureItem
              icon={<FileCode className="w-6 h-6" />}
              text="Multiple output formats"
              description="Export to Markdown, JSON, or Jira-ready format"
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center px-6 sm:px-12 lg:px-16 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Logo variant="full" color="blue" size="lg" background="dark" className="mx-auto" />
          </div>

          {/* Form Card */}
          <div className="bg-surface-dark rounded-2xl shadow-xl border border-white/10 p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 font-primary">
                Log in to your account
              </h2>
              <p className="text-text-secondary-dark font-secondary">
                Welcome back! Please enter your credentials
              </p>
            </div>

            <LoginForm />

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-text-secondary-dark text-sm font-secondary">
                Don't have an account?{' '}
                <a
                  href="/signup"
                  className="text-primary hover:text-primary-hover font-semibold transition-colors"
                >
                  Sign up
                </a>
              </p>
            </div>

            {/* OAuth Placeholder (for future implementation) */}
            {/* <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-surface-dark text-text-secondary-dark">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="ghost" size="md" className="w-full">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    GitHub icon SVG
                  </svg>
                  GitHub
                </Button>
                <Button variant="ghost" size="md" className="w-full">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    Google icon SVG
                  </svg>
                  Google
                </Button>
              </div>
            </div> */}
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <p className="text-xs text-text-secondary-dark font-secondary">
              Protected by industry-standard encryption.{' '}
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
