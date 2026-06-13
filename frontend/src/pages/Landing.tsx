import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  ArrowRight, UserPlus, Check, Users, 
  Wallet, TrendingUp, Megaphone, ShieldCheck, Zap, FileSpreadsheet, 
  Receipt, ChevronRight, Star, Quote, Network, Landmark
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SectionHeader = ({ title, subtitle, light = false }: { title: string, subtitle: string, light?: boolean }) => (
  <div className="text-center mb-20" style={{ perspective: 1000 }}>
    <motion.div
      initial={{ opacity: 0, rotateX: 45, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
    >
      <h2 className={`text-sm font-black uppercase tracking-[0.5em] mb-4 ${light ? 'text-gold' : 'text-primary dark:text-gold'}`}>
        {subtitle}
      </h2>
      <h3 className={`text-4xl md:text-6xl font-black tracking-tighter ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
        {title}
      </h3>
      <div className={`w-24 h-1 mx-auto mt-8 rounded-full ${light ? 'bg-gold' : 'bg-primary dark:bg-gold'}`}></div>
    </motion.div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <div style={{ perspective: 1000 }}>
    <motion.div
      initial={{ opacity: 0, rotateX: -20, y: 50, z: -100 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0, z: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, type: "spring", bounce: 0.4 }}
      whileHover={{ scale: 1.05, rotateY: 5, rotateX: -5, z: 30 }}
      className="group bg-white dark:bg-ebony-card border border-slate-200 dark:border-white/5 p-10 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgba(37,99,235,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_40px_80px_rgba(255,215,0,0.1)] transition-all duration-300 relative overflow-hidden"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-gold/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-[2] transition-transform duration-700 ease-out"></div>
      <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
      <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-gold/10 flex items-center justify-center mb-8 group-hover:bg-primary dark:group-hover:bg-gold group-hover:text-white dark:group-hover:text-ebony transition-all duration-500">
        <Icon size={28} className="text-primary dark:text-gold group-hover:text-white dark:group-hover:text-ebony transition-colors" />
      </div>
      <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight group-hover:text-primary dark:group-hover:text-gold transition-colors duration-300">{title}</h4>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
    </motion.div>
  </div>
);

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const heroImages = [
    '/new_hero_image.png',
    '/new_hero_image_2.png',
    '/new_hero_image_3.png',
    '/new_hero_image_4.png'
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-x-hidden bg-slate-50 dark:bg-ebony transition-colors duration-500">
      
      {/* ── 1. HERO SECTION ────────────────────────── */}
      <section className="relative py-32 flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-white/5" style={{ perspective: 1000 }}>
        {/* Continuous Zoom Wrapper for Fading Images */}
        <motion.div 
          className="absolute inset-0 z-0"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        >
          {heroImages.map((imgSrc, index) => (
            <motion.div 
              key={imgSrc}
              className="absolute inset-0 z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: currentImageIndex === index ? 1 : 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              style={{ pointerEvents: currentImageIndex === index ? 'auto' : 'none' }}
            >
              {/* Blurred background to prevent white space */}
              <img 
                src={imgSrc} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-70"
              />
              {/* Actual image, fully visible without cutting sides, aligned to top */}
              <img 
                src={imgSrc} 
                alt={`Hero Background ${index + 1}`} 
                className="absolute inset-0 w-full h-full object-contain object-top"
              />
              <div className="absolute inset-0 bg-white/20 dark:bg-ebony/40"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 dark:from-transparent dark:via-transparent dark:to-ebony"></div>
            </motion.div>
          ))}
        </motion.div>

        <div className="max-w-5xl mx-auto px-8 w-full relative z-10 flex flex-col items-center text-center pt-20">
          <div className="space-y-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 100, rotateX: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
              className="flex flex-col items-center w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.h1 
                className="text-5xl lg:text-[80px] font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter mb-10 drop-shadow-[0_10px_30px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]" 
                style={{ transform: "translateZ(50px)" }}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.15, delayChildren: 0.5 }
                  }
                }}
              >
                <motion.span 
                  className="text-black dark:text-gold drop-shadow-lg block mb-2"
                  variants={{ hidden: { opacity: 0, y: 50, rotateX: 90 }, visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", bounce: 0.6 } } }}
                >
                  {t('common.hero_title_line1')}
                </motion.span>
                <motion.span 
                  className="block"
                  variants={{ hidden: { opacity: 0, y: 50, rotateX: -90 }, visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", bounce: 0.6 } } }}
                >
                  {t('common.hero_title_line2')}
                </motion.span>
              </motion.h1>
              
              <p className="text-xl text-slate-900 dark:text-slate-100 max-w-2xl leading-relaxed font-bold mb-12 drop-shadow-[0_2px_5px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] mx-auto">
                {t('common.hero_desc_landing')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center" style={{ transform: "translateZ(30px)" }}>
                <motion.button 
                  whileHover={{ scale: 1.05, rotateY: -10, z: 20 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')} 
                  className="flex items-center justify-center gap-4 bg-primary dark:bg-gold text-white dark:text-ebony px-10 py-5 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(37,99,235,0.3)] dark:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-300 group"
                >
                  {t('common.hero_btn_register')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05, rotateY: 10, z: 20 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')} 
                  className="flex items-center justify-center gap-4 bg-white/90 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white px-10 py-5 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:bg-white dark:hover:bg-white/20 shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300"
                >
                  {t('common.hero_btn_login')}
                </motion.button>
              </div>
            </motion.div>

            {/* Floating Stats */}
            <div className="grid grid-cols-3 gap-8 md:gap-16 pt-12 border-t border-slate-200 dark:border-white/10 w-full max-w-3xl mx-auto">
              {[
                              { label: t('common.hero_stat_members'), value: '45,000+' },
                { label: t('common.hero_stat_contributions'), value: '$2.4M' },
                { label: t('common.hero_stat_sectors'), value: '120+' }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <p className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</p>
                  <p className="text-[9px] text-primary dark:text-gold font-bold uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-50"
        >
          <span className="text-[9px] text-slate-500 dark:text-white font-black uppercase tracking-[0.4em]">{t('common.hero_scroll')}</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-slate-400 dark:from-white to-transparent"></div>
        </motion.div>
      </section>

      {/* ── 2. ABOUT SECTION ────────────────────────── */}
      <section id="about" className="py-40 bg-white dark:bg-ebony relative overflow-hidden transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-8 grid lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Animated glow background */}
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-amber-400/10 to-primary/20 dark:from-gold/20 dark:via-amber-300/10 dark:to-gold/20 rounded-[3rem] blur-2xl"
            />

            {/* Decorative tilted background card */}
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-amber-400/10 dark:from-gold/10 dark:to-amber-300/10 rounded-[3rem] rotate-2 translate-x-3 translate-y-2" />
            <div className="absolute -inset-4 border-2 border-primary/20 dark:border-gold/20 rounded-[3rem] -rotate-1 -translate-x-1" />

            {/* Main image container */}
            <div className="relative z-10 h-[650px] lg:h-[750px] rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(37,99,235,0.2)] dark:shadow-[0_40px_100px_rgba(212,175,55,0.15)]">
              <motion.img
                src="/new_about_image.png"
                alt="Leadership"
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {/* Luxury gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              {/* Gold shimmer line at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 dark:via-gold to-transparent opacity-80" />
              {/* Bottom label */}
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-[2px] bg-amber-400 dark:bg-gold rounded-full" />
                  <p className="text-white/90 text-xs font-black uppercase tracking-[0.3em]">Prosperity Party — Dire Dawa</p>
                </div>
              </div>
            </div>



            {/* Small decorative dot grid */}
            <div className="absolute -top-8 -left-8 w-24 h-24 opacity-20 dark:opacity-10 hidden lg:block"
              style={{ backgroundImage: 'radial-gradient(circle, #2563eb 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-sm font-black text-primary dark:text-gold uppercase tracking-[0.5em]">{t('common.about_label')}</h2>
            <h3 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
              {t('common.about_title')}
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {t('common.about_desc')}
            </p>
            
            <ul className="space-y-6 pt-4">
              {[
                t('common.about_item_1'),
                t('common.about_item_2'),
                t('common.about_item_3'),
                t('common.about_item_4')
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 group">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-gold/10 flex items-center justify-center group-hover:bg-primary dark:group-hover:bg-gold transition-colors">
                    <Check size={14} className="text-primary dark:text-gold group-hover:text-white dark:group-hover:text-ebony" />
                  </div>
                  <span className="text-slate-900 dark:text-white font-bold tracking-tight">{item}</span>
                </li>
              ))}
            </ul>

            <button className="flex items-center gap-3 text-primary dark:text-gold font-black uppercase tracking-widest text-xs mt-10 hover:gap-5 transition-all">
              {t('common.about_cta')} <ChevronRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── 3. FEATURES SECTION ─────────────────────── */}
      <section id="features" className="py-40 bg-slate-50 dark:bg-[#05070a] transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-8">
          <SectionHeader 
            subtitle={t('common.features_subtitle')} 
            title={t('common.features_title')} 
          />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={UserPlus} title={t('common.feat_reg_title')} desc={t('common.feat_reg_desc')} delay={0.1} />
            <FeatureCard icon={Wallet} title={t('common.feat_pay_title')} desc={t('common.feat_pay_desc')} delay={0.2} />
            <FeatureCard icon={TrendingUp} title={t('common.feat_analytics_title')} desc={t('common.feat_analytics_desc')} delay={0.3} />
            <FeatureCard icon={FileSpreadsheet} title={t('common.feat_export_title')} desc={t('common.feat_export_desc')} delay={0.4} />
            <FeatureCard icon={Megaphone} title={t('common.feat_announce_title')} desc={t('common.feat_announce_desc')} delay={0.5} />
            <FeatureCard icon={ShieldCheck} title={t('common.feat_admin_title')} desc={t('common.feat_admin_desc')} delay={0.6} />
            <FeatureCard icon={Network} title={t('common.feat_sector_title')} desc={t('common.feat_sector_desc')} delay={0.7} />
            <FeatureCard icon={Receipt} title={t('common.feat_receipt_title')} desc={t('common.feat_receipt_desc')} delay={0.8} />
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ─────────────────────────── */}
      <section className="py-40 bg-white dark:bg-ebony transition-colors duration-500 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 dark:bg-gold/5 -skew-x-12 translate-x-32"></div>
        </div>

        <div className="max-w-[1400px] mx-auto px-8 relative z-10">
          <SectionHeader subtitle={t('common.how_subtitle')} title={t('common.how_title')} />

          <div className="grid md:grid-cols-5 gap-12 relative">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 dark:via-gold/20 to-transparent hidden md:block"></div>
            
            {[
                          { step: '01', title: t('common.how_step1_title'), desc: t('common.how_step1_desc') },
              { step: '02', title: t('common.how_step2_title'), desc: t('common.how_step2_desc') },
              { step: '03', title: t('common.how_step3_title'), desc: t('common.how_step3_desc') },
              { step: '04', title: t('common.how_step4_title'), desc: t('common.how_step4_desc') },
              { step: '05', title: t('common.how_step5_title'), desc: t('common.how_step5_desc') }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center relative z-10 group"
              >
                <div className="w-20 h-20 rounded-full bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-8 group-hover:bg-primary dark:group-hover:bg-gold group-hover:border-primary dark:group-hover:border-gold group-hover:text-white dark:group-hover:text-ebony transition-all duration-500 shadow-lg dark:shadow-sm">
                  <span className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-white dark:group-hover:text-ebony">{item.step}</span>
                </div>
                <h4 className="text-xl font-black text-primary dark:text-gold mb-3 tracking-tight">{item.title}</h4>
                <p className="text-slate-500 dark:text-white/70 text-sm font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. STATISTICS SECTION ───────────────────── */}
      <section className="py-32 bg-slate-50 dark:bg-ebony-card relative overflow-hidden border-y border-slate-200 dark:border-white/5 transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
          {[
                        { label: t('common.stats_total_members'), value: '45.2K', suffix: '+' },
            { label: t('common.stats_annual_growth'), value: '24', suffix: '%' },
            { label: t('common.stats_registered_units'), value: '128', suffix: '' },
            { label: t('common.stats_monthly_traffic'), value: '100K', suffix: '+' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h3 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                {stat.value}<span className="text-primary/60 dark:text-gold/60">{stat.suffix}</span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-white/60 font-black uppercase tracking-[0.4em]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 6. WHY CHOOSE US ────────────────────────── */}
      <section className="py-40 bg-white dark:bg-ebony transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-8 grid lg:grid-cols-12 gap-20 items-center">
          <div className="lg:col-span-5 space-y-10">
            <h2 className="text-sm font-black text-primary dark:text-gold uppercase tracking-[0.5em]">{t('common.why_label')}</h2>
            <h3 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
              {t('common.why_title_line1')} <br /> {t('common.why_title_line2')}
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
              {t('common.why_desc')}
            </p>
            <div className="pt-8 space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="text-amber-600 dark:text-gold" />
                </div>
                <div>
                   <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">Maximum Security</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">AES-256 encryption for all member data and financial transactions.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="text-primary dark:text-blue-400" />
                </div>
                <div>
                   <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">High Performance</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Optimized for speed, handling thousands of simultaneous operations.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8 mt-12">
               <div className="bg-slate-50 dark:bg-ebony-card border border-slate-200 dark:border-white/5 p-12 rounded-[3rem] shadow-xl">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4">Centralized Control</h4>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Manage all branch units from a single, powerful administrative hub.</p>
               </div>
               <div className="bg-primary text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
                  <h4 className="text-xl font-black mb-4">Data Integrity</h4>
                  <p className="opacity-80 font-medium">Automated reconciliation ensures every cent is accounted for and reported correctly.</p>
               </div>
            </div>
            <div className="space-y-8">
               <div className="bg-slate-900 dark:bg-gold text-white dark:text-ebony p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 dark:bg-ebony/5 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
                  <h4 className="text-xl font-black mb-4">Mobile Ready</h4>
                  <p className="opacity-80 font-bold">Access the platform from any device, anywhere, with full responsiveness.</p>
               </div>
               <div className="bg-slate-50 dark:bg-ebony-card border border-slate-200 dark:border-white/5 p-12 rounded-[3rem] shadow-xl">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4">Institutional Audit</h4>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Ready-made reports for government and party audit requirements.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. TESTIMONIALS ─────────────────────────── */}
      <section className="py-40 bg-slate-50 dark:bg-[#05070a] relative overflow-hidden transition-colors duration-500">
        <SectionHeader subtitle={t('common.testimonials_subtitle')} title={t('common.testimonials_title')} />
        
        <div className="max-w-[1400px] mx-auto px-8 grid md:grid-cols-3 gap-12">
          {[
                        { name: t('common.testimonial1_name'), role: t('common.testimonial1_role'), content: t('common.testimonial1_content') },
            { name: t('common.testimonial2_name'), role: t('common.testimonial2_role'), content: t('common.testimonial2_content') },
            { name: t('common.testimonial3_name'), role: t('common.testimonial3_role'), content: t('common.testimonial3_content') }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="bg-white dark:bg-ebony-card p-12 rounded-[3rem] shadow-xl border border-slate-200 dark:border-white/5 relative"
            >
              <div className="text-amber-500 dark:text-gold mb-8 flex gap-1">
                {[1,2,3,4,5].map(s => <Star key={s} size={18} fill="currentColor" />)}
              </div>
              <Quote className="absolute top-12 right-12 text-primary/5 dark:text-primary/10 w-20 h-20" />
              <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic mb-10 relative z-10">
                "{item.content}"
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary font-black">
                    {item.name[0]}
                 </div>
                 <div>
                    <p className="text-slate-900 dark:text-white font-black">{item.name}</p>
                    <p className="text-[10px] text-primary dark:text-primary font-black uppercase tracking-widest">{item.role}</p>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 8. GALLERY / COMMUNITY ─────────────────── */}
      <section className="py-40 bg-white dark:bg-ebony transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-8">
        <SectionHeader subtitle={t('common.community_subtitle')} title={t('common.community_title')} />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[600px]">
            <motion.div 
              whileHover={{ scale: 0.98 }}
              className="md:col-span-8 relative overflow-hidden rounded-[3rem] group"
            >
               <img src="/luxury-community.png" alt="Community" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
               <div className="absolute inset-0 bg-gradient-to-t from-ebony/80 via-transparent to-transparent"></div>
               <div className="absolute bottom-12 left-12">
                  <h4 className="text-3xl font-black text-white tracking-tighter">{t('common.community_event')}</h4>
                  <p className="text-amber-400 dark:text-gold font-bold tracking-widest uppercase text-xs mt-2">{t('common.community_venue')}</p>
               </div>
            </motion.div>
            <div className="md:col-span-4 grid grid-rows-2 gap-8">
               <motion.div whileHover={{ scale: 0.98 }} className="relative overflow-hidden rounded-[3rem] group">
                  <img src="/hero_image.png" alt="Office" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-ebony/40 group-hover:bg-transparent transition-all"></div>
               </motion.div>
               <motion.div whileHover={{ scale: 0.98 }} className="relative overflow-hidden rounded-[3rem] group">
                  <img src="/new_about_image.png" alt="Workshop" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-ebony/40 group-hover:bg-transparent transition-all"></div>
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. CALL TO ACTION ───────────────────────── */}
      <section className="py-40 relative bg-slate-50 dark:bg-ebony transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-8">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-ebony-card p-20 md:p-32 rounded-[4rem] relative overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-20">
               <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full"></div>
               <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 dark:bg-gold/10 blur-[100px] rounded-full"></div>
            </div>

            <div className="relative z-10 text-center space-y-12">
               <h3 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                  {t('common.cta_title_line1')} <br /> {t('common.cta_title_line2')}
               </h3>
               <p className="text-xl text-slate-600 dark:text-white/70 max-w-2xl mx-auto font-medium">
                  {t('common.cta_desc')}
               </p>
               <div className="flex flex-col sm:flex-row gap-8 justify-center">
                  <button 
                    onClick={() => navigate('/login')}
                    className="px-12 py-6 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-full hover:scale-105 hover:bg-ebony transition-all shadow-xl"
                  >
                    {t('common.cta_btn_member')}
                  </button>
                  <button 
                    onClick={() => navigate('/login')}
                    className="px-12 py-6 bg-transparent border-2 border-primary text-primary dark:text-white font-black uppercase tracking-[0.2em] rounded-full hover:bg-primary hover:text-white transition-all"
                  >
                    {t('common.cta_btn_dashboard')}
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
