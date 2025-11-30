/**
 * Landing Page
 *
 * Public marketing page for ORIZON - shown to unauthenticated users.
 * Authenticated users are redirected to /dashboard via middleware.
 *
 * Sections:
 * - Hero with animated gradient
 * - Features showcase
 * - How it works
 * - Testimonials/Stats
 * - CTA section
 *
 * Design: ORIZON cosmic dark theme with blue (#00D4FF) and purple (#6A00FF)
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/app/components/ui/Logo.jsx';
import Button from '@/app/components/ui/Button.jsx';
import {
  Sparkles,
  FileCode2,
  TestTube2,
  ClipboardCheck,
  ArrowRight,
  Github,
  Zap,
  Shield,
  Clock,
  Code2,
  Upload,
  BarChart3,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-bg-dark overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-dark/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-1.5">
          <div className="flex items-center justify-between">
            <Logo variant="full" color="blue" size="2xl" background="dark" />

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-text-secondary-dark hover:text-white transition-colors font-secondary"
              >
                Sign In
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] transition-opacity duration-1000 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] transition-opacity duration-1000 delay-300 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium font-secondary">
              AI-Powered QA Analysis
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`text-5xl md:text-7xl font-bold text-white mb-6 font-primary tracking-tight transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Generate QA Artifacts
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-secondary">
              In Seconds
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={`text-xl text-text-secondary-dark max-w-2xl mx-auto mb-10 font-secondary leading-relaxed transition-all duration-700 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Transform your codebase into comprehensive user stories, test cases,
            and acceptance criteria using Claude AI. Paste code, fetch from GitHub,
            or upload files.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Link href="/signup">
              <Button variant="primary" size="lg" className="px-8">
                Start Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg" className="px-8">
                <Github className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div
            className={`flex items-center justify-center gap-8 mt-12 transition-all duration-700 delay-500 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center gap-2 text-text-secondary-dark">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm font-secondary">No data stored</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary-dark">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-secondary">Instant analysis</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary-dark">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-secondary">10x faster</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-primary">
              Everything You Need for QA
            </h2>
            <p className="text-text-secondary-dark max-w-2xl mx-auto font-secondary">
              Comprehensive QA artifact generation powered by Claude AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-surface-dark/50 border border-white/5 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 group">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <FileCode2 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 font-primary">
                User Stories
              </h3>
              <p className="text-text-secondary-dark font-secondary leading-relaxed">
                Generate comprehensive user stories with personas, acceptance criteria,
                and priority levels from your code.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface-dark/50 border border-white/5 rounded-2xl p-8 hover:border-secondary/30 transition-all duration-300 group">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                <TestTube2 className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 font-primary">
                Test Cases
              </h3>
              <p className="text-text-secondary-dark font-secondary leading-relaxed">
                Auto-generate unit tests, integration tests, and E2E scenarios
                for Jest, Pytest, JUnit, and more.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface-dark/50 border border-white/5 rounded-2xl p-8 hover:border-green-400/30 transition-all duration-300 group">
              <div className="w-14 h-14 bg-green-400/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-400/20 transition-colors">
                <ClipboardCheck className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 font-primary">
                Acceptance Criteria
              </h3>
              <p className="text-text-secondary-dark font-secondary leading-relaxed">
                Define clear acceptance criteria with Given-When-Then format,
                edge cases, and validation rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-surface-dark/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-primary">
              How It Works
            </h2>
            <p className="text-text-secondary-dark max-w-2xl mx-auto font-secondary">
              Three simple steps to transform your code into QA artifacts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Code2 className="w-8 h-8 text-primary" />
              </div>
              <div className="text-primary font-bold text-sm mb-2 font-secondary">STEP 1</div>
              <h3 className="text-xl font-semibold text-white mb-3 font-primary">
                Input Your Code
              </h3>
              <p className="text-text-secondary-dark font-secondary">
                Paste code directly, fetch from a GitHub repository, or upload files
                including .zip archives.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 border border-secondary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-secondary" />
              </div>
              <div className="text-secondary font-bold text-sm mb-2 font-secondary">STEP 2</div>
              <h3 className="text-xl font-semibold text-white mb-3 font-primary">
                Configure Analysis
              </h3>
              <p className="text-text-secondary-dark font-secondary">
                Select which artifacts to generate, choose your test framework,
                and customize output format.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-400/10 border border-green-400/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-green-400 font-bold text-sm mb-2 font-secondary">STEP 3</div>
              <h3 className="text-xl font-semibold text-white mb-3 font-primary">
                Get Results
              </h3>
              <p className="text-text-secondary-dark font-secondary">
                Receive comprehensive QA artifacts in seconds. Copy, download,
                or export to Jira.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2 font-primary">10x</div>
              <div className="text-text-secondary-dark font-secondary">Faster QA</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2 font-primary">50+</div>
              <div className="text-text-secondary-dark font-secondary">File Types</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2 font-primary">100%</div>
              <div className="text-text-secondary-dark font-secondary">Privacy</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2 font-primary">24/7</div>
              <div className="text-text-secondary-dark font-secondary">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-primary">
            Ready to Transform Your QA Process?
          </h2>
          <p className="text-xl text-text-secondary-dark mb-10 font-secondary">
            Join developers who are saving hours on QA documentation.
          </p>

          <Link href="/signup">
            <Button variant="primary" size="lg" className="px-10">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-text-secondary-dark">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-secondary">No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary-dark">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-secondary">Use your own API key</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo variant="full" color="blue" size="3xl" background="dark" />

            <div className="flex items-center gap-8 text-sm text-text-secondary-dark font-secondary">
              <Link href="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-white transition-colors">
                Sign Up
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>

            <div className="text-sm text-text-secondary-dark font-secondary">
              &copy; {new Date().getFullYear()} ORIZON. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
