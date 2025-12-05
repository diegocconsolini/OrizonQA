'use client';

import { useEffect } from 'react';
import { useAssistantStore } from '@/app/stores/assistantStore';

export function AssistantProvider({ children }) {
  const { toggle, setViewMode, close } = useAssistantStore();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
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

      // Escape - Close assistant
      if (e.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, setViewMode, close]);

  return children;
}
