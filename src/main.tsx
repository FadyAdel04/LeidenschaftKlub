// Stash the PWA prompt as early as possible
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwa_prompt = e;
  window.dispatchEvent(new Event('pwa-available'));
});

// Register a basic service worker for PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        // fail silently
    });
  });
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </AuthProvider>
  </StrictMode>
);
