import { motion } from 'framer-motion';
import { Target, Eye, ShieldCheck, Zap, Heart, Award } from 'lucide-react';

interface AboutProps {
  content: Record<string, string>;
  aboutImg: string;
}

export default function About({ content, aboutImg }: AboutProps) {
  const values = [
    {
      icon: ShieldCheck,
      title: 'Transparency',
      desc: 'Open and verified financial tracking across all organizational sectors.'
    },
    {
      icon: Award,
      title: 'Accountability',
      desc: 'Institutional integrity with strict verification pipelines for contributions.'
    },
    {
      icon: Zap,
      title: 'Digital Transformation',
      desc: 'Pioneering smart administration solutions to eliminate paperwork.'
    },
    {
      icon: Heart,
      title: 'Community Service',
      desc: 'Directing resource operations for the development of Dire Dawa.'
    }
  ];

  return (
    <section id="about" className="py-28 lg:py-36 bg-gray-50 dark:bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#0B5D3B]/[0.02] to-transparent pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-[#0B5D3B]/5 dark:bg-[#0B5D3B]/10 rounded-3xl"></div>
              <div className="absolute -inset-2 bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 rounded-3xl -rotate-1"></div>
              <img
                src={aboutImg || '/photos/gate.jpg'}
                alt="Prosperity Party Dire Dawa Branch Office Entrance Gate"
                className="relative w-full h-[520px] object-cover rounded-2xl shadow-2xl"
                onError={(e) => { (e.target as HTMLImageElement).src = '/photos/gate.jpg'; }}
              />
              <div className="absolute -bottom-6 -right-6 bg-[#0B5D3B] text-white px-8 py-6 rounded-2xl shadow-2xl border border-[#0B5D3B]/50">
                <div className="text-2xl font-black font-outfit">Dire Dawa</div>
                <div className="text-[#D4AF37] text-xs font-black tracking-widest uppercase mt-1">Branch Office</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6"
          >
            <span className="inline-flex items-center gap-2 text-xs font-black text-[#0B5D3B] dark:text-[#D4AF37] uppercase tracking-[0.3em]">
              <span className="w-6 h-px bg-[#0B5D3B]/50 dark:bg-[#D4AF37]/50"></span>
              {content.about_title || 'Institutional Identity'}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight font-outfit">
              Prosperity Party Branch Office
            </h2>
            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {content.about_description || 'Serving the Dire Dawa Administration, our branch office is dedicated to digital governance, transparency, and public accountability. We strive to automate workflows, secure collections, and serve the community with high integrity.'}
            </p>

            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0B5D3B]/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-[#0B5D3B]" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Mission Statement</h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {content.mission_text || 'To enforce structural discipline and digital excellence, ensuring active participation and transparent membership contributions.'}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0B5D3B]/10 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-[#0B5D3B]" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Vision Strategy</h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {content.vision_text || 'To lead as a highly computerized branch office that integrates modern tools, AI support, and automated audits.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/50 dark:border-slate-800">
              {values.map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0B5D3B]/10 flex items-center justify-center flex-shrink-0">
                    <v.icon className="w-4 h-4 text-[#0B5D3B] dark:text-[#D4AF37]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white">{v.title}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
