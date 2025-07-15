import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeViewportHeight } from './lib/viewport.ts'

// Initialize viewport height calculation for mobile devices
initializeViewportHeight();

createRoot(document.getElementById("root")!).render(<App />);
