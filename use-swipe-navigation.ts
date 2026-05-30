'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const SWIPE_THRESHOLD = 75; // Min horizontal distance for a swipe in pixels
const SWIPE_VERTICAL_LIMIT = 60; // Max vertical distance to still be considered a horizontal swipe

// List of selectors for elements that should prevent swipe navigation
const IGNORE_SWIPE_SELECTORS = [
  'input',
  'textarea',
  'select',
  'button',
  'a[href]',
  '[role="button"]',
  '[role="slider"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="region"][aria-roledescription="carousel"]', // Shadcn/Embla Carousel
  '.recharts-surface', // Recharts graphs
  '[data-sidebar]', // App sidebar
  '[data-radix-scroll-area-viewport]', // Shadcn ScrollArea
];

/**
 * A hook that adds global event listeners to enable back/forward navigation via horizontal swipes.
 * It intelligently ignores swipes on interactive or scrollable elements to prevent conflicts.
 */
export function useSwipeNavigation() {
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Don't interfere if there are multiple touch points (e.g. pinch-zoom)
      if (e.touches.length > 1) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null || e.changedTouches.length === 0) {
        return;
      }

      // Check if the swipe originated on or inside an ignored element
      const targetElement = e.target as HTMLElement | null;
      if (targetElement?.closest(IGNORE_SWIPE_SELECTORS.join(', '))) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Reset for next swipe
      touchStartX.current = null;
      touchStartY.current = null;

      // Prioritize vertical scrolling over horizontal swiping
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }
      
      // Check if it's a valid horizontal swipe
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_VERTICAL_LIMIT) {
        if (deltaX < 0) {
          // Swipe Left -> Go Back
          router.back();
        } else {
          // Swipe Right -> Go Forward
          router.forward();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router]);
}
