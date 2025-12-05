'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAssistantStore } from '@/app/stores/assistantStore';

export function AssistantProvider({ children }) {
  const { data: session, status: sessionStatus } = useSession();
  const { toggle, setViewMode, close, setApiKey } = useAssistantStore();
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load user settings (API key) on mount
  useEffect(() => {
    async function loadUserSettings() {
      if (sessionStatus === 'loading' || !session || settingsLoaded) return;

      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.claudeApiKey) {
            setApiKey(data.claudeApiKey);
          }
        }
      } catch (error) {
        console.error('Error loading user settings for assistant:', error);
      } finally {
        setSettingsLoaded(true);
      }
    }

    loadUserSettings();
  }, [session, sessionStatus, settingsLoaded, setApiKey]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input/textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' ||
                       activeElement?.tagName === 'TEXTAREA' ||
                       activeElement?.isContentEditable;

      // Cmd/Ctrl + J - Toggle assistant
      if ((e.metaKey || e.ctrlKey) && e.key === 'j' && !e.shiftKey) {
        e.preventDefault();
        toggle();
      }

      // Cmd/Ctrl + Shift + J - Open in sidebar mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'j') {
        e.preventDefault();
        setViewMode('sidebar');
      }

      // Escape - Close assistant (only if not typing)
      if (e.key === 'Escape' && !isTyping) {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, setViewMode, close]);

  return children;
}
