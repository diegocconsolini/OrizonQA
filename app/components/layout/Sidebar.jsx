/**
 * ORIZON Sidebar Component
 *
 * A persistent left sidebar for authenticated pages following the design mockups.
 *
 * Features:
 * - Logo at top
 * - Main navigation items
 * - Collapsible sections
 * - User profile at bottom
 * - Mobile responsive (collapsible)
 * - Active state indicators
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Logo from '../ui/Logo';
import {
  LayoutDashboard,
  Settings,
  History,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  FolderKanban,
  Code,
  Github,
  CheckSquare,
  Share2,
  Play,
  FileText
} from 'lucide-react';

export default function Sidebar({ collapsed = false, onToggle }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [stats, setStats] = useState({ total: 0, totalTokens: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Handle logout with proper token revocation
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      // First, call our logout API to revoke GitHub token if applicable
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API error:', error);
    }

    // Then proceed with NextAuth signOut (clears session)
    await signOut({ callbackUrl: '/login' });
  };

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Analyze',
      href: '/analyze',
      icon: <Code className="w-5 h-5" />,
      badge: 'Git',
    },
    {
      label: 'Execute',
      href: '/execute',
      icon: <Play className="w-5 h-5" />,
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: 'Projects',
      href: '/projects',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      label: 'History',
      href: '/history',
      icon: <History className="w-5 h-5" />,
    },
    {
      label: 'Todos',
      href: '/todos',
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      label: 'Shares',
      href: '/shares',
      icon: <Share2 className="w-5 h-5" />,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const bottomItems = [
    {
      label: 'Profile',
      href: '/profile',
      icon: <User className="w-5 h-5" />,
    },
  ];

  const isActive = (href) => pathname === href;

  // Load user stats
  useEffect(() => {
    async function loadStats() {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/user/analyses?limit=1');
        if (response.ok) {
          const data = await response.json();
          setStats({
            total: data.stats?.total || 0,
            totalTokens: data.stats?.totalTokens || 0
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }

    loadStats();
  }, [session]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-surface-dark border-r border-white/10 flex flex-col transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section - Fixed height to prevent layout shift */}
      <div className={`flex flex-col items-center justify-center px-4 border-b border-white/10 ${
        collapsed ? 'h-[72px]' : 'h-[100px]'
      }`}>
        {!collapsed ? (
          <div className="flex flex-col gap-2 items-center">
            <Logo variant="full" color="blue" size="md" background="dark" />
            <p className="text-sm text-text-secondary-dark font-medium font-secondary tracking-wide uppercase text-center">
              AI-Powered QA Analysis
            </p>
          </div>
        ) : (
          <Logo variant="icon" color="blue" size="sm" background="dark" />
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-6">
        <div className="space-y-1 px-3">
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-secondary-dark hover:bg-white/5 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && (
                <>
                  <span className="font-secondary font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </a>
          ))}
        </div>

        {/* Quick Stats (when expanded) */}
        {!collapsed && (
          <div className="mt-8 px-3">
            <p className="text-xs text-text-muted-dark uppercase tracking-wider mb-3 px-3">
              Quick Stats
            </p>
            {loadingStats ? (
              <div className="h-24 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-xs text-text-secondary-dark">Analyses</span>
                  </div>
                  <p className="text-lg font-bold text-white">{stats.total}</p>
                </div>
                <div className="px-3 py-2 bg-quantum/5 rounded-lg border border-quantum/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-quantum" />
                    <span className="text-xs text-text-secondary-dark">Tokens</span>
                  </div>
                  <p className="text-sm font-semibold text-quantum">
                    {((stats.totalTokens || 0) / 1000).toFixed(1)}K
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10">
        {/* User Profile */}
        {session?.user && (
          <div className={`p-4 ${collapsed ? 'flex justify-center' : ''}`}>
            {!collapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {session.user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session.user.name || 'User'}
                  </p>
                  <p className="text-xs text-text-secondary-dark truncate">
                    {session.user.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                  title="Sign out"
                >
                  {loggingOut ? (
                    <div className="w-4 h-4 border-2 border-text-secondary-dark/30 border-t-text-secondary-dark rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 text-text-secondary-dark" />
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold hover:bg-primary/30 transition-colors disabled:opacity-50"
                title="Sign out"
              >
                {loggingOut ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  session.user.email?.[0]?.toUpperCase() || 'U'
                )}
              </button>
            )}
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="w-full p-3 flex items-center justify-center border-t border-white/10 hover:bg-white/5 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-text-secondary-dark" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-text-secondary-dark" />
          )}
        </button>
      </div>
    </aside>
  );
}
