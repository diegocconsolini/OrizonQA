'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { useAssistantStore } from '@/app/stores/assistantStore';

export default function ChatInput({ onSend, disabled = false }) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);
  const { addMessage, setIsTyping, pageContext, apiKey, hasApiKey, pageActions } = useAssistantStore();

  /**
   * Execute actions returned by the assistant
   */
  const executeActions = useCallback(async (actions) => {
    if (!actions || !Array.isArray(actions) || actions.length === 0) return;
    if (!pageActions) {
      console.warn('Page actions not available - actions cannot be executed');
      return;
    }

    for (const action of actions) {
      try {
        const { type, payload } = action;

        switch (type) {
          case 'SELECT_FILE':
            pageActions.toggleFileSelection?.(payload.path);
            break;
          case 'SELECT_FILES_BATCH':
            await pageActions.batchToggleFiles?.(payload.paths, true);
            break;
          case 'CLEAR_SELECTION':
            pageActions.clearSelection?.();
            break;
          case 'UPDATE_CONFIG':
            pageActions.setConfig?.((prev) => ({ ...prev, ...payload }));
            break;
          case 'SELECT_QUICK_ACTION':
            pageActions.setConfig?.((prev) => ({ ...prev, ...payload.config }));
            break;
          case 'START_ANALYSIS':
            await pageActions.onAnalyze?.();
            break;
          case 'CANCEL_ANALYSIS':
            pageActions.onCancel?.();
            break;
          default:
            console.warn(`Unknown action type: ${type}`);
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.type}:`, error);
      }
    }
  }, [pageActions]);

  // Focus input when component mounts or assistant opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isSending || disabled) return;

    // Check for API key
    if (!hasApiKey) {
      addMessage({
        role: 'assistant',
        content: 'Please add your Claude API key in Settings to use the assistant.',
        read: false
      });
      return;
    }

    // Add user message
    addMessage({
      role: 'user',
      content: trimmedInput,
      read: true
    });

    setInput('');
    setIsSending(true);
    setIsTyping(true);

    try {
      // Call the onSend callback if provided
      if (onSend) {
        await onSend(trimmedInput, pageContext, apiKey);
      } else {
        // Default: call the chat API with apiKey
        const response = await fetch('/api/chat-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmedInput,
            context: pageContext || {},
            apiKey: apiKey
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to get response');
        }

        const data = await response.json();

        // Execute any actions returned by the assistant
        if (data.actions && data.actions.length > 0) {
          await executeActions(data.actions);
        }

        addMessage({
          role: 'assistant',
          content: data.response || data.message,
          actions: data.actions,
          toolResults: data.toolResults,
          usage: data.usage,
          read: false
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: error.message === 'Invalid API key'
          ? 'Invalid API key. Please check your settings.'
          : 'Sorry, I encountered an error. Please try again.',
        read: false
      });
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-white/10 p-3 bg-bg-dark/50">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 bg-surface-dark rounded-lg border border-white/10
                        focus-within:border-primary/50 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={disabled || isSending}
            className="flex-1 px-3 py-2.5 bg-transparent text-sm text-white
                       placeholder-text-secondary focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending || disabled}
            className="p-2 mr-1 hover:bg-white/5 rounded text-text-secondary
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Hint / Status */}
      <div className="flex items-center justify-between mt-2 text-[10px] text-text-secondary">
        {hasApiKey ? (
          <>
            <span>
              Press <kbd className="px-1 bg-white/10 rounded">Enter</kbd> to send
            </span>
            <span>
              <kbd className="px-1 bg-white/10 rounded">Shift+Enter</kbd> for newline
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1 text-amber-400">
            <AlertCircle className="w-3 h-3" />
            Add API key in Settings to chat
          </span>
        )}
      </div>
    </div>
  );
}
