import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { pwa } from './lib/pwa';
import { initPwaAnalytics } from './lib/pwaAnalytics';
import './index.css';

// Register PWA Service Worker for offline access and caching
pwa.registerServiceWorker();
initPwaAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Gracefully dismiss HTML startup splash screen immediately upon React hydration
try {
  const splash = document.getElementById('scalora-splash');
  if (splash) {
    splash.style.transition = 'opacity 200ms ease, transform 200ms ease';
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    setTimeout(() => {
      splash.remove();
    }, 220);
  }
} catch (_) {}

