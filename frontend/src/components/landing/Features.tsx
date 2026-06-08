import { motion } from 'framer-motion';
import { Users, CreditCard, Building2, BarChart3, Bot, Settings, FileSpreadsheet, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Features() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const featureItems = [
    {
      icon: Users,
      title: t('landing.feat_member_title'),
      desc: t('landing.feat_member_desc')
    },
    {
      icon: CreditCard,
      title: t('landing.feat_payment_title'),
      desc: t('landing.feat_payment_desc')
    },
    {
      icon: BarChart3,
      title: t('landing.feat_report_title'),
      desc: t('landing.feat_report_desc')
    },
    {
      icon: Building2,
      title: t('landing.feat_sector_title'),
      desc: t('landing.feat_sector_desc')
    },
    {
      icon: Settings,
      title: t('landing.feat_user_title'),
      desc: t('landing.feat_user_desc')
    },
    {
      icon: FileSpreadsheet,
      title: t('landing.feat_export_title'),
      desc: t('landing.feat_export_desc')
    },
    {
      icon: ShieldCheck,
      title: t('landing.feat_audit_title'),
      desc: t('landing.feat_audit_desc')
    },
    {
      icon: Bot,
      title: t('landing.feat_ai_title'),
      desc: t('landing.feat_ai_desc')
    }
  ];

  return (
    <section id="features" className="py-28 lg:py-36 bg-white dark:bg-slate-950 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-800 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[#0B5D3B] dark:text-[#D4AF37] mb-3">
            <span className="w-6 h-px bg-[#0B5D3B]/50 dark:bg-[#D4AF37]/50"></span>
            {t('landing.features_subtitle')}
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-gray-900 dark:text-white">
              {t('landing.features_title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 max-w-lg mx-auto">
              {t('landing.features_desc')}
            </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureItems.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 hover:border-[#0B5D3B]/30 hover:shadow-xl hover:shadow-[#0B5D3B]/5 transition-all duration-500"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#0B5D3B]/10 flex items-center justify-center mb-6 group-hover:bg-[#0B5D3B] group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#0B5D3B]/20 transition-all duration-500">
                <feat.icon className="w-6 h-6 text-[#0B5D3B] dark:text-[#D4AF37] group-hover:text-white transition-colors duration-500" />
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-3 group-hover:text-[#0B5D3B] dark:group-hover:text-[#D4AF37] transition-colors duration-300 font-outfit uppercase tracking-wide">
                {feat.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {feat.desc}
              </p>
              <div onClick={() => navigate('/login')} className="mt-6 flex items-center gap-2 text-[#0B5D3B] dark:text-[#D4AF37] text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 cursor-pointer">
                {t('buttons.access_feature')} <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
