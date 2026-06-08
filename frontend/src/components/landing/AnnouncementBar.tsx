import { useState } from 'react';
import { AlertCircle, X, ChevronRight } from 'lucide-react';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="bg-[#0B5D3B] text-white relative z-[60]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AlertCircle className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
          <p className="text-[10px] font-bold tracking-widest uppercase truncate">
            Official Portal — Prosperity Party Dire Dawa Branch — Digital Governance Platform v2.5
          </p>
          <span className="hidden sm:flex items-center gap-1 text-[#D4AF37] text-[10px] font-bold cursor-pointer hover:text-white transition-colors whitespace-nowrap">
            Learn More <ChevronRight className="w-3 h-3" />
          </span>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="hidden md:block text-[9px] text-white/60 font-mono">{dateStr}</span>
          <button
            onClick={() => setVisible(false)}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Close announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
