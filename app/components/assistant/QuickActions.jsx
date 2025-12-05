'use client';

import { Zap } from 'lucide-react';
import { useAssistantStore } from '@/app/stores/assistantStore';

export default function QuickActions({ actions, onActionClick }) {
  const { addMessage } = useAssistantStore();

  if (!actions || actions.length === 0) return null;

  const handleActionClick = (action) => {
    // Add user message for the action
    addMessage({
      role: 'user',
      content: action.label,
      read: true
    });

    // Call the action handler if provided
    if (onActionClick) {
      onActionClick(action);
    }
  };

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="w-3 h-3 text-primary" />
        <span className="text-[10px] text-text-secondary uppercase tracking-wider">
          Quick Actions
        </span>
      </div>
      <div className="space-y-1">
        {actions.slice(0, 4).map((action, idx) => (
          <button
            key={action.id || idx}
            onClick={() => handleActionClick(action)}
            className="w-full text-left text-xs text-text-secondary hover:text-white
                       flex items-center gap-2 p-2 rounded-lg hover:bg-white/5
                       transition-colors group"
          >
            <span className="text-primary group-hover:text-cyan-400 transition-colors">•</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
