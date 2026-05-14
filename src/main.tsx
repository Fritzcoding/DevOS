import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[Main] Starting DevOps Lite...');

// Debug window state in development
if (process.env.NODE_ENV === 'development') {
  console.log('[Main] Debug mode enabled');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

console.log('[Main] Mounting React app...');
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

console.log('[Main] React app mounted successfully');
