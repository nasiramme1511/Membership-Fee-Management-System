import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface LeadershipProps {
  content: Record<string, string>;
  leaderImg: string;
}

export default function Leadership({ content, leaderImg }: LeadershipProps) {
  return (
    <section id="leadership" className="py-28 lg:py-36 bg-gray-50 dark:bg-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 order-2 lg:order-1"
          >
            <span className="inline-flex items-center gap-2 text-xs font-black text-[#0B5D3B] dark:text-[#D4AF37] uppercase tracking-[0.3em]">
              <span className="w-6 h-px bg-[#0B5D3B]/50 dark:bg-[#D4AF37]/50"></span>
              Branch Message
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-4 mb-8 font-outfit">
              Leadership & Executive Command
            </h2>
            
            <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
              <div className="absolute top-6 right-6 text-[#D4AF37]/10 dark:text-[#D4AF37]/5 pointer-events-none">
                <Quote className="w-24 h-24" />
              </div>
              
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium relative z-10">
                {content.leadership_message || 'Digital transformation is key to structural transparency, accountability, and institutional excellence. We remain committed to modernizing operations, serving our members, and safeguarding the financial integrity of our organization.'}
              </p>
              
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B5D3B] to-[#094a2f] flex items-center justify-center text-white font-black text-sm shadow-md">
                  PP
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white font-outfit text-sm">
                    {content.leadership_name || 'Branch Executive Committee'}
                  </div>
                  <div className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest mt-0.5">
                    {content.leadership_role || 'Prosperity Party Dire Dawa Branch'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 order-1 lg:order-2"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-[#0B5D3B]/5 dark:bg-[#0B5D3B]/10 rounded-3xl"></div>
              <div className="absolute -inset-2 bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 rounded-3xl rotate-1"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={leaderImg || '/photos/leadership.jpg'}
                  alt="Prosperity Party Dire Dawa Branch Office Executive Room"
                  className="w-full h-[520px] object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/photos/leadership.jpg'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="font-black text-lg font-outfit uppercase tracking-wider">Office of the Secretariat</div>
                  <div className="text-[#D4AF37] text-xs font-bold tracking-widest mt-0.5">Dire Dawa Head Office</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
