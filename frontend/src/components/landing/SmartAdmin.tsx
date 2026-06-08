import { motion } from 'framer-motion';
import { FileSpreadsheet, BarChart3, Users, Landmark, Download, Settings } from 'lucide-react';

export default function SmartAdmin() {
  const cards = [
    {
      icon: FileSpreadsheet,
      title: 'Automated Reporting',
      desc: 'Generates real-time regulatory reports and financial summaries for executive audits.'
    },
    {
      icon: BarChart3,
      title: 'Contribution Analytics',
      desc: 'Provides comprehensive dashboards detailing member fees, quotas, and historical trends.'
    },
    {
      icon: Users,
      title: 'Membership Tracking',
      desc: 'Secures and manages official registries across all branches, wings, and structural tiers.'
    },
    {
      icon: Landmark,
      title: 'Financial Monitoring',
      desc: 'Monitors deposit transactions and verifies direct bank transfers with active ledger compliance.'
    },
    {
      icon: Download,
      title: 'Export Services',
      desc: 'Enables downloading audit matrices and contribution lists in PDF, Excel, and CSV formats.'
    },
    {
      icon: Settings,
      title: 'Administrative Assistance',
      desc: 'Assists branch officers with smart tools to identify payment arrears and coordinate workflow audits.'
    }
  ];

  return (
    <section id="smart-admin" className="py-24 md:py-32 bg-slate-950 text-white relative overflow-hidden border-t border-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.03),transparent_60%)]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-3">
            <span className="w-6 h-px bg-[#D4AF37]/50"></span>
            Governance Framework
            <span className="w-6 h-px bg-[#D4AF37]/50"></span>
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Digital Governance & Smart Administration
          </h2>
          <p className="text-sm text-gray-400 mt-4 max-w-2xl mx-auto leading-relaxed">
            The platform supports modern membership administration, reporting, financial transparency, and intelligent operational assistance for authorized staff.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              className="bg-white/5 border border-white/5 rounded-2xl p-8 hover:bg-white/10 hover:border-[#D4AF37]/20 transition-all duration-300 relative group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-6">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white font-outfit uppercase tracking-wider mb-3 group-hover:text-[#D4AF37] transition-colors">
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
