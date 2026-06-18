import { useState } from 'react';
import { Download, Smartphone, Monitor, CheckCircle, X } from 'lucide-react';
import usePWAInstall from '../hooks/usePWAInstall';
import { getDeviceInfo } from '../utils/deviceDetection';
import InstallGuideModal from './InstallGuideModal';

export default function InstallAppButton() {
  const { install, isInstallable, isInstalled, installStatus, deviceInfo } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const info = getDeviceInfo();

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        <CheckCircle className="w-3.5 h-3.5" />
        App Installed
      </div>
    );
  }

  if (!isInstallable) return null;

  const handleInstall = async () => {
    if (info.isIOS) {
      setShowGuide(true);
      return;
    }

    if (deviceInfo.supportsBeforeInstallPrompt) {
      const result = await install();
      if (result) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    } else {
      setShowGuide(true);
    }
  };

  const getLabel = () => {
    if (installStatus === 'installing') return 'Installing...';
    if (installStatus === 'dismissed') return 'Tap to try again';
    if (info.isIOS) return 'Install on iPhone/iPad';
    if (info.isAndroid) return 'Install on Android';
    return 'Install App';
  };

  const getIcon = () => {
    if (info.isMobile || info.isTablet) return <Smartphone className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <>
      <button
        onClick={handleInstall}
        disabled={installStatus === 'installing'}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-600 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-gold/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {installStatus === 'installing' ? (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          getIcon()
        )}
        {getLabel()}
        <Download className="w-3.5 h-3.5" />
      </button>

      {showToast && (
        <div className="fixed bottom-24 right-6 z-50 animate-fade-in-up">
          <div className="flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-bold">
            <CheckCircle className="w-4 h-4" />
            App installed successfully!
            <button onClick={() => setShowToast(false)} className="ml-2 hover:text-white/80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <InstallGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        deviceInfo={info}
      />
    </>
  );
}
