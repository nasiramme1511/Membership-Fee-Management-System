import { motion } from 'framer-motion';
import { ShieldCheck, Key, Eye, Database, FileSpreadsheet, Lock, Activity, CheckCircle2 } from 'lucide-react';

export default function Security() {
  const securityItems = [
    {
      icon: Lock,
      title: 'AES-256 Encryption',
      desc: 'All membership records and contribution files are encrypted in transit and at rest.'
    },
    {
      icon: Key,
      title: 'Role-Based Access Control',
      desc: 'Strict authorization limits system commands to verified branch officers.'
    },
    {
      icon: Activity,
      title: 'Audit Logging',
      desc: 'Every database transaction, login, and export is recorded chronologically.'
    },
    {
      icon: Database,
      title: 'Secure Backups',
      desc: 'Automated backups prevent data loss and preserve financial archives.'
    },
    {
      icon: Eye,
      title: 'Financial Transparency',
      desc: 'Double-entry validation maps contribution receipts to bank deposits.'
    },
    {
      icon: CheckCircle2,
      title: 'Data Integrity',
      desc: 'Database constraint normalization rules prevent duplicate records.'
    }
  ];

  return (
    <section id="security" className="py-28 lg:py-36 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,93,59,0.06),transparent_60%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-3">
            <span className="w-6 h-px bg-[#D4AF37]/50"></span>
            Compliance & Defense
            <span className="w-6 h-px bg-[#D4AF37]/50"></span>
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Security & Transparency
          </h2>
          <p className="text-sm text-gray-400 mt-4 max-w-lg mx-auto">
            Government-grade protection protocols ensuring trust, accountability, and database reliability.
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
