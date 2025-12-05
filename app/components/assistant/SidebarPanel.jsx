'use client';

import { X, Minimize2, Sparkles, Trash2 } from 'lucide-react';
import { useAssistantStore } from '@/app/stores/assistantStore';
import ContextBar from './ContextBar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import QuickActions from './QuickActions';

export default function SidebarPanel() {
  const {
    isOpen,
    viewMode,
    toggle,
    setViewMode,
    pageContext,
    messages,
    clearMessages
  } = useAssistantStore();

  // Don't render if not open or not in sidebar mode
  if (!isOpen || viewMode !== 'sidebar') return null;

  const hasMessages = messages.length > 0;

  return (
    <div
      className="fixed top-0 right-0 w-[400px] h-full
                 bg-bg-dark border-l border-white/10
                 shadow-2xl shadow-black/50 flex flex-col z-40
                 animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500
                          flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-medium text-white block">ORIZON Assistant</span>
            <span className="text-[10px] text-text-secondary">AI-powered help</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Clear chat */}
          {hasMessages && (
            <button
              onClick={clearMessages}
              className="p-2 hover:bg-white/5 rounded text-text-secondary
                         hover:text-red-400 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {/* Minimize to floating */}
          <button
            onClick={() => setViewMode('floating')}
            className="p-2 hover:bg-white/5 rounded text-text-secondary
                       hover:text-white transition-colors"
            title="Minimize to floating panel"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          {/* Close */}
          <button
            onClick={toggle}
            className="p-2 hover:bg-white/5 rounded text-text-secondary
                       hover:text-white transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context Bar */}
      <ContextBar context={pageContext} />

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ChatMessages />

        {/* Quick Actions (show when no messages or few messages) */}
        {messages.length < 2 && pageContext?.suggestedActions && (
          <QuickActions actions={pageContext.suggestedActions} />
        )}
      </div>

      {/* Input Area */}
      <ChatInput />

      {/* Footer with model info */}
      <div className="px-4 py-3 border-t border-white/10 bg-bg-dark/50">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Claude Haiku for chat
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Sonnet 4 for analysis
            </span>
          </div>
        </div>
        <div className="mt-1.5 text-[10px] text-text-secondary">
          <kbd className="px-1 bg-white/10 rounded">⌘J</kbd> toggle •
          <kbd className="ml-1 px-1 bg-white/10 rounded">⌘⇧J</kbd> sidebar •
          <kbd className="ml-1 px-1 bg-white/10 rounded">Esc</kbd> close
        </div>
      </div>
    </div>
  );
}
