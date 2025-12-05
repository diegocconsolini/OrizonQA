import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAssistantStore = create(
  persist(
    (set, get) => ({
      // View state
      isOpen: false,
      viewMode: 'collapsed', // 'collapsed' | 'floating' | 'sidebar'

      // Chat state
      messages: [],
      isTyping: false,

      // Context from current page
      pageContext: null,

      // Settings
      settings: {
        position: 'bottom-right', // 'bottom-right' | 'bottom-left'
        saveHistory: false,
        includeContext: true,
      },

      // Actions
      toggle: () => set(state => ({
        isOpen: !state.isOpen,
        viewMode: state.isOpen ? 'collapsed' : 'floating'
      })),

      open: () => set({ isOpen: true, viewMode: 'floating' }),

      close: () => set({ isOpen: false, viewMode: 'collapsed' }),

      setViewMode: (mode) => set({
        viewMode: mode,
        isOpen: mode !== 'collapsed'
      }),

      setPageContext: (context) => set({ pageContext: context }),

      clearPageContext: () => set({ pageContext: null }),

      addMessage: (message) => set(state => ({
        messages: [...state.messages, {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString()
        }]
      })),

      updateMessage: (id, updates) => set(state => ({
        messages: state.messages.map(msg =>
          msg.id === id ? { ...msg, ...updates } : msg
        )
      })),

      clearMessages: () => set({ messages: [] }),

      setIsTyping: (isTyping) => set({ isTyping }),

      updateSettings: (newSettings) => set(state => ({
        settings: { ...state.settings, ...newSettings }
      })),

      // Computed getters
      getUnreadCount: () => {
        const state = get();
        return state.messages.filter(m => m.role === 'assistant' && !m.read).length;
      },

      markAllRead: () => set(state => ({
        messages: state.messages.map(msg => ({ ...msg, read: true }))
      })),
    }),
    {
      name: 'orizon-assistant',
      partialize: (state) => ({
        viewMode: state.viewMode,
        settings: state.settings,
        // Only persist messages if user opted in
        messages: state.settings.saveHistory ? state.messages : [],
      }),
    }
  )
);
