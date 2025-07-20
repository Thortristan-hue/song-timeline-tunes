/**
 * Viewport height calculation utility for mobile devices
 * Handles dynamic viewport height calculation and iOS safe areas
 */

import { safeVariableAccess, ensureInitialization } from './safeVariableAccess';

// Initialize flag with explicit type and value to prevent temporal dead zone issues
let isInitialized: boolean = false

/**
 * Calculate and set viewport height CSS variables
 * This fixes the mobile viewport height issues where 100vh doesn't work correctly
 */
function calculateViewportHeight() {
  try {
    // Use visual viewport when available (modern browsers), fallback to window.innerHeight
    const height = window.visualViewport?.height || window.innerHeight;
    const width = window.visualViewport?.width || window.innerWidth;
    
    // Calculate actual viewport height
    const vh = height * 0.01;
    const viewportHeight = `${height}px`;
    
    // Set CSS variables with error handling
    if (document.documentElement?.style) {
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      document.documentElement.style.setProperty('--mobile-viewport-height', viewportHeight);
      
      // For mobile safe height, use visual viewport height if available to account for dynamic UI
      const safeHeight = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--mobile-safe-height', `${safeHeight}px`);
    }
    
    console.log('Viewport height updated:', { 
      vh, 
      viewportHeight, 
      height, 
      width,
      visualViewport: !!window.visualViewport,
      innerHeight: window.innerHeight 
    });
  } catch (error) {
    console.warn('🔧 Viewport height calculation failed:', error);
    // Continue without breaking the app
  }
}

/**
 * Handle resize events with debouncing
 */
// Initialize timeout with explicit type and null value to prevent temporal dead zone issues
let resizeTimeout: NodeJS.Timeout | null = null

function handleResize(): void {
  try {
    // Ensure resizeTimeout is properly accessed with safe access
    safeVariableAccess(
      () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
          calculateViewportHeight();
        }, 100);
        return true;
      },
      false,
      'viewport handleResize'
    );
  } catch (error) {
    console.warn('🔧 Viewport resize handler failed:', error);
  }
}

/**
 * Handle orientation change events
 */
function handleOrientationChange() {
  try {
    // Add a small delay to ensure dimensions are updated after orientation change
    setTimeout(() => {
      calculateViewportHeight();
    }, 100);
  } catch (error) {
    console.warn('🔧 Viewport orientation change handler failed:', error);
  }
}

/**
 * Initialize viewport height calculation
 * Sets up event listeners and calculates initial values
 */
export async function initializeViewportHeight(): Promise<void> {
  try {
    // Ensure initialization timing with safe access
    const initialized = safeVariableAccess(
      () => isInitialized,
      false,
      'viewport isInitialized check'
    );
    
    if (initialized) {
      console.log('🔧 Viewport height already initialized, skipping');
      return;
    }
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('🔧 Viewport height initialization skipped: not in browser environment');
      return;
    }
    
    console.log('🔧 VIEWPORT: Starting initialization...');
    
    // Small delay to ensure all variables are initialized
    await ensureInitialization(5);
    
    // Calculate initial viewport height
    calculateViewportHeight();
    
    // Add event listeners for viewport changes with error handling
    try {
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleOrientationChange);
      console.log('✅ VIEWPORT: Basic event listeners added');
    } catch (error) {
      console.warn('🔧 VIEWPORT: Basic event listeners failed:', error);
    }
    
    // Also listen for visual viewport changes (iOS Safari address bar)
    try {
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
        console.log('✅ VIEWPORT: Visual viewport listener added');
      }
    } catch (error) {
      console.warn('🔧 VIEWPORT: Visual viewport listener failed:', error);
    }
    
    // Safely update initialization flag
    safeVariableAccess(
      () => {
        isInitialized = true;
        return true;
      },
      false,
      'viewport isInitialized set'
    );
    
    console.log('✅ VIEWPORT: Initialization completed successfully');
    
  } catch (error) {
    console.error('🚨 VIEWPORT: Critical initialization error:', error);
    // Don't throw - allow app to continue without viewport features
  }
}

/**
 * Clean up event listeners
 */
export function cleanupViewportHeight(): void {
  const initialized = safeVariableAccess(
    () => isInitialized,
    false,
    'viewport cleanup isInitialized check'
  );
  
  if (!initialized) {
    return;
  }
  
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('orientationchange', handleOrientationChange);
  
  if ('visualViewport' in window) {
    window.visualViewport?.removeEventListener('resize', handleResize);
  }
  
  safeVariableAccess(
    () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
        resizeTimeout = null;
      }
      isInitialized = false;
      return true;
    },
    false,
    'viewport cleanup'
  );
  
  console.log('Viewport height calculation cleaned up');
}

/**
 * Force a recalculation of viewport height
 * Useful for manual triggers or specific scenarios
 */
export function recalculateViewportHeight() {
  calculateViewportHeight();
}