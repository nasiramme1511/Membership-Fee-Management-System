import { motion } from 'framer-motion';
import { Eye, ShieldCheck, Activity, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Trust() {
  const { t } = useTranslation();

  const cards = [
    {
      icon: Eye,
      title: t('landing.value_transparency'),
      desc: t('landing.value_transparency_desc')
    },
    {
      icon: ShieldCheck,
      title: t('landing.trust_security'),
      desc: t('landing.trust_security_desc')
    },
    {
      icon: Activity,
      title: t('landing.trust_audit'),
      desc: t('landing.trust_audit_desc')
    },
    {
      icon: Award,
      title: t('landing.trust_integrity'),
      desc: t('landing.trust_integrity_desc')
    }
  ];

  return (
    <section id="trust" className="py-24 md:py-32 bg-gray-50 dark:bg-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[#0B5D3B] dark:text-[#D4AF37] mb-3">
            <span className="w-6 h-px bg-[#0B5D3B]/50 dark:bg-[#D4AF37]/50"></span>
            {t('landing.trust_subtitle')}
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-gray-900 dark:text-white">
              {t('landing.trust_title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 max-w-lg mx-auto leading-relaxed">
              {t('landing.trust_desc')}
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl hover:border-[#0B5D3B]/20 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-lg bg-[#0B5D3B]/10 dark:bg-[#0B5D3B]/20 flex items-center justify-center text-[#0B5D3B] dark:text-[#D4AF37] mb-5">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white font-outfit uppercase tracking-wide mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
