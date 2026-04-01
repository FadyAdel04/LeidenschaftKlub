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
import { TranslationProvider } from 'react-autolocalise';
import './index.css';

const defaultLang = localStorage.getItem('selected_language') || 'en';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TranslationProvider
      config={{
        apiKey: 'at_20a28606254441ab8795643a2e133539',
        sourceLocale: 'en',
        targetLocale: defaultLang,
      }}
    >
      <AuthProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </AuthProvider>
    </TranslationProvider>
  </StrictMode>
);
