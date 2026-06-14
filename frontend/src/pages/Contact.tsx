import React from 'react';
import { Mail, Phone, MapPin, Globe, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHero from '../components/landing/PageHero';

export default function Contact() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHero title="Contact Us" />

      <div className="bg-white dark:bg-ebony pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-16">
               <div className="flex items-start gap-8 group">
                  <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-all duration-500 shadow-xl">
                     <MapPin className="w-10 h-10 text-primary group-hover:text-white" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-ebony dark:text-white mb-4 tracking-tight">{t('common.head_office')}</h3>
                     <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-medium">
                        {t('common.main_branch_secretariat')}<br/>
                        {t('common.diredawa_city_admin')}<br/>
                        Ethiopia, P.O. Box 0000
                     </p>
                  </div>
               </div>
               
               <div className="flex items-start gap-8 group">
                  <div className="w-20 h-20 rounded-[2rem] bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold transition-all duration-500 shadow-xl">
                     <Phone className="w-10 h-10 text-gold group-hover:text-ebony" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-ebony dark:text-white mb-4 tracking-tight">Direct Phone Lines</h3>
                     <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-medium mb-1">General Support: +251 911 000 000</p>
                     <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-medium">Technical Team: +251 912 000 000</p>
                  </div>
               </div>
               
               <div className="flex items-start gap-8 group">
                  <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-all duration-500 shadow-xl">
                     <Mail className="w-10 h-10 text-primary group-hover:text-white" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-ebony dark:text-white mb-4 tracking-tight">Official Email</h3>
                     <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-medium mb-1">Admin: admin@pp-diredawa.org</p>
                     <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-medium">Support: support@pp-diredawa.org</p>
                  </div>
               </div>
            </div>

            {/* Contact Form */}
            <div className="bg-slate-50 dark:bg-ebony-card border border-slate-100 dark:border-white/10 rounded-[3rem] p-12 lg:p-16 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-3xl font-black text-ebony dark:text-white mb-10 tracking-tighter">Send an Official Inquiry</h3>
              <form className="space-y-8 relative z-10">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="block text-[10px] font-black text-primary uppercase tracking-[0.4em]">Full Name</label>
                       <input type="text" className="w-full bg-white dark:bg-ebony border border-slate-200 dark:border-white/5 text-ebony dark:text-white rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" placeholder="Your Name" />
                    </div>
                    <div className="space-y-3">
                       <label className="block text-[10px] font-black text-primary uppercase tracking-[0.4em]">Email Address</label>
                       <input type="email" className="w-full bg-white dark:bg-ebony border border-slate-200 dark:border-white/5 text-ebony dark:text-white rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" placeholder="your@email.com" />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-primary uppercase tracking-[0.4em]">Subject</label>
                    <input type="text" className="w-full bg-white dark:bg-ebony border border-slate-200 dark:border-white/5 text-ebony dark:text-white rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" placeholder="Topic of Inquiry" />
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-primary uppercase tracking-[0.4em]">Detailed Message</label>
                    <textarea rows={5} className="w-full bg-white dark:bg-ebony border border-slate-200 dark:border-white/5 text-ebony dark:text-white rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" placeholder="How can we assist you?"></textarea>
                 </div>
                 <button type="button" className="bg-primary text-white px-10 py-5 rounded-full text-xs font-black uppercase tracking-[0.3em] w-full flex justify-center items-center gap-4 hover:bg-gold hover:text-ebony hover:scale-[1.02] transition-all shadow-xl group">
                    Send Official Message
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                 </button>
              </form>
            </div>
          </div>
         </div>
       </div>
     </div>
   );
 }
