'use client';

import { X, Maximize2, Minimize2, Sparkles, Trash2 } from 'lucide-react';
import { useAssistantStore } from '@/app/stores/assistantStore';
import ContextBar from './ContextBar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import QuickActions from './QuickActions';

export default function FloatingPanel() {
  const {
    isOpen,
    viewMode,
    toggle,
    setViewMode,
    pageContext,
    messages,
    clearMessages
  } = useAssistantStore();

  // Don't render if not open or not in floating mode
  if (!isOpen || viewMode !== 'floating') return null;

  const hasMessages = messages.length > 0;

  return (
    <div
      className="fixed bottom-20 right-4 w-[380px] h-[520px]
                 bg-bg-dark border border-white/10 rounded-2xl
                 shadow-2xl shadow-black/50 flex flex-col z-50
                 animate-in slide-in-from-bottom-4 fade-in duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-cyan-500
                          flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">ORIZON Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Clear chat */}
          {hasMessages && (
            <button
              onClick={clearMessages}
              className="p-1.5 hover:bg-white/5 rounded text-text-secondary
                         hover:text-red-400 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {/* Expand to sidebar */}
          <button
            onClick={() => setViewMode('sidebar')}
            className="p-1.5 hover:bg-white/5 rounded text-text-secondary
                       hover:text-white transition-colors"
            title="Expand to sidebar (⌘⇧J)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {/* Close */}
          <button
            onClick={toggle}
            className="p-1.5 hover:bg-white/5 rounded text-text-secondary
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
      <div className="px-4 py-2 border-t border-white/10 bg-bg-dark/50">
        <div className="flex items-center justify-between text-[10px] text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Claude Haiku
          </span>
          <span>
            <kbd className="px-1 bg-white/10 rounded">⌘J</kbd> to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
