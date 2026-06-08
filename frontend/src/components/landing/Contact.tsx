import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContactProps {
  content: Record<string, string>;
}

export default function Contact({ content }: ContactProps) {
  const { t } = useTranslation();
  // Default fallback embed map of Dire Dawa
  const defaultMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3936.787687823528!2d41.85966677579124!3d9.59218559049363!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x163101c5f3e498c1%3A0xe54d72856f6ba3a8!2sDire%20Dawa!5e0!3m2!1sen!2set!4v1717800000000!5m2!1sen!2set";
  
  const mapUrl = content.map_embed_url || defaultMapUrl;

  const infoItems = [
    {
      icon: MapPin,
      title: t('landing.footer_address'),
      line1: content.address || t('hero.branch'),
      line2: t('landing.about_subtitle')
    },
    {
      icon: Phone,
      title: t('landing.footer_contact'),
      line1: content.phone || '+251 25 111 0000',
      line2: t('landing.footer_inquiries')
    },
    {
      icon: Mail,
      title: t('common.email'),
      line1: content.email || 'info@pp-diredawa.org',
      line2: t('landing.footer_inquiries')
    },
    {
      icon: Clock,
      title: t('landing.footer_hours'),
      line1: t('landing.footer_hours'),
      line2: t('landing.footer_saturday_hours')
    }
  ];

  return (
    <section id="contact" className="py-24 md:py-32 bg-white dark:bg-slate-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[#0B5D3B] dark:text-[#D4AF37] mb-3">
            <span className="w-6 h-px bg-[#0B5D3B]/50 dark:bg-[#D4AF37]/50"></span>
            {t('nav.contact')}
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-gray-900 dark:text-white">
              {t('nav.contact')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 max-w-lg mx-auto leading-relaxed">
              {t('landing.footer_desc')}
            </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Info Details */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-8"
          >
            {infoItems.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0B5D3B]/10 dark:bg-[#0B5D3B]/20 flex items-center justify-center text-[#0B5D3B] dark:text-[#D4AF37] flex-shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.title}</h3>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-1 font-outfit">{item.line1}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.line2}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Map Embed Container */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-4 shadow-xl overflow-hidden h-[440px] flex flex-col justify-between"
          >
            <div className="w-full h-full rounded-2xl overflow-hidden relative bg-gray-200 dark:bg-slate-800">
              <iframe
                title="Google Maps Location"
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full filter grayscale contrast-125 dark:invert dark:grayscale"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
