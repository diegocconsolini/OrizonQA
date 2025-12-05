'use client';

import CollapsedButton from './CollapsedButton';
import FloatingPanel from './FloatingPanel';
import SidebarPanel from './SidebarPanel';

/**
 * FloatingAssistant - Global AI assistant component
 *
 * Renders all three view modes:
 * 1. CollapsedButton - Floating trigger button (always visible when closed)
 * 2. FloatingPanel - Expandable chat window (380x520px)
 * 3. SidebarPanel - Full-height docked sidebar (400px wide)
 *
 * State is managed by Zustand store (assistantStore.js)
 * Keyboard shortcuts are handled by AssistantProvider
 *
 * @example
 * // Add to app layout:
 * <AssistantProvider>
 *   {children}
 *   <FloatingAssistant />
 * </AssistantProvider>
 */
export default function FloatingAssistant() {
  return (
    <>
      {/* Collapsed state - floating button */}
      <CollapsedButton />

      {/* Floating panel - expandable chat */}
      <FloatingPanel />

      {/* Sidebar panel - docked full-height */}
      <SidebarPanel />
    </>
  );
}
