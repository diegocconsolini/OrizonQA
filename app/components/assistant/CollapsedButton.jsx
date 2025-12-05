'use client';

import { Sparkles, MessageSquare } from 'lucide-react';
import { useAssistantStore } from '@/app/stores/assistantStore';

export default function CollapsedButton() {
  const { isOpen, viewMode, toggle, messages } = useAssistantStore();

  // Don't show if already open in floating/sidebar mode
  if (isOpen && viewMode !== 'collapsed') return null;

  const unreadCount = messages.filter(m => m.role === 'assistant' && !m.read).length;

  return (
    <button
      onClick={toggle}
      className="fixed bottom-4 right-4 w-14 h-14
                 bg-gradient-to-br from-primary to-cyan-500
                 rounded-full shadow-lg shadow-primary/25
                 flex items-center justify-center
                 hover:scale-105 active:scale-95 transition-transform z-50
                 group"
      aria-label="Open ORIZON Assistant"
    >
      <Sparkles className="w-6 h-6 text-white group-hover:hidden" />
      <MessageSquare className="w-6 h-6 text-white hidden group-hover:block" />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500
                         rounded-full text-[10px] text-white font-bold
                         flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {/* Tooltip */}
      <span className="absolute right-16 bg-bg-dark px-3 py-1.5 rounded-lg text-xs text-white
                       whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity
                       shadow-lg border border-white/10 pointer-events-none">
        Ask ORIZON AI
        <kbd className="ml-2 px-1.5 py-0.5 bg-white/10 rounded text-[10px]">⌘J</kbd>
      </span>
    </button>
  );
}
