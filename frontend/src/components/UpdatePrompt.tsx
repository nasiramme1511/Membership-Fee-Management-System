import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download } from 'lucide-react';

interface Props {
  updateAvailable: boolean;
  onUpdate: () => void;
}

export default function UpdatePrompt({ updateAvailable, onUpdate }: Props) {
  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-6 left-1/2 z-[300] w-[90vw] max-w-sm"
        >
          <div className="bg-slate-900 dark:bg-slate-800 border border-slate-700 dark:border-slate-600 rounded-2xl p-4 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
                <Download className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-xs">New version available</p>
                <p className="text-[10px] text-slate-400">Update to get the latest features</p>
              </div>
            </div>
            <button
              onClick={onUpdate}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold hover:bg-gold-600 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update Now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
