import { Globe, MapPin, Phone, Mail, Clock, Layers, ShieldCheck, CheckCircle2, ChevronRight, Twitter, Linkedin, Instagram } from 'lucide-react';

interface FooterProps {
  content: Record<string, string>;
}

export default function Footer({ content }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-slate-950 border-t border-slate-900 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Column 1: Brand & Social */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img src="/pp-logo.png" alt="Prosperity Party" className="w-12 h-12 object-contain bg-white rounded-full p-1.5 shadow-lg" />
              <div>
                <div className="text-white font-black text-sm font-outfit leading-tight">Prosperity Party</div>
                <div className="text-[#D4AF37] text-[9px] font-black uppercase tracking-[0.25em]">Dire Dawa Branch</div>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed">
              {content.footer_description || 'Official membership fee management portal for the Prosperity Party Dire Dawa Branch Office. Built to establish digital financial governance, transparency, and accountability.'}
            </p>
            
            <div className="flex gap-3 pt-2">
              {[
                { icon: Globe, href: 'https://prosperity.party' },
                { icon: Twitter, href: '#' },
                { icon: Linkedin, href: '#' },
                { icon: Instagram, href: '#' }
              ].map((social, i) => (
                <a key={i} href={social.href} target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:bg-[#D4AF37] hover:text-slate-950 hover:border-[#D4AF37] transition-all duration-300">
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.25em] mb-8 font-outfit">Quick Navigation</h4>
            <ul className="space-y-4 text-xs">
              {[
                { name: 'Home', href: '#hero' },
                { name: 'About', href: '#about' },
                { name: 'Features', href: '#features' },
                { name: 'Photo Gallery', href: '#gallery' },
                { name: 'Contact', href: '#contact' }
              ].map(link => (
                <li key={link.name}>
                  <a href={link.href}
                    className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-300 flex items-center gap-2 group">
                    <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]/40 group-hover:text-[#D4AF37] transition-colors" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Information */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.25em] mb-8 font-outfit">Contact Information</h4>
            <ul className="space-y-5 text-xs text-gray-400">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0B5D3B]/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-white font-bold">{content.phone || '+251 25 111 0000'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Monday – Friday, 8:30 AM – 5:30 PM</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0B5D3B]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-white font-bold">{content.email || 'info@pp-diredawa.org'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Official Inquiries & Support</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0B5D3B]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-white font-bold">Saturday Hours</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">8:30 AM – 12:30 PM</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Office Address */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.25em] mb-8 font-outfit">Office Address</h4>
            <ul className="space-y-5 text-xs text-gray-400">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0B5D3B]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-white font-bold">{content.address || 'Dire Dawa Headquarters'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Branch Headquarters, Dire Dawa, Ethiopia</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            &copy; {currentYear} Prosperity Party Dire Dawa Branch Office. Built for Digital Governance.
          </p>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider">
            <a href="#" className="text-gray-500 hover:text-[#D4AF37] transition-colors duration-300">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-[#D4AF37] transition-colors duration-300">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-[#D4AF37] transition-colors duration-300">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
