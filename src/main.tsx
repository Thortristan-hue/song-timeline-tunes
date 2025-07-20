import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeViewportHeight } from './lib/viewport.ts'

// Enhanced initialization with error handling
async function initializeApp() {
  try {
    console.log('🚀 INITIALIZATION: Starting app initialization...');
    
    // Initialize viewport height calculation for mobile devices
    initializeViewportHeight();
    console.log('✅ INITIALIZATION: Viewport height initialized');
    
    // Ensure DOM is ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }
    console.log('✅ INITIALIZATION: DOM ready');
    
    // Get root element with error handling
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found - critical DOM error');
    }
    console.log('✅ INITIALIZATION: Root element found');
    
    // Create and render React app with enhanced error handling
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log('✅ INITIALIZATION: React app rendered successfully');
    
  } catch (error) {
    console.error('🚨 INITIALIZATION ERROR:', error);
    
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
            <h2 style="margin-bottom: 15px;">Initialization Failed</h2>
            <p style="margin-bottom: 20px; opacity: 0.9;">
              The game failed to load properly. This might be a temporary issue.
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

// Start initialization
initializeApp().catch(error => {
  console.error('🚨 CRITICAL: App initialization completely failed:', error);
});
