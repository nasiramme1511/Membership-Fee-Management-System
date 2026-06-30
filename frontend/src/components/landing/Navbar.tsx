import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, ChevronDown, ExternalLink, Users } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';

interface NavbarProps {
  scrolled: boolean;
  navLinks: { name: string; href: string }[];
}

export default function Navbar({ scrolled, navLinks }: NavbarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('#hero');
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLoginDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white border-b-2 border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-[96px]">

            {/* ── Logo + Brand ── */}
            <a href="#hero" className="flex items-center gap-4 group flex-shrink-0">
              {/* Logo */}
              <div className="w-[80px] h-[80px] flex-shrink-0 flex items-center justify-center">
                <img
                  src="/pp-logo.png"
                  alt="Prosperity Party"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>

              {/* Vertical divider */}
              <div className="w-[2px] h-10 bg-gradient-to-b from-[#0B5D3B] to-[#D4AF37] rounded-full opacity-40" />

              {/* Brand text */}
              <div className="flex flex-col gap-0.5">
                <span className="font-black text-[18px] leading-tight tracking-tight text-slate-900 font-outfit group-hover:text-[#0B5D3B] transition-colors duration-300">
                  Prosperity Party
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#0B5D3B]">
                  Dire Dawa Branch Office
                </span>
                <span className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Membership Fee App
                </span>
              </div>
            </a>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setActiveLink(link.href)}
                  className={`relative px-5 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.2em] transition-all duration-300 rounded-xl group ${
                    activeLink === link.href
                      ? 'text-[#0B5D3B] bg-[#0B5D3B]/5'
                      : 'text-slate-500 hover:text-[#0B5D3B] hover:bg-[#0B5D3B]/5'
                  }`}
                >
                  {link.name}
                  <span className={`absolute bottom-1 left-4 right-4 h-[2px] rounded-full bg-[#0B5D3B] transition-all duration-300 ${
                    activeLink === link.href
                      ? 'opacity-100 scale-x-100'
                      : 'opacity-0 scale-x-0 group-hover:opacity-50 group-hover:scale-x-100'
                  }`} />
                </a>
              ))}
            </div>

            {/* ── Right Actions ── */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />

              <div className="relative hidden sm:block" ref={dropdownRef}>
                <motion.button
                  onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B5D3B] hover:bg-[#094d31] text-white font-black rounded-xl text-[12px] uppercase tracking-[0.15em] transition-all duration-300 shadow-lg shadow-[#0B5D3B]/20 hover:shadow-[#0B5D3B]/40"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${loginDropdownOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {loginDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                  >
                    <button
                      onClick={() => { navigate('/login'); setLoginDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left text-sm font-bold text-slate-700 hover:bg-[#0B5D3B]/5 hover:text-[#0B5D3B] transition-colors border-b border-slate-100"
                    >
                      <Users className="w-4 h-4 text-[#0B5D3B]" />
                      <span>
                        <span className="block">Membership Management</span>
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Manage member fees &amp; records</span>
                      </span>
                    </button>
                    <button
                      onClick={() => { window.open('#', '_blank'); setLoginDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left text-sm font-bold text-slate-700 hover:bg-[#0B5D3B]/5 hover:text-[#0B5D3B] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-[#0B5D3B]" />
                      <span>
                        <span className="block">Resource Management</span>
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Manage resources &amp; inventory</span>
                      </span>
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Mobile menu */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Fullscreen Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white flex flex-col"
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img src="/pp-logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                <div>
                  <div className="font-black text-slate-900 text-base font-outfit">Prosperity Party</div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#0B5D3B]">Dire Dawa Branch</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile links */}
            <div className="flex-1 flex flex-col px-6 py-8 gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center py-4 px-4 text-sm font-black text-slate-700 uppercase tracking-[0.2em] hover:text-[#0B5D3B] hover:bg-[#0B5D3B]/5 rounded-xl transition-all border-b border-slate-50 font-outfit"
                >
                  {link.name}
                </motion.a>
              ))}
            </div>

            <div className="px-6 pb-8 flex flex-col gap-2">
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="w-full py-4 bg-[#0B5D3B] text-white font-black uppercase tracking-[0.2em] rounded-xl text-sm flex items-center justify-center gap-3 hover:bg-[#094d31] transition-colors shadow-lg"
              >
                <Users className="w-4 h-4" />
                Membership Management
              </button>
              <button
                onClick={() => { window.open('#', '_blank'); setMobileMenuOpen(false); }}
                className="w-full py-4 border-2 border-[#0B5D3B] text-[#0B5D3B] font-black uppercase tracking-[0.2em] rounded-xl text-sm flex items-center justify-center gap-3 hover:bg-[#0B5D3B]/5 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Resource Management
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
