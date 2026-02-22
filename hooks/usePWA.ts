import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
  swVersion: string | null;
}

interface PWAActions {
  install: () => Promise<boolean>;
  dismissInstall: () => void;
  applyUpdate: () => void;
}

let deferredPrompt: any = null;

export function usePWA(): PWAState & PWAActions {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [swVersion, setSwVersion] = useState<string | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // ── Detect if already installed ──
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    // ── Online/Offline ──
    const handleOnline  = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    // ── Install prompt ──
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // ── Installed ──
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPrompt = null;
    };
    window.addEventListener('appinstalled', handleInstalled);

    // ── Service Worker registration ──
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => {
          setRegistration(reg);

          // Check for waiting SW (= update available)
          if (reg.waiting) {
            setHasUpdate(true);
          }

          // New SW found while app is open
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setHasUpdate(true);
              }
            });
          });

          // Ask SW for its version
          if (reg.active) {
            reg.active.postMessage({ type: 'GET_VERSION' });
          }
        })
        .catch(err => console.warn('[PWA] SW registration failed:', err));

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'VERSION') {
          setSwVersion(event.data.version);
        }
        if (event.data?.type === 'SYNC_COMPLETE') {
          console.log('[PWA] Background sync complete');
        }
      });
    }

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  // ── Install ──
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setIsInstallable(false);
    return outcome === 'accepted';
  }, []);

  const dismissInstall = useCallback(() => {
    setIsInstallable(false);
    // Suppress for 7 days
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  }, []);

  // ── Apply SW update ──
  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setHasUpdate(false);
    window.location.reload();
  }, [registration]);

  return {
    isInstallable,
    isInstalled,
    isOffline,
    hasUpdate,
    swVersion,
    install,
    dismissInstall,
    applyUpdate,
  };
}

// ── URL Shortcut Handler ──────────────────────────────────────────────────────
// Reads ?action= param from PWA shortcuts in manifest
export function useShortcutAction(): string | null {
  const [action, setAction] = useState<string | null>(() => {
    const url = new URL(window.location.href);
    const a = url.searchParams.get('action');
    if (a) {
      // Clean URL without reload
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }
    return a;
  });

  const clearAction = useCallback(() => setAction(null), []);

  return action;
}
