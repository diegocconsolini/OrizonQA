'use client';

/**
 * Page Transition Context
 *
 * Provides shared state for GSAP page transitions.
 * Allows the video background to persist while page content animates.
 */

import { createContext, useContext, useState, useCallback } from 'react';

const PageTransitionContext = createContext({
  isTransitioning: false,
  transitionTarget: null,
  startTransition: () => {},
  endTransition: () => {},
});

export function PageTransitionProvider({ children }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState(null);

  const startTransition = useCallback((target) => {
    setTransitionTarget(target);
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
    setTransitionTarget(null);
  }, []);

  return (
    <PageTransitionContext.Provider value={{
      isTransitioning,
      transitionTarget,
      startTransition,
      endTransition,
    }}>
      {children}
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  return useContext(PageTransitionContext);
}
