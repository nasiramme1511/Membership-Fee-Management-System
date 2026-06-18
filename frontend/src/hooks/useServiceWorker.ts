import { useState, useEffect, useCallback } from 'react';
import { registerServiceWorker } from '../utils/pwaHelpers';

interface UseServiceWorkerReturn {
  registration: ServiceWorkerRegistration | null;
  isRegistered: boolean;
  updateAvailable: boolean;
  waitingWorker: ServiceWorker | null;
  registrationError: string | null;
  isOnline: boolean;
  applyUpdate: () => void;
  checkForUpdate: () => Promise<void>;
}

export default function useServiceWorker(): UseServiceWorkerReturn {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let mounted = true;

    const initSW = async () => {
      try {
        const reg = await registerServiceWorker();
        if (!mounted) return;

        if (reg) {
          setRegistration(reg);
          setIsRegistered(true);

          if (reg.waiting) {
            setUpdateAvailable(true);
            setWaitingWorker(reg.waiting);
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (!mounted) return;

              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setWaitingWorker(newWorker);
              }

              if (newWorker.state === 'activated') {
                setUpdateAvailable(false);
                setWaitingWorker(null);
              }
            });
          });
        }
      } catch (error) {
        if (mounted) {
          console.error('[SW Hook] Registration error:', error);
          setRegistrationError(error instanceof Error ? error.message : String(error));
        }
      }
    };

    initSW();

    const handleSWUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { registration: reg } = customEvent.detail;
      if (reg && reg.waiting) {
        setUpdateAvailable(true);
        setWaitingWorker(reg.waiting);
      }
    };

    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      setWaitingWorker(null);
      window.location.reload();
    }
  }, [waitingWorker]);

  const checkForUpdate = useCallback(async () => {
    if (registration) {
      try {
        await registration.update();
      } catch {
        console.error('[SW Hook] Update check failed');
      }
    }
  }, [registration]);

  return {
    registration,
    isRegistered,
    updateAvailable,
    waitingWorker,
    registrationError,
    isOnline,
    applyUpdate,
    checkForUpdate,
  };
}
