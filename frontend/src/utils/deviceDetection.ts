export interface DeviceInfo {
  os: string;
  browser: string;
  deviceType: string;
  isAndroid: boolean;
  isIOS: boolean;
  isIPhone: boolean;
  isIPad: boolean;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isChromeOS: boolean;
  isStandalone: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSupportedBrowser: boolean;
  supportsBeforeInstallPrompt: boolean;
}

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent || navigator.vendor || '';
  const platform = navigator.platform || '';

  const isAndroid = /android/i.test(ua);
  const isMac = /macintosh|mac os x/i.test(ua);
  const isIPhone = /iphone|ipod/i.test(ua);
  const isIPad = /ipad/i.test(ua) || (isMac && navigator.maxTouchPoints > 1);
  const isIOS = isIPhone || isIPad;
  const isWindows = /win(dows|32|64)/i.test(platform) || /windows/i.test(ua);
  const isLinux = /linux/i.test(platform) && !isAndroid;
  const isChromeOS = /cros/i.test(platform) || /crOS/i.test(ua);

  let deviceType = 'desktop';
  let os = 'unknown';
  let browser = 'unknown';

  if (isAndroid) { os = 'android'; deviceType = navigator.maxTouchPoints > 1 ? 'tablet' : 'phone'; }
  else if (isIPhone) { os = 'ios'; deviceType = 'phone'; }
  else if (isIPad) { os = 'ios'; deviceType = 'tablet'; }
  else if (isMac) { os = 'macos'; deviceType = 'desktop'; }
  else if (isWindows) { os = 'windows'; deviceType = 'desktop'; }
  else if (isLinux) { os = 'linux'; deviceType = 'desktop'; }
  else if (isChromeOS) { os = 'chromeos'; deviceType = 'desktop'; }

  if (/chrome/i.test(ua) && !/edge|opr|brave/i.test(ua)) browser = 'chrome';
  else if (/edge/i.test(ua)) browser = 'edge';
  else if (/firefox/i.test(ua)) browser = 'firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'safari';
  else if (/opr|opera/i.test(ua)) browser = 'opera';
  else if (/brave/i.test(ua)) browser = 'brave';

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as any).standalone);

  return {
    os, browser, deviceType,
    isAndroid, isIOS, isIPhone, isIPad, isMac, isWindows, isLinux, isChromeOS,
    isStandalone,
    isMobile: deviceType === 'phone',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isSupportedBrowser: ['chrome', 'edge', 'brave', 'opera', 'safari'].includes(browser),
    supportsBeforeInstallPrompt: !isIOS && 'onbeforeinstallprompt' in window,
  };
}

export function getPlatformInstallUrl(os: string): string {
  switch (os) {
    case 'android': return 'https://play.google.com/store/apps/details?id=com.ppdiredawa.mfms';
    case 'windows': return 'https://apps.microsoft.com/store/detail/pp-diredawa-mfms/';
    case 'macos': return 'https://apps.apple.com/app/pp-diredawa-mfms/';
    case 'linux': return 'https://snapcraft.io/pp-diredawa-mfms';
    default: return '#';
  }
}

export function getIOSInstallGuide(): { steps: { icon: string; title: string; description: string }[]; imagePlaceholder: string } {
  return {
    steps: [
      {
        icon: 'ShareIcon',
        title: 'Tap the Share button',
        description: 'Located at the bottom of Safari (on iPhone) or top right (on iPad).'
      },
      {
        icon: 'PlusIcon',
        title: 'Select Add to Home Screen',
        description: 'Scroll down in the share menu and tap "Add to Home Screen".'
      },
      {
        icon: 'CheckIcon',
        title: 'Tap Add',
        description: 'Confirm by tapping "Add" in the top right corner.'
      }
    ],
    imagePlaceholder: '/icons/ios-install-guide.png'
  };
}
