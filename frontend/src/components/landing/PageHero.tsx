import { motion } from 'framer-motion';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
}

const pageHeroImages = [
  '/new_hero_image.png',
  '/new_hero_image_2.png',
  '/new_hero_image_3.png'
];

export default function PageHero({ title, subtitle, description }: PageHeroProps) {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-slate-950 [perspective:1000px]">
      <motion.div
        className="absolute inset-0 bg-black overflow-hidden"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${pageHeroImages[0]})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/10 via-slate-900/5 to-emerald-950/8" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/15" />
        <div className="absolute inset-0 bg-slate-950/60" />
      </motion.div>

      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-24 pb-16 [transform-style:preserve-3d]">
        {subtitle && (
          <motion.span
            initial={{ opacity: 0, y: 20, z: -50 }}
            animate={{ opacity: 1, y: 0, z: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-4"
          >
            <span className="w-6 h-px bg-[#D4AF37]/50" />
            {subtitle}
          </motion.span>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 30, rotateX: -10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className={`font-black text-white leading-[1.1] tracking-tight font-outfit ${subtitle || description ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-5xl sm:text-6xl lg:text-7xl'} [transform:translateZ(30px)]`}
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20, rotateX: -5 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-sm sm:text-base text-gray-300 mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            {description}
          </motion.p>
        )}
      </div>
    </section>
  );
}
