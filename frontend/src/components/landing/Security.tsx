import { motion } from 'framer-motion';
import { ShieldCheck, Key, Eye, Database, FileSpreadsheet, Lock, Activity, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Security() {
  const { t } = useTranslation();

  const securityItems = [
    {
      icon: Lock,
      title: t('landing.trust_security'),
      desc: t('landing.trust_security_desc')
    },
    {
      icon: Key,
      title: t('landing.value_accountability'),
      desc: t('landing.value_accountability_desc')
    },
    {
      icon: Activity,
      title: t('landing.trust_audit'),
      desc: t('landing.trust_audit_desc')
    },
    {
      icon: Database,
      title: t('landing.trust_control'),
      desc: t('landing.trust_control_desc')
    },
    {
      icon: Eye,
      title: t('landing.value_transparency'),
      desc: t('landing.value_transparency_desc')
    },
    {
      icon: CheckCircle2,
      title: t('landing.trust_integrity'),
      desc: t('landing.trust_integrity_desc')
    }
  ];

  return (
    <section id="security" className="py-28 lg:py-36 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,93,59,0.06),transparent_60%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-3">
            <span className="w-6 h-px bg-[#D4AF37]/50"></span>
            {t('nav.security')}
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
              {t('nav.security')}
            </h2>
            <p className="text-sm text-gray-400 mt-4 max-w-lg mx-auto">
              {t('landing.trust_desc')}
            </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {securityItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.08 }}
              className="bg-slate-800/40 border border-slate-800 hover:border-[#D4AF37]/30 rounded-3xl p-8 hover:bg-slate-800/60 hover:-translate-y-1 transition-all duration-300 relative group"
            >
              <div className="absolute top-6 right-6 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors pointer-events-none">
                <ShieldCheck className="w-16 h-16" />
              </div>
              
              <div className="w-12 h-12 rounded-xl bg-slate-700/30 border border-slate-700/50 flex items-center justify-center text-[#D4AF37] mb-6">
                <item.icon className="w-5 h-5" />
              </div>

              <h3 className="text-base font-black text-white font-outfit uppercase tracking-wider mb-3">
                {item.title}
              </h3>
              
              <p className="text-xs text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
