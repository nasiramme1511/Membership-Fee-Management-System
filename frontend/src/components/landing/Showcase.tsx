import { motion } from 'framer-motion';
import { LayoutDashboard, Users, CreditCard, FileText, Bot, ExternalLink } from 'lucide-react';

interface ShowcaseProps {
  galleryImages: any[];
}

export default function Showcase({ galleryImages }: ShowcaseProps) {
  const showcaseModules = [
    {
      key: 'dashboard',
      icon: LayoutDashboard,
      title: 'System Dashboard',
      desc: 'High-level real-time aggregates and payment analytics charts.',
      featured: true
    },
    {
      key: 'members',
      icon: Users,
      title: 'Members Management',
      desc: 'Clean UI to view profiles, transfer members, and audit status.'
    },
    {
      key: 'payments',
      icon: CreditCard,
      title: 'Payments Processing',
      desc: 'Record contributions, view receipt PDFs, and approve bank slips.'
    },
    {
      key: 'reports',
      icon: FileText,
      title: 'Advanced Reports',
      desc: 'Filter contribution lists and export Excel, Word, and PDF files.'
    },
    {
      key: 'assistant',
      icon: Bot,
      title: 'AI Assistant Panel',
      desc: 'Natural language workspace to command calculations and actions.'
    }
  ];

  const getModuleImage = (title: string) => {
    const matched = galleryImages.find(img => 
      img.title?.toLowerCase().includes(title.toLowerCase()) || 
      img.description?.toLowerCase().includes(title.toLowerCase())
    );
    return matched ? matched.image : null;
  };

  return (
    <section id="showcase" className="py-28 lg:py-36 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.06),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(11,93,59,0.08),transparent_50%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-3">
            <span className="w-6 h-px bg-[#D4AF37]/50"></span>
            Interface Preview
            <span className="w-6 h-px bg-[#D4AF37]/50"></span>
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            System Showcase
          </h2>
          <p className="text-sm text-gray-400 mt-4 max-w-lg mx-auto">
            Screenshots of core administrative workspace modules. Administrator updates appear here automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {showcaseModules.map((item, i) => {
            const dbImage = getModuleImage(item.key) || getModuleImage(item.title);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`${item.featured ? 'md:col-span-2 md:row-span-2' : ''} group`}
              >
                <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-[#D4AF37]/40 transition-all duration-500 h-full flex flex-col justify-between">
                  {dbImage ? (
                    <div className="relative w-full h-full min-h-[200px] overflow-hidden">
                      <img 
                        src={dbImage} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-6">
                        <item.icon className="w-8 h-8 text-[#D4AF37] mb-2" />
                        <h3 className="text-white font-bold text-lg font-outfit">{item.title}</h3>
                        <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 flex flex-col justify-between h-full min-h-[240px] relative">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.02),transparent_60%)]"></div>
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-slate-700/30 flex items-center justify-center text-[#D4AF37] mb-6 border border-slate-700/50">
                          <item.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-white font-black text-lg font-outfit uppercase tracking-wide">{item.title}</h3>
                        <p className="text-gray-400 text-xs mt-3 leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="mt-8 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-gray-500 font-mono">
                        <span>Status: Operational</span>
                        <span className="text-[#D4AF37]/80 flex items-center gap-1">
                          No Custom Upload <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
