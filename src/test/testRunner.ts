// Integration with main app for testing
// Import this in a component to make tests available in browser console

import { runMysteryCardTests } from './mysterySongTest';

// Make tests available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testMysteryCards = runMysteryCardTests;
  
  // Auto-run tests in development mode
  if (import.meta.env.DEV) {
    console.log('🧪 Mystery card tests available: window.testMysteryCards()');
  }
}

export { runMysteryCardTests };