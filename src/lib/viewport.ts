/**
 * Viewport height calculation utility for mobile devices
 * Handles dynamic viewport height calculation and iOS safe areas
 */

let isInitialized = false;

/**
 * Calculate and set viewport height CSS variables
 * This fixes the mobile viewport height issues where 100vh doesn't work correctly
 */
function calculateViewportHeight() {
  // Use visual viewport when available (modern browsers), fallback to window.innerHeight
  const height = window.visualViewport?.height || window.innerHeight;
  const width = window.visualViewport?.width || window.innerWidth;
  
  // Calculate actual viewport height
  const vh = height * 0.01;
  const viewportHeight = `${height}px`;
  
  // Set CSS variables
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--mobile-viewport-height', viewportHeight);
  
  // For mobile safe height, use visual viewport height if available to account for dynamic UI
  const safeHeight = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--mobile-safe-height', `${safeHeight}px`);
  
  console.log('Viewport height updated:', { 
    vh, 
    viewportHeight, 
    height, 
    width,
    visualViewport: !!window.visualViewport,
    innerHeight: window.innerHeight 
  });
}

/**
 * Handle resize events with debouncing
 */
let resizeTimeout: NodeJS.Timeout | null = null;
function handleResize() {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  
  resizeTimeout = setTimeout(() => {
    calculateViewportHeight();
  }, 100);
}

/**
 * Handle orientation change events
 */
function handleOrientationChange() {
  // Add a small delay to ensure dimensions are updated after orientation change
  setTimeout(() => {
    calculateViewportHeight();
  }, 100);
}

/**
 * Initialize viewport height calculation
 * Sets up event listeners and calculates initial values
 */
export function initializeViewportHeight() {
  if (isInitialized) {
    return;
  }
  
  // Calculate initial viewport height
  calculateViewportHeight();
  
  // Add event listeners for viewport changes
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleOrientationChange);
  
  // Also listen for visual viewport changes (iOS Safari address bar)
  if ('visualViewport' in window) {
    window.visualViewport?.addEventListener('resize', handleResize);
  }
  
  isInitialized = true;
  console.log('Viewport height calculation initialized');
}

/**
 * Clean up event listeners
 */
export function cleanupViewportHeight() {
  if (!isInitialized) {
    return;
  }
  
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('orientationchange', handleOrientationChange);
  
  if ('visualViewport' in window) {
    window.visualViewport?.removeEventListener('resize', handleResize);
  }
  
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }
  
  isInitialized = false;
  console.log('Viewport height calculation cleaned up');
}

/**
 * Force a recalculation of viewport height
 * Useful for manual triggers or specific scenarios
 */
export function recalculateViewportHeight() {
  calculateViewportHeight();
}