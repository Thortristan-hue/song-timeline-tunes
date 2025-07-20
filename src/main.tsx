import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeViewportHeight } from './lib/viewport.ts'

// Enhanced initialization with error handling and temporal dead zone protection
async function initializeApp(): Promise<void> {
  try {
    console.log('🚀 INITIALIZATION: Starting app initialization...');
    
    // Initialize viewport height calculation for mobile devices with error protection
    try {
      await initializeViewportHeight();
      console.log('✅ INITIALIZATION: Viewport height initialized');
    } catch (viewportError) {
      console.warn('⚠️ INITIALIZATION: Viewport initialization failed, continuing without it:', viewportError);
    }
    
    // Ensure DOM is ready with timeout protection
    const domReadyPromise = new Promise<void>((resolve) => {
      if (document.readyState === 'loading') {
        const handler = () => {
          document.removeEventListener('DOMContentLoaded', handler);
          resolve();
        };
        document.addEventListener('DOMContentLoaded', handler);
        
        // Fallback timeout in case DOMContentLoaded never fires
        setTimeout(() => {
          if (document.readyState !== 'loading') {
            document.removeEventListener('DOMContentLoaded', handler);
            resolve();
          }
        }, 5000);
      } else {
        resolve();
      }
    });
    
    await domReadyPromise;
    console.log('✅ INITIALIZATION: DOM ready');
    
    // Small delay to ensure all module-level variables are initialized
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Get root element with enhanced error handling
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found - critical DOM error');
    }
    console.log('✅ INITIALIZATION: Root element found');
    
    // Create and render React app with enhanced error handling
    const root = createRoot(rootElement);
    
    // Wrap rendering in try-catch to handle any lexical declaration issues
    try {
      root.render(<App />);
      console.log('✅ INITIALIZATION: React app rendered successfully');
    
    // Run tests in development mode to verify lexical declaration fixes
    if (process.env.NODE_ENV === 'development') {
      // Dynamically import tests to avoid including them in production
      import('./tests/safeAccessTests')
        .then(({ runSafeAccessTests, testInitializationDelay, simulateLexicalError }) => {
          // Run the tests asynchronously
          setTimeout(async () => {
            try {
              console.log('🧪 DEVELOPMENT: Running lexical declaration fix verification tests...');
              
              const basicTests = runSafeAccessTests();
              const delayTest = await testInitializationDelay();
              simulateLexicalError();
              
              if (basicTests && delayTest) {
                console.log('✅ DEVELOPMENT: All lexical declaration fix tests passed!');
              } else {
                console.warn('⚠️ DEVELOPMENT: Some tests failed, but app is running normally');
              }
            } catch (testError) {
              console.warn('⚠️ DEVELOPMENT: Test execution failed:', testError);
            }
          }, 1000);
        })
        .catch(() => {
          // Tests failed to load, continue silently
          console.log('🧪 DEVELOPMENT: Test module not available, skipping verification tests');
        });
    }
    } catch (renderError) {
      console.error('🚨 RENDER ERROR: Failed to render React app:', renderError);
      throw renderError;
    }
    
  } catch (error) {
    console.error('🚨 INITIALIZATION ERROR:', error);
    
    // Enhanced error analysis
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isLexicalError = errorMessage.includes("can't access lexical declaration") ||
                          errorMessage.includes("before initialization") ||
                          errorMessage.includes("Cannot access");
    
    if (isLexicalError) {
      console.error('🚨 DETECTED LEXICAL DECLARATION ERROR during initialization');
      console.error('🚨 This may be caused by timing issues in module loading or minification');
    }
    
    // Attempt to show a basic error message if possible
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          min-height: 100vh; 
          background: linear-gradient(135deg, #dc2626, #7f1d1d); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-family: system-ui;
          color: white;
          text-align: center;
          padding: 20px;
        ">
          <div style="max-width: 400px;">
            <div style="font-size: 4em; margin-bottom: 20px;">🚨</div>
            <h2 style="margin-bottom: 15px;">${isLexicalError ? 'JavaScript Loading Error' : 'Initialization Failed'}</h2>
            <p style="margin-bottom: 20px; opacity: 0.9;">
              ${isLexicalError 
                ? 'The game failed to load due to a JavaScript timing issue. This might be a temporary problem or browser compatibility issue.'
                : 'The game failed to load properly. This might be a temporary issue.'
              }
            </p>
            <button 
              onclick="window.location.reload()" 
              style="
                background: #ef4444; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                font-size: 16px; 
                cursor: pointer;
                transition: background-color 0.2s;
              "
              onmouseover="this.style.background='#dc2626'"
              onmouseout="this.style.background='#ef4444'"
            >
              Reload Game
            </button>
            ${isLexicalError ? `
              <div style="margin-top: 20px; padding: 12px; background: rgba(59, 130, 246, 0.2); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3);">
                <p style="font-size: 12px; opacity: 0.9;">
                  💡 If this keeps happening, try using a different browser or clearing your browser cache.
                </p>
              </div>
            ` : ''}
            ${process.env.NODE_ENV === 'development' ? `
              <details style="margin-top: 20px; text-align: left;">
                <summary style="cursor: pointer; opacity: 0.8;">Debug Info</summary>
                <pre style="
                  background: rgba(0,0,0,0.3); 
                  padding: 10px; 
                  border-radius: 4px; 
                  font-size: 12px; 
                  overflow: auto; 
                  max-height: 200px;
                  margin-top: 10px;
                ">${error instanceof Error ? error.stack : String(error)}</pre>
              </details>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    // Re-throw the error for further debugging
    throw error;
  }
}

// Start initialization with enhanced error handling
initializeApp().catch((error: unknown) => {
  console.error('🚨 CRITICAL: App initialization completely failed:', error);
  
  // Additional logging for lexical declaration errors
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes("can't access lexical declaration") ||
      errorMessage.includes("before initialization") ||
      errorMessage.includes("Cannot access")) {
    console.error('🚨 CRITICAL: This appears to be a lexical declaration error');
    console.error('🚨 CRITICAL: Possible causes:');
    console.error('  - Variable accessed before initialization (temporal dead zone)');
    console.error('  - Circular import dependencies');
    console.error('  - JavaScript minification issues in production build');
    console.error('  - Browser compatibility issues');
  }
});
