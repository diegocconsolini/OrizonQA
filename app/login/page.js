/**
 * Login Page with GSAP Smooth Transitions
 *
 * Features:
 * - Same video background as landing page for continuity
 * - GSAP enter animations that mirror landing page exit
 * - Smooth element reconstruction effect
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import gsap from 'gsap';
import LoginForm from '@/app/components/auth/LoginForm.jsx';
import Logo from '@/app/components/ui/Logo.jsx';
import { usePageTransition } from '../contexts/PageTransitionContext';
import { Check, Sparkles, GitBranch, FileCode, Zap, Shield, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { endTransition } = usePageTransition();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Refs for GSAP animations
  const containerRef = useRef(null);
  const leftPanelRef = useRef(null);
  const logoRef = useRef(null);
  const headlineRef = useRef(null);
  const subtitleRef = useRef(null);
  const featuresRef = useRef(null);
  const quoteRef = useRef(null);
  const rightPanelRef = useRef(null);
  const formCardRef = useRef(null);
  const trustRef = useRef(null);

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

  // Rotate features every 4 seconds (only after animation complete)
  useEffect(() => {
    if (!animationComplete) return;

    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length, animationComplete]);

  // GSAP entrance animation
  useEffect(() => {
    const fromLanding = sessionStorage.getItem('toLogin');

    if (fromLanding) {
      sessionStorage.removeItem('toLogin');
      // Animate in from landing page transition
      animateEnterFromLanding();
    } else {
      // Normal page load - quick fade in
      animateNormalEnter();
    }

    endTransition();
  }, [endTransition]);

  function animateEnterFromLanding() {
    // Filter out null refs (elements hidden on mobile)
    const leftPanelElements = [logoRef.current, headlineRef.current, subtitleRef.current, featuresRef.current, quoteRef.current].filter(Boolean);

    // Set initial states (elements start hidden/positioned)
    if (leftPanelElements.length > 0) {
      gsap.set(leftPanelElements, {
        opacity: 0,
        x: -50
      });
    }

    if (formCardRef.current) {
      gsap.set(formCardRef.current, {
        opacity: 0,
        x: 100,
        scale: 0.95
      });
    }

    if (trustRef.current) {
      gsap.set(trustRef.current, {
        opacity: 0,
        y: 20
      });
    }

    const tl = gsap.timeline({
      onComplete: () => setAnimationComplete(true)
    });

    // Stagger animate in login page elements
    // Form card slides in from the right (main focus)
    if (formCardRef.current) {
      tl.to(formCardRef.current, {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.6,
        ease: 'power3.out'
      });
    }

    // Left panel elements animate in with stagger (only if visible)
    if (logoRef.current) {
      tl.to(logoRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.4');
    }
    if (headlineRef.current) {
      tl.to(headlineRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.3');
    }
    if (subtitleRef.current) {
      tl.to(subtitleRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.35,
        ease: 'power2.out'
      }, '-=0.25');
    }
    if (featuresRef.current) {
      tl.to(featuresRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.2');
    }
    if (quoteRef.current) {
      tl.to(quoteRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.35,
        ease: 'power2.out'
      }, '-=0.2');
    }
    if (trustRef.current) {
      tl.to(trustRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      }, '-=0.2');
    }
  }

  function animateNormalEnter() {
    // Filter out null refs (elements hidden on mobile)
    const allElements = [formCardRef.current, logoRef.current, headlineRef.current, subtitleRef.current, featuresRef.current, quoteRef.current, trustRef.current].filter(Boolean);

    if (allElements.length === 0) {
      setAnimationComplete(true);
      return;
    }

    gsap.set(allElements, {
      opacity: 0
    });

    const tl = gsap.timeline({
      onComplete: () => setAnimationComplete(true)
    });

    tl.to(allElements, {
      opacity: 1,
      duration: 0.5,
      stagger: 0.05,
      ease: 'power2.out'
    });
  }

  function handleBackClick(e) {
    e.preventDefault();

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('fromLogin', 'true');
        router.push('/');
      }
    });

    // Reverse animation - elements slide out (with null checks)
    if (formCardRef.current) {
      tl.to(formCardRef.current, {
        opacity: 0,
        x: 100,
        scale: 0.95,
        duration: 0.4,
        ease: 'power2.in'
      });
    }

    const leftPanelElements = [quoteRef.current, featuresRef.current, subtitleRef.current, headlineRef.current, logoRef.current].filter(Boolean);
    if (leftPanelElements.length > 0) {
      tl.to(leftPanelElements, {
        opacity: 0,
        x: -50,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.in'
      }, '-=0.2');
    }

    if (trustRef.current) {
      tl.to(trustRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.2,
        ease: 'power2.in'
      }, '-=0.2');
    }
  }

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // Show loading state while checking auth with skeleton
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg-dark relative">
        {/* VIDEO BACKGROUND */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          >
            <source src="/videos/event-horizon.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-bg-dark/60" />
        </div>

        <div className="relative z-10 min-h-screen flex">
          {/* Left Side Skeleton */}
          <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tl from-quantum via-bg-dark to-primary/20" />
            <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-quantum/10 rounded-full blur-3xl animate-pulse" />

            <div className="relative z-10 flex flex-col justify-center px-16 w-full space-y-8 animate-pulse">
              <div className="h-12 w-48 bg-white/10 rounded" />
              <div className="h-10 w-64 bg-white/5 rounded" />
              <div className="h-6 w-80 bg-white/5 rounded" />
              <div className="space-y-4 mt-8">
                <div className="h-20 w-full bg-white/5 rounded" />
                <div className="h-20 w-full bg-white/5 rounded" />
                <div className="h-20 w-full bg-white/5 rounded" />
              </div>
            </div>
          </div>

          {/* Right Side Skeleton */}
          <div className="w-full lg:w-[55%] flex items-center justify-center px-6 sm:px-12 lg:px-16 py-12">
            <div className="w-full max-w-md">
              <div className="bg-surface-dark rounded-2xl shadow-xl border border-white/10 p-8 sm:p-10 space-y-6 animate-pulse">
                <div className="h-8 w-64 bg-white/10 rounded" />
                <div className="h-4 w-48 bg-white/5 rounded" />
                <div className="space-y-4 mt-8">
                  <div className="h-12 w-full bg-white/5 rounded" />
                  <div className="h-12 w-full bg-white/5 rounded" />
                  <div className="h-12 w-full bg-primary/20 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-bg-dark relative">
      {/* VIDEO BACKGROUND - Same as landing page for continuity */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src="/videos/event-horizon.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-bg-dark/60" />
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Brand Content */}
        <div ref={leftPanelRef} className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
          {/* Background Gradient with Animation */}
          <div className="absolute inset-0 bg-gradient-to-tl from-quantum via-bg-dark to-primary/20 animate-gradient" />

          {/* Animated Cosmic Elements */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-quantum/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-accent/5 rounded-full blur-2xl animate-pulse-slow" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-16 w-full">
            {/* Logo */}
            <div ref={logoRef} className="mb-12">
              <button onClick={handleBackClick} className="group flex items-center gap-3 mb-6 text-text-secondary-dark hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">Back to home</span>
              </button>
              <Logo variant="full" color="blue" size="xl" background="dark" />
            </div>

            {/* Headline */}
            <h1 ref={headlineRef} className="text-4xl font-bold text-white mb-6 font-primary">
              Welcome back
            </h1>

            <p ref={subtitleRef} className="text-xl text-text-secondary-dark mb-12 font-secondary">
              Continue your AI-powered QA journey
            </p>

            {/* Feature Highlights - Animated Rotation */}
            <div ref={featuresRef} className="space-y-5">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ${
                    index === currentFeature
                      ? 'opacity-100 translate-x-0 scale-100'
                      : index < currentFeature
                      ? 'opacity-0 -translate-x-4 scale-95 absolute'
                      : 'opacity-0 translate-x-4 scale-95 absolute'
                  }`}
                >
                  <FeatureItem
                    icon={feature.icon}
                    text={feature.text}
                    description={feature.description}
                    highlighted={index === currentFeature}
                  />
                </div>
              ))}
            </div>

            {/* Feature Progress Indicators */}
            <div className="mt-8 flex gap-2 justify-center">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentFeature
                      ? 'w-12 bg-primary'
                      : 'w-6 bg-white/20 hover:bg-white/30'
                  }`}
                  aria-label={`Show feature ${index + 1}`}
                />
              ))}
            </div>

            {/* Decorative Quote */}
            <div ref={quoteRef} className="mt-16 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-primary/20">
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
        <div ref={rightPanelRef} className="w-full lg:w-[55%] flex items-center justify-center px-6 sm:px-12 lg:px-16 py-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <Link href="/" className="inline-block">
                <Logo variant="full" color="blue" size="lg" background="dark" className="mx-auto" />
              </Link>
            </div>

            {/* Form Card */}
            <div ref={formCardRef} className="bg-surface-dark rounded-2xl shadow-xl border border-white/10 p-8 sm:p-10">
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
                  <Link
                    href="/signup"
                    className="text-primary hover:text-primary-hover font-semibold transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div ref={trustRef} className="mt-8 text-center">
              <p className="text-xs text-text-secondary-dark font-secondary">
                Protected by industry-standard encryption.{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Item Component
 * Used in the brand content section with animation support
 */
function FeatureItem({ icon, text, description, highlighted = false }) {
  return (
    <div className={`flex items-start gap-4 group transition-all duration-500 ${
      highlighted ? 'scale-105' : ''
    }`}>
      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 ${
        highlighted
          ? 'bg-primary/20 shadow-lg shadow-primary/20 animate-pulse-slow'
          : 'bg-primary/10 group-hover:bg-primary/20'
      }`}>
        <div className={`transition-all duration-500 ${
          highlighted ? 'text-primary scale-110' : 'text-primary'
        }`}>
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Check className={`w-5 h-5 text-green-400 flex-shrink-0 transition-all duration-500 ${
            highlighted ? 'scale-110' : ''
          }`} />
          <span className={`text-white font-semibold font-primary transition-all duration-500 ${
            highlighted ? 'text-primary' : ''
          }`}>{text}</span>
        </div>
        <p className="text-text-secondary-dark text-sm mt-1 font-secondary">
          {description}
        </p>
      </div>
    </div>
  );
}
