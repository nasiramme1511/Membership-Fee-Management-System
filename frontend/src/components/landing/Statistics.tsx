import { motion } from 'framer-motion';
import { Users, CreditCard, Wallet, Activity, Building2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface StatisticsProps {
  stats: {
    totalMembers: number;
    totalPayments: number;
    totalRevenue: number;
    totalSectors: number;
    collectionRate: number;
  };
  content: Record<string, string>;
}

function Counter({ end, duration = 2000, suffix = '', formatAsK = false }: { end: number; duration?: number; suffix?: string; formatAsK?: boolean }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  useEffect(() => {
    if (!inView) return;
    let startTime: number;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease out
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, end, duration]);

  const formatNumber = (num: number) => {
    if (formatAsK && num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
  };

  return (
    <span ref={ref}>
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

export default function Statistics({ stats, content }: StatisticsProps) {
  const { t } = useTranslation();

  const statItems = [
    {
      icon: Users,
      value: stats.totalMembers,
      label: t('landing.stat_members'),
      suffix: '',
      formatAsK: false
    },
    {
      icon: CreditCard,
      value: stats.totalPayments,
      label: t('landing.stat_payments'),
      suffix: '',
      formatAsK: false
    },
    {
      icon: Wallet,
      value: stats.totalRevenue,
      label: t('landing.stat_revenue'),
      suffix: ' ETB',
      formatAsK: true
    },
    {
      icon: Building2,
      value: stats.totalSectors,
      label: t('landing.stat_sectors'),
      suffix: '',
      formatAsK: false
    },
    {
      icon: Activity,
      value: stats.collectionRate,
      label: t('landing.stat_collection'),
      suffix: '%',
      formatAsK: false
    }
  ];

  return (
    <section id="statistics" className="py-16 bg-gradient-to-r from-green-700 to-green-800 text-white relative overflow-hidden [perspective:1200px]">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          {statItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30, rotateX: 20 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ scale: 1.1, z: 30, rotateX: -5 }}
              className="text-center [transform-style:preserve-3d] bg-white/10 backdrop-blur-sm rounded-2xl p-6 cursor-default border border-white/10 hover:border-white/30 transition-colors duration-300"
            >
              <div className="text-4xl md:text-5xl font-bold text-white font-outfit mb-2 [transform:translateZ(20px)]">
                <Counter end={item.value} suffix={item.suffix} formatAsK={item.formatAsK} />
              </div>
              <div className="text-xs md:text-sm text-green-100 font-bold uppercase tracking-wider [transform:translateZ(10px)]">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
