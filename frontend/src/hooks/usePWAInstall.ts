import { useState, useEffect, useCallback } from 'react';
import { getDeviceInfo, DeviceInfo } from '../utils/deviceDetection';
import { isAppInstalled } from '../utils/pwaHelpers';

type InstallStatus = 'idle' | 'promptable' | 'ios-guide' | 'desktop-guide' | 'installing' | 'installed' | 'dismissed' | 'unavailable' | 'failed';

interface UsePWAInstallReturn {
  install: () => Promise<boolean>;
  isInstallable: boolean;
  isInstalled: boolean;
  installStatus: InstallStatus;
  deferredPrompt: BeforeInstallPromptEvent | null;
  resetInstallState: () => void;
  deviceInfo: DeviceInfo;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalledState, setIsInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState<InstallStatus>('idle');
  const deviceInfo = getDeviceInfo();

  useEffect(() => {
    setIsInstalled(isAppInstalled());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setInstallStatus('promptable');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setInstallStatus('installed');
      window.dispatchEvent(new CustomEvent('app-installed'));
    };

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallStatus('installed');
      } else {
        setIsInstalled(isAppInstalled());
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    if (!deviceInfo.supportsBeforeInstallPrompt && deviceInfo.isIOS) {
      setIsInstallable(true);
      setInstallStatus('ios-guide');
    }

    if (!deviceInfo.supportsBeforeInstallPrompt && deviceInfo.isDesktop && deviceInfo.isSupportedBrowser) {
      setIsInstallable(true);
      setInstallStatus('desktop-guide');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [deviceInfo.supportsBeforeInstallPrompt, deviceInfo.isIOS, deviceInfo.isDesktop, deviceInfo.isSupportedBrowser]);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      setInstallStatus('unavailable');
      return false;
    }

    deferredPrompt.prompt();
    setInstallStatus('installing');

    try {
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setInstallStatus('installed');
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        setInstallStatus('dismissed');
        setTimeout(() => setInstallStatus('promptable'), 3000);
        return false;
      }
    } catch {
      setInstallStatus('failed');
      return false;
    }
  }, [deferredPrompt]);

  const resetInstallState = useCallback(() => {
    setInstallStatus('idle');
    setIsInstallable(false);
    setDeferredPrompt(null);
  }, []);

  return {
    install,
    isInstallable,
    isInstalled: isInstalledState,
    installStatus,
    deferredPrompt,
    resetInstallState,
    deviceInfo
  };
}
