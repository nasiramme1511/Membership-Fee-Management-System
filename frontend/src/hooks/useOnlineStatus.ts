import { useState, useEffect } from 'react';

interface UseOnlineStatusReturn {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  lastOnlineTime: Date;
  lastOfflineTime: Date | null;
}

export default function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState(new Date());
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setLastOnlineTime(new Date());
      window.dispatchEvent(new CustomEvent('app-online'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastOfflineTime(new Date());
      window.dispatchEvent(new CustomEvent('app-offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(() => setWasOffline(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    lastOnlineTime,
    lastOfflineTime,
  };
}
