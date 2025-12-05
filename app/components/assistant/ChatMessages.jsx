'use client';

import { useEffect, useRef } from 'react';
import { Bot, User, Loader2 } from 'lucide-react';
import { useAssistantStore } from '@/app/stores/assistantStore';

export default function ChatMessages() {
  const { messages, isTyping } = useAssistantStore();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20
                          flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-white font-medium mb-1">How can I help?</p>
          <p className="text-xs text-text-secondary">
            Ask me anything about your code or project
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isTyping && (
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-cyan-500
                          flex items-center justify-center flex-shrink-0">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="bg-surface-dark rounded-xl rounded-tl-sm p-3 border border-white/10">
            <div className="flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-xs text-text-secondary">Thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="text-[10px] text-text-secondary bg-white/5 px-2 py-1 rounded">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
        ${isUser
          ? 'bg-white/10'
          : 'bg-gradient-to-br from-primary to-cyan-500'
        }`}
      >
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Bot className="w-3.5 h-3.5 text-white" />
        }
      </div>

      {/* Message bubble */}
      <div className={`max-w-[85%] rounded-xl p-3 text-sm
        ${isUser
          ? 'bg-primary/20 rounded-tr-sm text-white'
          : 'bg-surface-dark rounded-tl-sm border border-white/10 text-white'
        }`}
      >
        {/* Content */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Suggestions (for assistant messages) */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {message.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className="w-full text-left text-xs text-text-secondary hover:text-white
                           flex items-center gap-2 transition-colors"
              >
                <span className="text-primary">•</span>
                {suggestion.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div className="mt-1.5 text-[10px] text-text-secondary opacity-60">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>
    </div>
  );
}
