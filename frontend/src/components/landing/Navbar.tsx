import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';

interface NavbarProps {
  scrolled: boolean;
  navLinks: { name: string; href: string }[];
}

export default function Navbar({ scrolled, navLinks }: NavbarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-lg shadow-black/5 py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3 group">
            <div className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-500 flex-shrink-0 ${
              scrolled ? 'border-[#0B5D3B] shadow-sm' : 'border-white/80'
            }`}>
              <img src="/pp-logo.png" alt={t('nav.home')} className="w-full h-full object-contain bg-white" />
            </div>
            <div className="flex flex-col">
              <div className={`font-black text-sm leading-tight tracking-tight font-outfit transition-colors duration-500 ${
                scrolled ? 'text-gray-900 dark:text-white' : 'text-white'
              }`}>
                {t('common.prosperity_party')}
              </div>
              <div className={`text-[9px] font-bold uppercase tracking-[0.25em] transition-colors duration-500 ${
                scrolled ? 'text-[#D4AF37]' : 'text-white/80'
              }`}>
                {t('hero.branch')}
              </div>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <a key={link.name} href={link.href}
                className={`px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.15em] transition-all duration-300 relative group rounded-lg ${
                  scrolled 
                    ? 'text-gray-600 dark:text-gray-300 hover:text-[#0B5D3B] dark:hover:text-[#D4AF37] hover:bg-[#0B5D3B]/5' 
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}>
                {link.name}
                <span className={`absolute -bottom-0.5 left-4 right-4 h-0.5 rounded-full transition-all duration-300 scale-x-0 group-hover:scale-x-100 ${
                  scrolled ? 'bg-[#0B5D3B] dark:bg-[#D4AF37]' : 'bg-[#D4AF37]'
                }`}></span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button onClick={() => navigate('/login')}
              className={`px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center ${
                scrolled
                  ? 'text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:border-[#0B5D3B] hover:text-[#0B5D3B] dark:hover:text-[#D4AF37]'
                  : 'text-white border border-white/40 hover:border-white hover:bg-white/10'
              }`}>
              <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
              {t('nav.login')}
            </button>
            <button onClick={() => navigate('/login')}
              className={`px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 shadow-lg ${
                scrolled
                  ? 'bg-[#0B5D3B] text-white hover:bg-[#094a2f] shadow-[#0B5D3B]/20'
                  : 'bg-[#D4AF37] text-gray-900 hover:bg-[#c39e2e] shadow-[#D4AF37]/30'
              }`}>
              {t('nav.register')}
            </button>
            <button onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                scrolled ? 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-900' : 'text-white hover:bg-white/10'
              }`}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center"
          >
            <button onClick={() => setMobileMenuOpen(false)}
              className="absolute top-6 right-6 text-white/80 hover:text-white p-2 transition-colors">
              <X className="w-8 h-8" />
            </button>
            <div className="flex flex-col items-center gap-4">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-xl font-bold text-white uppercase tracking-widest py-2 hover:text-[#D4AF37] transition-colors font-outfit"
                >
                  {link.name}
                </motion.a>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-4 mt-10"
            >
              <button onClick={() => navigate('/login')}
                className="px-6 py-3 border border-white/30 text-white font-bold uppercase tracking-wider rounded-lg text-xs hover:bg-white hover:text-gray-900 transition-all">
                {t('nav.login')}
              </button>
              <button onClick={() => navigate('/login')}
                className="px-6 py-3 bg-[#D4AF37] text-gray-900 font-bold uppercase tracking-wider rounded-lg text-xs hover:bg-[#c39e2e] transition-all">
                {t('nav.register')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
