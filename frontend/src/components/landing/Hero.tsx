import { motion } from 'framer-motion';
import { ChevronDown, Award, Users, Building2, Wallet, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface HeroProps {
  stats: {
    totalMembers: number;
    totalPayments: number;
    totalRevenue: number;
    totalSectors: number;
    collectionRate: number;
  };
  content: Record<string, string>;
  heroBg: string;
}

export default function Hero({ stats, content, heroBg }: HeroProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroBg || '/photos/building.jpg'}
          alt={t('hero.subtitle')}
          className="w-full h-full object-cover scale-100"
          onError={(e) => { (e.target as HTMLImageElement).src = '/photos/building.jpg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/70"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.06),transparent_60%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/25 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.25em]">
              <Award className="w-3.5 h-3.5" />
              {t('hero.badge')}
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight font-outfit">
                {content.hero_title || t('hero.subtitle')}
              </h1>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#D4AF37] tracking-tight font-outfit uppercase">
                {content.hero_subtitle || t('hero.branch')}
              </h2>
            </div>
            
            <h3 className="text-lg sm:text-xl font-bold text-white/90">
              {t('hero.title')}
            </h3>
            
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl">
              {content.hero_description || t('hero.description')}
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <button onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-[#D4AF37] text-slate-950 font-black rounded-xl hover:bg-[#c39e2e] transition-all duration-300 shadow-2xl shadow-[#D4AF37]/20 text-xs uppercase tracking-wider">
                {t('hero.cta_login')}
              </button>
              <button onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-[#0B5D3B] text-white font-black rounded-xl hover:bg-[#094a2f] border border-[#0B5D3B] transition-all duration-300 shadow-2xl shadow-[#0B5D3B]/20 text-xs uppercase tracking-wider">
                {t('hero.cta_register')}
              </button>
              <a href="#about"
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 border border-white/20 text-white font-bold rounded-xl hover:border-white/50 hover:bg-white/10 transition-all duration-300 text-xs uppercase tracking-wider">
                {t('hero.cta_learn')}
                <ChevronDown className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h4 className="text-white/80 font-black text-[11px] uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-4">
                {t('landing.stats_title')}
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Users className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('hero.stat_members')}</span>
                  </div>
                  <div className="text-2xl font-black text-white font-outfit">
                    {stats.totalMembers.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Building2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('hero.stat_sectors')}</span>
                  </div>
                  <div className="text-2xl font-black text-white font-outfit">
                    {stats.totalSectors.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Wallet className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('hero.stat_revenue')}</span>
                  </div>
                  <div className="text-2xl font-black text-white font-outfit">
                    {formatCurrency(stats.totalRevenue)} <span className="text-xs text-gray-400 font-bold">ETB</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('hero.stat_collection')}</span>
                  </div>
                  <div className="text-2xl font-black text-[#10B981] font-outfit">
                    {stats.collectionRate}%
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2.5 text-xs text-gray-400 bg-white/5 rounded-xl p-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{t('hero.database_status')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <a href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors duration-300">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em]">{t('hero.scroll_down')}</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </a>
    </section>
  );
}
