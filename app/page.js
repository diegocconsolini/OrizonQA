/**
 * Landing Page - GitHub-Inspired Design with GSAP Transitions
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import gsap from 'gsap';
import Logo from '@/app/components/ui/Logo.jsx';
import Button from '@/app/components/ui/Button.jsx';
import { usePageTransition } from './contexts/PageTransitionContext';
import {
  FileCode2,
  TestTube2,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  GitBranch,
  Users,
  Shield,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { startTransition } = usePageTransition();
  const [mounted, setMounted] = useState(false);

  // Refs for GSAP animations
  const containerRef = useRef(null);
  const navRef = useRef(null);
  const heroRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroCTARef = useRef(null);
  const sectionsRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    // Check if coming from login page (back navigation)
    const fromLogin = sessionStorage.getItem('fromLogin');
    if (fromLogin) {
      sessionStorage.removeItem('fromLogin');
      // Animate in from login state
      animateEnterFromLogin();
    }
  }, []);

  function animateEnterFromLogin() {
    const tl = gsap.timeline();

    // Animate elements in
    tl.fromTo(navRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    )
    .fromTo(heroTitleRef.current,
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.2'
    )
    .fromTo(heroDescRef.current,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' },
      '-=0.3'
    )
    .fromTo(heroCTARef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
      '-=0.2'
    )
    .fromTo(sectionsRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' },
      '-=0.2'
    )
    .fromTo(footerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' },
      '-=0.2'
    );
  }

  function handleLoginClick(e) {
    e.preventDefault();
    startTransition('login');

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('toLogin', 'true');
        router.push('/login');
      }
    });

    // Stagger animate out all landing page elements
    // Hero content slides and fades out to the left
    tl.to(heroTitleRef.current, {
      opacity: 0,
      x: -100,
      duration: 0.4,
      ease: 'power2.in'
    })
    .to(heroDescRef.current, {
      opacity: 0,
      x: -80,
      duration: 0.35,
      ease: 'power2.in'
    }, '-=0.25')
    .to(heroCTARef.current, {
      opacity: 0,
      y: 30,
      duration: 0.3,
      ease: 'power2.in'
    }, '-=0.2')
    // Nav fades up
    .to(navRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.in'
    }, '-=0.3')
    // Sections fade out
    .to(sectionsRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in'
    }, '-=0.3')
    // Footer fades out
    .to(footerRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    }, '-=0.2');
  }

  return (
    <div ref={containerRef} className="min-h-screen relative">
      {/* VIDEO BACKGROUND is in providers.js - persists across page transitions */}

      {/* NAVBAR */}
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-bg-dark/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Logo variant="full" color="blue" size="md" background="dark" />

            <div className="flex items-center gap-6">
              <button
                onClick={handleLoginClick}
                className="text-text-secondary-dark hover:text-white transition-colors text-sm font-medium"
              >
                Sign In
              </button>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <h1
              ref={heroTitleRef}
              className={`text-7xl font-bold text-white mb-8 leading-tight transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              QA management built for modern teams
            </h1>

            <p
              ref={heroDescRef}
              className={`text-2xl text-text-secondary-dark mb-10 leading-relaxed transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Track requirements, design test cases, execute test runs, and analyze coverage—all in one platform.
            </p>

            <div
              ref={heroCTARef}
              className={`flex items-center gap-4 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <Link href="/signup">
                <Button variant="primary" size="lg">
                  Start for free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SHOWCASE */}
      <div ref={sectionsRef}>
        <section className="py-24 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Projects */}
            <div className="mb-32">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-6">
                    <GitBranch className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Projects</span>
                  </div>
                  <h2 className="text-5xl font-bold text-white mb-6">
                    Organize by project
                  </h2>
                  <p className="text-xl text-text-secondary-dark mb-8 leading-relaxed">
                    Create projects with unique keys, manage team members, and configure integrations with Jira, GitHub, Azure DevOps, and GitLab.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Project-level settings and permissions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Team collaboration with role-based access</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">External tool integrations</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                  <div className="font-mono text-sm">
                    <div className="flex items-center gap-2 text-text-secondary-dark mb-4">
                      <span className="text-secondary">{">"}</span>
                      <span>project.create()</span>
                    </div>
                    <div className="bg-bg-dark/60 rounded-lg p-4 border border-white/5">
                      <pre className="text-text-secondary-dark">
{`{
  "name": "Mobile Banking App",
  "key": "BANK",
  "settings": {
    "testFramework": "Pytest",
    "cicdEnabled": true
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="mb-32">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                  <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-bg-dark/60 rounded-lg border border-primary/20">
                        <FileCode2 className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <div className="text-white font-medium">BANK-1: User Authentication</div>
                          <div className="text-sm text-text-secondary-dark">Story · High Priority</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-bg-dark/60 rounded-lg border border-white/10">
                        <FileCode2 className="w-5 h-5 text-secondary" />
                        <div className="flex-1">
                          <div className="text-white font-medium">BANK-2: Transaction History</div>
                          <div className="text-sm text-text-secondary-dark">Story · Medium Priority</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-bg-dark/60 rounded-lg border border-white/10">
                        <FileCode2 className="w-5 h-5 text-text-secondary-dark" />
                        <div className="flex-1">
                          <div className="text-white font-medium">BANK-3: Bill Payments</div>
                          <div className="text-sm text-text-secondary-dark">Task · Low Priority</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full mb-6">
                    <FileCode2 className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium text-secondary">Requirements</span>
                  </div>
                  <h2 className="text-5xl font-bold text-white mb-6">
                    Define what to build
                  </h2>
                  <p className="text-xl text-text-secondary-dark mb-8 leading-relaxed">
                    Manage user stories, epics, tasks, and bugs. Track status, priority, and assignees for every requirement.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Custom fields and metadata</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Link requirements to test cases</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Track acceptance criteria</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Test Cases */}
            <div className="mb-32">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-6">
                    <TestTube2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Test Cases</span>
                  </div>
                  <h2 className="text-5xl font-bold text-white mb-6">
                    Design comprehensive tests
                  </h2>
                  <p className="text-xl text-text-secondary-dark mb-8 leading-relaxed">
                    Create detailed test cases with step-by-step instructions, expected results, and preconditions. Support for functional, integration, E2E, and regression testing.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Structured test steps with expected outcomes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Reusable test case templates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Priority and type classification</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-medium">BANK-TC-1: Login Flow</span>
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">Functional</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-3 p-3 bg-bg-dark/60 rounded border border-white/5">
                        <span className="text-secondary font-mono text-sm">1.</span>
                        <span className="text-text-secondary-dark text-sm">Navigate to login page</span>
                      </div>
                      <div className="flex gap-3 p-3 bg-bg-dark/60 rounded border border-white/5">
                        <span className="text-secondary font-mono text-sm">2.</span>
                        <span className="text-text-secondary-dark text-sm">Enter valid credentials</span>
                      </div>
                      <div className="flex gap-3 p-3 bg-bg-dark/60 rounded border border-white/5">
                        <span className="text-secondary font-mono text-sm">3.</span>
                        <span className="text-text-secondary-dark text-sm">Click Login button</span>
                      </div>
                      <div className="flex gap-3 p-3 bg-bg-dark/60 rounded border border-primary/20">
                        <span className="text-primary font-mono text-sm">✓</span>
                        <span className="text-text-secondary-dark text-sm">User redirected to dashboard</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage */}
            <div>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                  <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">Test Coverage</span>
                          <span className="text-secondary font-bold">87%</span>
                        </div>
                        <div className="w-full bg-bg-dark/60 rounded-full h-3">
                          <div className="bg-gradient-to-r from-secondary to-primary h-3 rounded-full" style={{width: '87%'}}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-bg-dark/60 rounded-lg border border-white/5">
                          <div className="text-2xl font-bold text-white mb-1">142</div>
                          <div className="text-sm text-text-secondary-dark">Test Cases</div>
                        </div>
                        <div className="p-4 bg-bg-dark/60 rounded-lg border border-white/5">
                          <div className="text-2xl font-bold text-white mb-1">87</div>
                          <div className="text-sm text-text-secondary-dark">Requirements</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full mb-6">
                    <BarChart3 className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium text-secondary">Coverage</span>
                  </div>
                  <h2 className="text-5xl font-bold text-white mb-6">
                    Measure quality metrics
                  </h2>
                  <p className="text-xl text-text-secondary-dark mb-8 leading-relaxed">
                    Analyze test coverage to identify gaps. Track which requirements are tested and which need attention.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Requirement-to-test case mapping</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Visual coverage reports</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary-dark">Identify untested requirements</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BUILT FOR TEAMS */}
        <section className="py-24 px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-white mb-8">
              Built for QA teams of all sizes
            </h2>
            <p className="text-xl text-text-secondary-dark mb-16 max-w-3xl mx-auto leading-relaxed">
              From solo testers to enterprise QA departments, ORIZON scales with your testing needs.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Fast Setup</h3>
                <p className="text-text-secondary-dark">
                  Create your first project and start testing in minutes, not hours.
                </p>
              </div>

              <div className="p-8">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Team Collaboration</h3>
                <p className="text-text-secondary-dark">
                  Role-based access control and real-time collaboration for distributed teams.
                </p>
              </div>

              <div className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Enterprise Ready</h3>
                <p className="text-text-secondary-dark">
                  Secure authentication, audit logs, and integrations with enterprise tools.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-32 px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-6xl font-bold text-white mb-8">
              Start testing smarter today
            </h2>
            <p className="text-2xl text-text-secondary-dark mb-12">
              Free to use. No credit card required.
            </p>

            <Link href="/signup">
              <Button variant="primary" size="lg">
                Get started for free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer ref={footerRef} className="border-t border-white/5 py-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo variant="full" color="blue" size="md" background="dark" />

            <div className="flex items-center gap-8 text-sm text-text-secondary-dark">
              <button onClick={handleLoginClick} className="hover:text-white transition-colors">Sign In</button>
              <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            </div>

            <div className="text-sm text-text-secondary-dark">
              &copy; {new Date().getFullYear()} ORIZON
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
