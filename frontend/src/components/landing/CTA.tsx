import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CTAProps {
  content: Record<string, string>;
  ctaBg: string;
}

export default function CTA({ content, ctaBg }: CTAProps) {
  const navigate = useNavigate();

  return (
    <section id="cta" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={ctaBg || '/photos/building.jpg'}
          alt="Prosperity Party Administrative HQ"
          className="w-full h-full object-cover scale-100"
          onError={(e) => { (e.target as HTMLImageElement).src = '/photos/building.jpg'; }}
        />
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_60%)]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <Award className="w-16 h-16 text-[#D4AF37]/30 mx-auto" />
          
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight font-outfit uppercase">
            {content.cta_title || 'Join the Digital Transformation'}
          </h2>
          
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {content.cta_description || 'Access membership services and organizational resources through our secure digital platform.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D4AF37] text-slate-950 font-black rounded-xl hover:bg-[#c39e2e] transition-all duration-300 shadow-2xl shadow-[#D4AF37]/20 text-xs uppercase tracking-wider">
              Register
            </button>
            
            <button onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:border-white/50 hover:bg-white/10 transition-all duration-300 text-xs uppercase tracking-wider">
              Login
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
