import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>((window as any).__pwa_prompt || null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIos);

    // Check if app is already installed
    if ((window as any).matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const checkPrompt = () => {
      if ((window as any).__pwa_prompt) {
        setDeferredPrompt((window as any).__pwa_prompt);
      }
    };

    window.addEventListener('pwa-available', checkPrompt);
    checkPrompt();

    return () => window.removeEventListener('pwa-available', checkPrompt);
  }, []);

  const installApp = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        (window as any).__pwa_prompt = null;
      }
    } else if (isIOS) {
      alert("To install: Tap the Share button in your browser's bottom bar, then select 'Add to Home Screen'.");
    }
  };

  // The button should show if we have a prompt OR if it's iOS (manual instructions)
  // Hide if already installed.
  const showInstall = !isInstalled && (Boolean(deferredPrompt) || isIOS);

  return { deferredPrompt: showInstall ? true : null, installApp };
}
