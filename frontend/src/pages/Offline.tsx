import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Clock, AlertTriangle, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useOnlineStatus from '../hooks/useOnlineStatus';

export default function Offline() {
  const { isOnline, lastOnlineTime, lastOfflineTime } = useOnlineStatus();
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);
  const [timeSinceOffline, setTimeSinceOffline] = useState('');

  useEffect(() => {
    if (isOnline) {
      navigate('/', { replace: true });
    }
  }, [isOnline, navigate]);

  useEffect(() => {
    const updateTime = () => {
      if (lastOfflineTime) {
        const diff = Math.floor((Date.now() - lastOfflineTime.getTime()) / 1000);
        if (diff < 60) setTimeSinceOffline('Just now');
        else if (diff < 3600) setTimeSinceOffline(`${Math.floor(diff / 60)}m ago`);
        else if (diff < 86400) setTimeSinceOffline(`${Math.floor(diff / 3600)}h ago`);
        else setTimeSinceOffline(`${Math.floor(diff / 86400)}d ago`);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [lastOfflineTime]);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
        >
          <WifiOff className="w-12 h-12 text-amber-400" />
        </motion.div>

        <h1 className="text-3xl font-black text-white mb-3 font-outfit">No Connection</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          You're currently offline. Some features may be unavailable until you reconnect to the internet.
        </p>

        <div className="space-y-3 mb-8">
          {lastOfflineTime && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              Offline since: {timeSinceOffline}
            </div>
          )}
          {lastOnlineTime && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Globe className="w-3.5 h-3.5" />
              Last online: {lastOnlineTime.toLocaleTimeString()}
            </div>
          )}
        </div>

        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gold hover:bg-gold-600 text-black font-bold text-sm rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Reconnecting...' : 'Try Again'}
        </button>

        <div className="mt-8 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-slate-400 text-left leading-relaxed">
              Cached data is still available. Any changes you made while offline will be synced when you reconnect.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
