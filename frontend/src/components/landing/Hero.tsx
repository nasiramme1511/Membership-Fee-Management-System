import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

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
  galleryImages?: any[];
}

export default function Hero({ stats, content, heroBg, galleryImages = [] }: HeroProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return amount.toLocaleString();
  };

  const heroImages = [
    '/new_hero_image.png',
    '/new_hero_image_2.png',
    '/new_hero_image_3.png',
    '/photos/image1.png',
    '/photos/image2.png',
    '/photos/image3.png'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="hero" className="relative min-h-[calc(100vh-100px)] flex flex-col justify-center overflow-hidden bg-slate-950">
      {/* Hero background container with 15s continuous breathing zoom */}
      <motion.div
        className="absolute inset-0 bg-black overflow-hidden"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Fading slideshow — bg-cover fills container without black bars on any screen */}
        {heroImages.map((src, index) => (
          <motion.div
            key={index}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${src})` }}
            animate={{ opacity: index === currentImageIndex ? 1 : 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        ))}

        {/* Luxury gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/10 via-slate-900/5 to-emerald-950/8" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/15" />

        {/* Decorative top light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-radial from-emerald-400/15 to-transparent blur-3xl opacity-60" />

        {/* Bottom luxury fade */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-900/30 via-slate-900/10 to-transparent" />
      </motion.div>

      {/* Animated background elements */}
      <motion.div 
        className="absolute top-20 right-10 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-20 left-10 w-80 h-80 bg-green-500/10 rounded-full filter blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
      />

      {/* Main centered content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-4 sm:px-6 lg:px-8 pt-32 pb-16 [perspective:1000px]">
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, type: "spring", stiffness: 80 }}
          className="max-w-5xl mx-auto space-y-8 [transform-style:preserve-3d]"
        >

          {/* Party name & branch */}
          <div className="space-y-3 [transform-style:preserve-3d]">
            <motion.p 
              initial={{ opacity: 0, z: -100 }}
              animate={{ opacity: 1, z: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-sm sm:text-lg font-black uppercase tracking-[0.4em] text-white drop-shadow-2xl filter brightness-110"
            >
              PROSPERITY PARTY
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-white drop-shadow-lg filter brightness-105"
            >
              DIRE DAWA BRANCH OFFICE
            </motion.p>
          </div>

          {/* Main heading - luxury typography */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="[transform-style:preserve-3d]"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight font-outfit drop-shadow-2xl filter brightness-125">
              <span className="text-white drop-shadow-2xl inline-block [transform:translateZ(50px)]">
                Membership Fee
              </span>
              <br />
              <span className="text-white drop-shadow-2xl inline-block [transform:translateZ(30px)]">
                Management System
              </span>
            </h1>
          </motion.div>

          {/* Description - enhanced */}
          <motion.p 
            initial={{ opacity: 0, rotateX: -5 }}
            animate={{ opacity: 1, rotateX: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-base sm:text-lg text-white leading-relaxed max-w-2xl mx-auto font-medium tracking-wide drop-shadow-lg filter brightness-110"
          >
            Experience the pinnacle of digital membership administration. A secure, elegant platform designed for organizational excellence and transparency.
          </motion.p>

          {/* CTA Buttons - Clean & Highly Visible */}
          <motion.div 
            initial={{ opacity: 0, y: 20, rotateX: -5 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center pt-6 [transform-style:preserve-3d]"
          >
            <motion.button
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.08, rotateZ: 1, z: 20 }}
              className="inline-flex items-center justify-center gap-2 px-12 py-5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-all duration-300 text-base uppercase tracking-wide shadow-lg hover:shadow-xl [transform-style:preserve-3d]"
            >
              Get Started
            </motion.button>
            <motion.a
              href="#about"
              whileHover={{ scale: 1.08, rotateZ: -1, z: 20 }}
              className="inline-flex items-center justify-center gap-2 px-12 py-5 bg-green-600 hover:bg-green-700 border-3 border-green-600 hover:border-green-700 text-white font-bold rounded-full transition-all duration-300 text-base uppercase tracking-wide shadow-lg hover:shadow-xl [transform-style:preserve-3d]"
            >
              Learn More
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      {/* Luxury scroll indicator */}
      <motion.a 
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-emerald-300/60 hover:text-emerald-300 transition-colors duration-300"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('hero.scroll_down')}</span>
        <ChevronDown className="w-5 h-5" />
      </motion.a>
    </section>
  );
}
