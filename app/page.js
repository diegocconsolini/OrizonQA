/**
 * Landing Page - Clean & Professional
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/app/components/ui/Logo.jsx';
import Button from '@/app/components/ui/Button.jsx';
import {
  FileCode2,
  TestTube2,
  ClipboardCheck,
  ArrowRight,
  Code2,
  Upload,
  BarChart3
} from 'lucide-react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-bg-dark relative">
      {/* VIDEO BACKGROUND */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src="/videos/event-horizon.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-bg-dark/60" />
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-bg-dark/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Logo variant="full" color="blue" size="md" background="dark" />

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-text-secondary-dark hover:text-white transition-colors text-sm">
                Sign In
              </Link>
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
      <section className="relative pt-32 pb-24 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`text-6xl font-bold text-white mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Professional QA Management
          </h1>

          <p className={`text-xl text-text-secondary-dark mb-10 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Manage projects, requirements, test cases, and test executions in one place.
          </p>

          <div className={`flex items-center justify-center gap-4 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link href="/signup">
              <Button variant="primary" size="lg">
                Start Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Core Features</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Project Management */}
            <div className="bg-surface-dark/40 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Projects</h3>
              <p className="text-text-secondary-dark leading-relaxed">
                Organize your work by project. Track requirements, test cases, and execution results.
              </p>
            </div>

            {/* Requirements */}
            <div className="bg-surface-dark/40 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileCode2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Requirements</h3>
              <p className="text-text-secondary-dark leading-relaxed">
                Define and manage user stories, epics, and functional requirements.
              </p>
            </div>

            {/* Test Cases */}
            <div className="bg-surface-dark/40 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TestTube2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Test Cases</h3>
              <p className="text-text-secondary-dark leading-relaxed">
                Create detailed test cases with steps, expected results, and preconditions.
              </p>
            </div>

            {/* Test Execution */}
            <div className="bg-surface-dark/40 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <ClipboardCheck className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Test Runs</h3>
              <p className="text-text-secondary-dark leading-relaxed">
                Execute test cases, record results, and track pass/fail rates.
              </p>
            </div>

            {/* Coverage Analysis */}
            <div className="bg-surface-dark/40 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Coverage</h3>
              <p className="text-text-secondary-dark leading-relaxed">
                Analyze test coverage and identify untested requirements.
              </p>
            </div>

            {/* Integrations */}
            <div className="bg-surface-dark/40 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Integrations</h3>
              <p className="text-text-secondary-dark leading-relaxed">
                Connect with Jira, GitHub, Azure DevOps, and GitLab.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 bg-surface-dark/20 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Getting Started</h2>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Create a Project</h3>
                <p className="text-text-secondary-dark">
                  Set up your project with a unique key and description.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Define Requirements</h3>
                <p className="text-text-secondary-dark">
                  Add user stories and requirements to your project.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Write Test Cases</h3>
                <p className="text-text-secondary-dark">
                  Create test cases with detailed steps and expected outcomes.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">4</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Execute & Track</h3>
                <p className="text-text-secondary-dark">
                  Run tests, record results, and monitor quality metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Start Managing Your QA Process
          </h2>
          <p className="text-xl text-text-secondary-dark mb-10">
            Free to use. No credit card required.
          </p>

          <Link href="/signup">
            <Button variant="primary" size="lg">
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo variant="full" color="blue" size="md" background="dark" />

            <div className="flex items-center gap-6 text-sm text-text-secondary-dark">
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
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
