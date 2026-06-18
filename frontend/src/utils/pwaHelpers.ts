export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    console.log('[PWA] Service worker registered:', registration.scope);

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          const event = new CustomEvent('sw-update-available', {
            detail: { registration }
          });
          window.dispatchEvent(event);
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[PWA] Service worker unregistered');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function checkForSWUpdate(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    await registration.update();
    return registration;
  } catch {
    return null;
  }
}

export async function subscribeToPushNotifications(vapidPublicKey?: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[PWA] Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (subscription) return subscription;

    if (!vapidPublicKey) {
      console.warn('[PWA] VAPID public key not provided');
      return null;
    }

    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as unknown as BufferSource
    });

    console.log('[PWA] Push subscription created');
    return subscription;
  } catch {
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export function isAppInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as any).standalone);
}

export function getInstallInstructions(os: string): string {
  const instructions: Record<string, string> = {
    android: 'Open Chrome, tap the menu (three dots), select "Install app" or "Add to Home screen".',
    ios: 'Open Safari, tap the Share button, select "Add to Home Screen", then tap "Add".',
    windows: 'Open Edge/Chrome, click the install icon in the address bar, or menu → "Install Membership Fee Management System".',
    macos: 'Open Safari/Chrome, click the share/install icon in the address bar, or menu → "Install".',
    linux: 'Open Chrome/Edge, click the install icon in the address bar, or menu → "Install".',
    chromeos: 'Open Chrome, click the install icon in the address bar, or menu → "Install".'
  };
  return instructions[os] || instructions.windows;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
