'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAssistantStore } from '@/app/stores/assistantStore';

export default function ChatInput({ onSend, disabled = false }) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);
  const { addMessage, setIsTyping, pageContext } = useAssistantStore();

  // Focus input when component mounts or assistant opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isSending || disabled) return;

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
        await onSend(trimmedInput, pageContext);
      } else {
        // Default: call the chat API
        const response = await fetch('/api/chat-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmedInput,
            context: pageContext
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();

        addMessage({
          role: 'assistant',
          content: data.response || data.message,
          suggestions: data.suggestions,
          read: false
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
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

      {/* Hint */}
      <div className="flex items-center justify-between mt-2 text-[10px] text-text-secondary">
        <span>
          Press <kbd className="px-1 bg-white/10 rounded">Enter</kbd> to send
        </span>
        <span>
          <kbd className="px-1 bg-white/10 rounded">Shift+Enter</kbd> for newline
        </span>
      </div>
    </div>
  );
}
