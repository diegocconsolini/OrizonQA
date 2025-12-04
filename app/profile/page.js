'use client';

/**
 * User Profile Page
 *
 * Consolidated user profile management with:
 * - Profile info display and editing
 * - Avatar upload
 * - Password management
 * - Account statistics
 * - Account deletion
 */

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/app/components/layout/AppLayout';
import {
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  Key,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Camera,
  BarChart3,
  FileText,
  Zap,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Profile state
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Password states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Delete account states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Load profile and stats
  useEffect(() => {
    async function loadData() {
      if (!session?.user?.id) return;

      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/user/analytics?period=all')
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          setNewName(profileData.fullName || '');
          // Generate avatar from initials if no custom avatar
          if (!profileData.avatarUrl) {
            const initials = (profileData.fullName || profileData.email || 'U')[0].toUpperCase();
            setAvatarUrl(null);
          }
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.summary);
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session]);

  // Save name
  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim().length < 2) {
      return;
    }

    setSavingName(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: newName.trim() })
      });

      if (res.ok) {
        setProfile(prev => ({ ...prev, fullName: newName.trim() }));
        setEditingName(false);
      }
    } catch (err) {
      console.error('Failed to save name:', err);
    } finally {
      setSavingName(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setSavingPassword(true);
    try {
      const body = profile.hasPassword
        ? { currentPassword, newPassword }
        : { newPassword, setPassword: true };

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to update password');
        return;
      }

      // Success - reset form
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfile(prev => ({ ...prev, hasPassword: true }));
    } catch (err) {
      setPasswordError('Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });

      if (res.ok) {
        router.push('/login?deleted=true');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch (err) {
      setError('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  if (status === 'loading' || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!session) return null;

  const initials = (profile?.fullName || profile?.email || 'U')[0].toUpperCase();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <User className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-text-secondary-dark">Manage your account settings</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold">
                {initials}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  // Avatar upload handler - to be implemented
                  console.log('Avatar upload:', e.target.files?.[0]);
                }}
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              {/* Name */}
              <div className="flex items-center gap-2 mb-2">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="p-1 text-green-400 hover:bg-green-500/10 rounded"
                    >
                      {savingName ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false);
                        setNewName(profile?.fullName || '');
                      }}
                      className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-white">
                      {profile?.fullName || 'No name set'}
                    </h2>
                    <button
                      onClick={() => setEditingName(true)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <Mail className="w-4 h-4" />
                <span>{profile?.email}</span>
                {profile?.emailVerified && (
                  <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-400 rounded-full">
                    Verified
                  </span>
                )}
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(profile?.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Last login {formatRelativeTime(profile?.lastLogin)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Total Analyses</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalAnalyses || 0}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Tokens Used</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {((stats.totalTokens || 0) / 1000).toFixed(1)}K
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Avg Tokens/Analysis</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {((stats.avgTokensPerAnalysis || 0) / 1000).toFixed(1)}K
              </p>
            </div>
          </div>
        )}

        {/* Security Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">Security</h3>
          </div>

          {/* Password Management */}
          <div className="border-b border-slate-700 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-white font-medium">Password</p>
                  <p className="text-sm text-slate-500">
                    {profile?.hasPassword ? 'Password is set' : 'No password set (OAuth account)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                {profile?.hasPassword ? 'Change Password' : 'Set Password'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                {profile?.hasPassword && (
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {passwordError && (
                  <p className="text-sm text-red-400">{passwordError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordError(null);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Delete Account */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white font-medium">Delete Account</p>
                  <p className="text-sm text-slate-500">Permanently delete your account and all data</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              >
                Delete Account
              </button>
            </div>

            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">This action cannot be undone</p>
                    <p className="text-sm text-slate-400 mt-1">
                      All your analyses, todos, and settings will be permanently deleted.
                    </p>
                  </div>
                </div>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  className="w-full bg-slate-800 border border-red-500/30 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || !deletePassword}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete My Account'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                    }}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
