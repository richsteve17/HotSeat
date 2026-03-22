import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress known browser extension errors (e.g., TronLink, MetaMask) that clutter the console
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('tronLink') || e.message.includes('ethereum'))) {
    e.preventDefault();
    e.stopPropagation();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && (e.reason.message.includes('tronLink') || e.reason.message.includes('ethereum'))) {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
