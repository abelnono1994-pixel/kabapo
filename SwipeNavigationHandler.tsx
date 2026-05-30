'use client';

import { useSwipeNavigation } from '@/hooks/use-swipe-navigation';

/**
 * An invisible component that registers global swipe navigation listeners.
 */
export function SwipeNavigationHandler() {
  useSwipeNavigation();
  return null; // This component renders nothing.
}
