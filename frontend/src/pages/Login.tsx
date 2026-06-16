import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Mail, Lock, AlertCircle, BadgeCheck,
  Users, CreditCard, ShieldCheck, Fingerprint, Handshake,
  DollarSign, Target, FileText, PieChart
} from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'

const Preloader = () => {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center gap-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FFD700]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="relative flex items-center justify-center">
        <div className="absolute w-44 h-44 border border-[#D4AF37]/30 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
        <div className="absolute w-36 h-36 border border-[#D4AF37]/20 rounded-full"></div>
        <div className="w-28 h-28 border-2 border-[#D4AF37]/20 rounded-full"></div>
        <div className="absolute inset-0 w-28 h-28 border-2 border-transparent border-t-[#FFD700] border-r-[#D4AF37]/50 rounded-full animate-spin"></div>
        <img src="/pp-logo.png" alt="" className="absolute w-14 h-14 object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
      </div>
      <div className="text-center space-y-3 animate-in fade-in duration-1000">
        <h2 className="font-black tracking-[0.4em] uppercase text-xs bg-clip-text text-transparent bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B]">
          {t('common.prosperity_party')}
        </h2>
        <p className="text-[#B8860B] text-[10px] font-bold uppercase tracking-[0.5em] opacity-80">
          {t('common.initializing_session')}
        </p>
        <div className="w-48 h-[2px] bg-[#D4AF37]/10 rounded-full mx-auto mt-4 overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const currentLang = i18n.language || 'am'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      if (err.response?.data) {
        const apiMsg = err.response.data.message
        if (apiMsg && typeof apiMsg === 'string' && apiMsg.trim()) {
          setError(apiMsg)
        } else if (err.response.status >= 500) {
          setError(t('common.server_error'))
        } else {
          setError(t('common.error'))
        }
      } else if (err.code === 'ECONNABORTED') {
        setError(t('common.timeout_error'))
      } else {
        setError(t('common.network_error'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (isInitialLoading) return <Preloader />

  return (
    <div className={`min-h-screen px-4 sm:px-6 bg-white overflow-y-auto relative ${currentLang.startsWith('am') ? 'font-amharic' : ''}`}>
      {/* ===== DIGITAL NETWORK BACKGROUND ===== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'blur(0.2px)' }}>
          <defs>
            <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B5D3B" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0B5D3B" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {[
            ['8%','3%','15%','12%'], ['15%','12%','25%','5%'], ['25%','5%','35%','10%'], ['35%','10%','48%','4%'],
            ['48%','4%','58%','8%'], ['58%','8%','68%','3%'], ['68%','3%','78%','9%'], ['78%','9%','88%','4%'],
            ['88%','4%','94%','10%'], ['3%','15%','10%','25%'], ['10%','25%','5%','38%'], ['5%','38%','12%','48%'],
            ['12%','48%','4%','58%'], ['4%','58%','15%','68%'], ['15%','68%','6%','78%'], ['6%','78%','14%','85%'],
            ['14%','85%','4%','93%'], ['4%','93%','12%','97%'], ['95%','12%','97%','25%'], ['97%','25%','92%','38%'],
            ['92%','38%','96%','52%'], ['96%','52%','90%','62%'], ['90%','62%','95%','75%'], ['95%','75%','88%','85%'],
            ['88%','85%','94%','92%'], ['94%','92%','85%','97%'], ['85%','97%','92%','98%'],
            ['15%','12%','25%','22%'], ['25%','22%','35%','15%'], ['35%','15%','48%','25%'], ['48%','25%','58%','18%'],
            ['58%','18%','68%','25%'], ['68%','25%','78%','18%'], ['78%','18%','88%','25%'], ['88%','25%','92%','38%'],
            ['10%','25%','25%','22%'], ['25%','22%','35%','35%'], ['35%','35%','48%','25%'], ['48%','25%','58%','35%'],
            ['58%','35%','68%','25%'], ['68%','25%','78%','35%'], ['78%','35%','88%','25%'], ['88%','25%','78%','35%'],
            ['5%','38%','15%','35%'], ['15%','35%','25%','45%'], ['25%','45%','35%','35%'], ['35%','35%','48%','45%'],
            ['48%','45%','58%','35%'], ['58%','35%','68%','45%'], ['68%','45%','78%','35%'], ['78%','35%','88%','45%'],
            ['12%','48%','25%','45%'], ['25%','45%','35%','55%'], ['35%','55%','48%','45%'], ['48%','45%','58%','55%'],
            ['58%','55%','68%','45%'], ['68%','45%','78%','55%'], ['78%','55%','88%','45%'], ['92%','38%','88%','45%'],
            ['4%','58%','15%','55%'], ['15%','55%','25%','65%'], ['25%','65%','35%','55%'], ['35%','55%','48%','65%'],
            ['48%','65%','58%','55%'], ['58%','55%','68%','65%'], ['68%','65%','78%','55%'], ['78%','55%','88%','65%'],
            ['15%','68%','25%','65%'], ['25%','65%','35%','75%'], ['35%','75%','48%','65%'], ['48%','65%','58%','75%'],
            ['58%','75%','68%','65%'], ['68%','65%','78%','75%'], ['78%','75%','88%','65%'], ['96%','52%','88%','65%'],
            ['6%','78%','15%','75%'], ['15%','75%','25%','82%'], ['25%','82%','35%','75%'], ['35%','75%','48%','82%'],
            ['48%','82%','58%','75%'], ['58%','75%','68%','82%'], ['68%','82%','78%','75%'], ['78%','75%','88%','82%'],
            ['14%','85%','25%','82%'], ['25%','82%','35%','88%'], ['35%','88%','48%','82%'], ['48%','82%','58%','88%'],
            ['58%','88%','68%','82%'], ['68%','82%','78%','88%'], ['78%','88%','88%','82%'], ['95%','75%','88%','82%'],
            ['4%','93%','15%','90%'], ['15%','90%','25%','95%'], ['25%','95%','35%','90%'], ['35%','90%','48%','95%'],
            ['48%','95%','58%','90%'], ['58%','90%','68%','95%'], ['68%','95%','78%','90%'], ['78%','90%','88%','95%'],
            ['12%','97%','25%','95%'], ['25%','95%','35%','97%'], ['35%','97%','48%','95%'], ['48%','95%','58%','97%'],
            ['58%','97%','68%','95%'], ['68%','95%','78%','97%'], ['78%','97%','88%','95%'], ['88%','95%','85%','97%'],
            ['15%','12%','10%','25%'], ['25%','22%','25%','5%'], ['35%','15%','35%','10%'], ['48%','25%','48%','4%'],
            ['58%','18%','58%','8%'], ['68%','25%','68%','3%'], ['78%','18%','78%','9%'], ['88%','25%','88%','4%'],
            ['35%','35%','25%','45%'], ['48%','45%','35%','55%'], ['58%','35%','48%','45%'], ['68%','45%','58%','55%'],
            ['78%','35%','68%','45%'], ['88%','45%','78%','55%'], ['25%','45%','15%','55%'], ['35%','55%','25%','65%'],
            ['48%','65%','35%','75%'], ['58%','55%','48%','65%'], ['68%','65%','58%','75%'], ['78%','55%','68%','65%'],
            ['88%','65%','78%','75%'], ['25%','65%','15%','75%'], ['35%','75%','25%','82%'], ['48%','82%','35%','88%'],
            ['58%','75%','48%','82%'], ['68%','82%','58%','88%'], ['78%','75%','68%','82%'], ['88%','82%','78%','88%'],
            ['15%','75%','6%','78%'], ['25%','82%','14%','85%'], ['35%','88%','25%','95%'], ['48%','82%','35%','90%'],
            ['58%','88%','48%','95%'], ['68%','82%','58%','90%'], ['78%','88%','68%','95%'], ['88%','82%','78%','90%'],
          ].map(([x1,y1,x2,y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0B5D3B" strokeWidth="1" opacity="0.45" />
          ))}
          {[
            ['15%','12%','35%','10%'], ['35%','10%','58%','8%'], ['58%','8%','78%','9%'],
            ['10%','25%','5%','38%'], ['5%','38%','4%','58%'], ['4%','58%','6%','78%'],
            ['97%','25%','96%','52%'], ['96%','52%','95%','75%'], ['95%','75%','94%','92%'],
            ['25%','22%','48%','25%'], ['48%','25%','68%','25%'], ['68%','25%','88%','25%'],
            ['25%','45%','48%','45%'], ['48%','45%','68%','45%'], ['68%','45%','88%','45%'],
            ['25%','65%','48%','65%'], ['48%','65%','68%','65%'], ['68%','65%','88%','65%'],
            ['25%','82%','48%','82%'], ['48%','82%','68%','82%'], ['68%','82%','88%','82%'],
          ].map(([x1,y1,x2,y2], i) => (
            <line key={`d${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#glow)" strokeWidth="0.7" strokeDasharray="4 5" opacity="0.3" />
          ))}
          {[
            ['8%','3%'],['15%','12%'],['25%','5%'],['35%','10%'],['48%','4%'],['58%','8%'],['68%','3%'],['78%','9%'],['88%','4%'],['94%','10%'],
            ['3%','15%'],['10%','25%'],['5%','38%'],['12%','48%'],['4%','58%'],['15%','68%'],['6%','78%'],['14%','85%'],['4%','93%'],['12%','97%'],
            ['95%','12%'],['97%','25%'],['92%','38%'],['96%','52%'],['90%','62%'],['95%','75%'],['88%','85%'],['94%','92%'],['85%','97%'],
            ['25%','22%'],['35%','15%'],['48%','25%'],['58%','18%'],['68%','25%'],['78%','18%'],['88%','25%'],
            ['15%','35%'],['25%','45%'],['35%','35%'],['48%','45%'],['58%','35%'],['68%','45%'],['78%','35%'],['88%','45%'],
            ['15%','55%'],['25%','65%'],['35%','55%'],['48%','65%'],['58%','55%'],['68%','65%'],['78%','55%'],['88%','65%'],
            ['15%','75%'],['25%','82%'],['35%','75%'],['48%','82%'],['58%','75%'],['68%','82%'],['78%','75%'],['88%','82%'],
            ['15%','90%'],['25%','95%'],['35%','90%'],['48%','95%'],['58%','90%'],['68%','95%'],['78%','90%'],['88%','95%'],
          ].map(([cx,cy], i) => (
            <circle key={`n${i}`} cx={cx} cy={cy} r="2.2" fill="#0B5D3B" opacity="0.35" />
          ))}
          {[
            ['30%','68%'],['70%','35%'],['50%','50%'],['40%','18%'],['60%','82%'],['20%','50%'],['80%','50%'],
            ['25%','5%'],['48%','4%'],['78%','9%'],['5%','38%'],['4%','58%'],['95%','75%'],['96%','52%'],
            ['48%','82%'],['35%','10%'],['68%','25%'],['25%','82%'],['88%','25%'],['58%','18%'],['35%','55%'],
            ['58%','55%'],['35%','35%'],['68%','65%'],['58%','90%'],['35%','90%'],
          ].map(([cx,cy]) => (
            <circle cx={cx} cy={cy} r="2.5" fill="#D4AF37" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="r" values="2.5;3.5;2.5" dur="1.8s" repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
        {/* Icons array */}
        {((
          icons = [
            { icon: Users, top: '3%', left: '2%', sz: 6, delay: 0 },
            { icon: CreditCard, top: '8%', left: '18%', sz: 5, delay: 0.3 },
            { icon: ShieldCheck, top: '2%', left: '35%', sz: 6, delay: 0.6 },
            { icon: Fingerprint, top: '6%', left: '52%', sz: 5, delay: 0.9 },
            { icon: Handshake, top: '1%', left: '68%', sz: 5, delay: 1.2 },
            { icon: BadgeCheck, top: '5%', left: '85%', sz: 6, delay: 1.5 },
            { icon: DollarSign, top: '16%', left: '4%', sz: 5, delay: 1.8 },
            { icon: Target, top: '12%', left: '28%', sz: 5, delay: 0.4 },
            { icon: FileText, top: '15%', left: '42%', sz: 6, delay: 0.7 },
            { icon: PieChart, top: '10%', left: '58%', sz: 5, delay: 1.0 },
            { icon: Users, top: '14%', left: '75%', sz: 5, delay: 1.3 },
            { icon: CreditCard, top: '18%', left: '92%', sz: 6, delay: 1.6 },
            { icon: ShieldCheck, top: '25%', left: '2%', sz: 5, delay: 0.1 },
            { icon: Fingerprint, top: '28%', left: '16%', sz: 5, delay: 0.5 },
            { icon: Handshake, top: '22%', left: '30%', sz: 6, delay: 0.8 },
            { icon: BadgeCheck, top: '26%', left: '45%', sz: 5, delay: 1.1 },
            { icon: DollarSign, top: '30%', left: '60%', sz: 5, delay: 1.4 },
            { icon: Target, top: '24%', left: '78%', sz: 6, delay: 1.7 },
            { icon: FileText, top: '28%', left: '92%', sz: 5, delay: 0.2 },
            { icon: PieChart, top: '36%', left: '6%', sz: 5, delay: 0.6 },
            { icon: Users, top: '40%', left: '22%', sz: 6, delay: 0.9 },
            { icon: CreditCard, top: '35%', left: '38%', sz: 5, delay: 1.2 },
            { icon: ShieldCheck, top: '42%', left: '52%', sz: 5, delay: 1.5 },
            { icon: Fingerprint, top: '38%', left: '68%', sz: 6, delay: 0.3 },
            { icon: Handshake, top: '44%', left: '85%', sz: 5, delay: 0.7 },
            { icon: BadgeCheck, top: '48%', left: '2%', sz: 5, delay: 1.0 },
            { icon: DollarSign, top: '52%', left: '16%', sz: 6, delay: 1.3 },
            { icon: Target, top: '55%', left: '30%', sz: 5, delay: 1.6 },
            { icon: FileText, top: '50%', left: '45%', sz: 5, delay: 0.1 },
            { icon: PieChart, top: '58%', left: '58%', sz: 6, delay: 0.4 },
            { icon: Users, top: '54%', left: '75%', sz: 5, delay: 0.8 },
            { icon: CreditCard, top: '60%', left: '90%', sz: 5, delay: 1.1 },
            { icon: ShieldCheck, top: '65%', left: '4%', sz: 6, delay: 1.4 },
            { icon: Fingerprint, top: '68%', left: '20%', sz: 5, delay: 1.7 },
            { icon: Handshake, top: '72%', left: '35%', sz: 5, delay: 0.2 },
            { icon: BadgeCheck, top: '66%', left: '50%', sz: 6, delay: 0.5 },
            { icon: DollarSign, top: '70%', left: '65%', sz: 5, delay: 0.9 },
            { icon: Target, top: '75%', left: '80%', sz: 5, delay: 1.2 },
            { icon: FileText, top: '78%', left: '2%', sz: 6, delay: 1.5 },
            { icon: PieChart, top: '82%', left: '16%', sz: 5, delay: 0.3 },
            { icon: Users, top: '85%', left: '30%', sz: 5, delay: 0.6 },
            { icon: CreditCard, top: '80%', left: '48%', sz: 6, delay: 1.0 },
            { icon: ShieldCheck, top: '88%', left: '62%', sz: 5, delay: 1.3 },
            { icon: Fingerprint, top: '84%', left: '78%', sz: 5, delay: 1.6 },
            { icon: Handshake, top: '90%', left: '92%', sz: 6, delay: 0.1 },
            { icon: BadgeCheck, top: '92%', left: '8%', sz: 5, delay: 0.4 },
            { icon: DollarSign, top: '95%', left: '24%', sz: 5, delay: 0.7 },
            { icon: Target, top: '98%', left: '38%', sz: 6, delay: 1.1 },
            { icon: FileText, top: '94%', left: '55%', sz: 5, delay: 1.4 },
            { icon: PieChart, top: '97%', left: '72%', sz: 5, delay: 1.7 },
            { icon: Users, top: '3%', left: '95%', sz: 5, delay: 0.2 },
            { icon: CreditCard, top: '32%', left: '50%', sz: 4, delay: 0.5 },
            { icon: ShieldCheck, top: '18%', left: '65%', sz: 4, delay: 0.8 },
            { icon: Fingerprint, top: '62%', left: '40%', sz: 4, delay: 1.1 },
          ]) => icons.filter((_, i) => !isMobile || i % 3 === 0).map(({ icon: Icon, top, left, sz, delay }, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ top, left }}
              animate={{ y: [0, -(3 + (i % 4) * 2), 0] }}
              transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay }}
            >
              <div
                className="rounded-xl border backdrop-blur-[2px] flex items-center justify-center"
                style={{
                  width: sz * 5 + 'px',
                  height: sz * 5 + 'px',
                  background: 'rgba(5, 150, 105, 0.1)',
                  borderColor: 'rgba(5, 150, 105, 0.18)',
                }}
              >
                <Icon
                  style={{
                    width: sz * 2.5 + 'px',
                    height: sz * 2.5 + 'px',
                    color: 'rgba(4, 120, 87, 0.3)',
                  }}
                />
              </div>
            </motion.div>
          ))
        )()}
      </div>

      {/* ===== HEADER ===== */}
      <header className="w-full bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="/" className="flex items-center gap-4 group flex-shrink-0">
              <div className="w-[68px] h-[68px] flex-shrink-0 flex items-center justify-center">
                <img src="/pp-logo.png" alt="Prosperity Party" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div className="w-[3px] h-9 bg-gradient-to-b from-[#0B5D3B] to-[#D4AF37] rounded-full opacity-50" />
              <div className="flex flex-col gap-0.5">
                <span className="font-black text-base leading-tight tracking-tight text-slate-900 group-hover:text-[#0B5D3B] transition-colors duration-300">
                  Prosperity Party
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0B5D3B]">
                  Dire Dawa Branch Office
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Membership Fee App
                </span>
              </div>
            </a>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="flex min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-4rem)] relative z-10">
        {/* ---------- LEFT: BRAND ILLUSTRATION ---------- */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden p-4">
          <motion.div
            className="relative z-10 w-full bg-white"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <img
              src="/login.png"
              alt="Membership Management"
              className="w-full h-auto"
            />
          </motion.div>
        </div>

        {/* ---------- RIGHT: LOGIN FORM ---------- */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-xl">
              {/* Heading */}
              <div className="text-left mb-10 px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back!</h1>
                <p className="text-gray-600 text-base">Please enter your details.</p>
              </div>

              {/* Error */}
              {error && (
                <div className="mx-8 mb-4 flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
              )}

              {/* Form */}
              <form id="signIn" onSubmit={handleSubmit} className="space-y-7 px-8">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-base font-bold text-gray-900 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@pp-diredawa.org"
                      required
                      className="w-full pl-11 px-4 py-3.5 border-2 rounded-lg outline-none placeholder-gray-400 font-light border-gray-900 focus:ring-[#059669] focus:border-[#059669] transition-all text-base"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-base font-bold text-gray-900 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-11 px-4 py-3.5 pr-12 border-2 rounded-lg outline-none placeholder-gray-400 font-light border-gray-900 focus:ring-[#059669] focus:border-[#059669] transition-all text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 z-10"
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_134_9019)">
                            <path d="M7.78498 15.6516L6.17581 15.22L6.83165 12.7708C5.84995 12.4087 4.93758 11.8811 4.13415 11.2108L2.33998 13.0058L1.16081 11.8266L2.95581 10.0325C1.94254 8.81893 1.26172 7.3631 0.97998 5.80747L2.61998 5.5083C3.25248 9.00997 6.31581 11.6666 9.99998 11.6666C13.6833 11.6666 16.7475 9.00997 17.38 5.5083L19.02 5.80663C18.7386 7.36248 18.0581 8.81861 17.045 10.0325L18.8391 11.8266L17.66 13.0058L15.8658 11.2108C15.0624 11.8811 14.15 12.4087 13.1683 12.7708L13.8241 15.2208L12.215 15.6516L11.5583 13.2016C10.5269 13.3784 9.47302 13.3784 8.44165 13.2016L7.78498 15.6516Z" fill="currentColor"></path>
                          </g>
                          <defs>
                            <clipPath id="clip0_134_9019"><rect width="20" height="20" rx="10" fill="white"></rect></clipPath>
                          </defs>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip1_134_9019)">
                            <path d="M7.78498 15.6516L6.17581 15.22L6.83165 12.7708C5.84995 12.4087 4.93758 11.8811 4.13415 11.2108L2.33998 13.0058L1.16081 11.8266L2.95581 10.0325C1.94254 8.81893 1.26172 7.3631 0.97998 5.80747L2.61998 5.5083C3.25248 9.00997 6.31581 11.6666 9.99998 11.6666C13.6833 11.6666 16.7475 9.00997 17.38 5.5083L19.02 5.80663C18.7386 7.36248 18.0581 8.81861 17.045 10.0325L18.8391 11.8266L17.66 13.0058L15.8658 11.2108C15.0624 11.8811 14.15 12.4087 13.1683 12.7708L13.8241 15.2208L12.215 15.6516L11.5583 13.2016C10.5269 13.3784 9.47302 13.3784 8.44165 13.2016L7.78498 15.6516Z" fill="currentColor"></path>
                          </g>
                          <defs>
                            <clipPath id="clip1_134_9019"><rect width="20" height="20" rx="10" fill="white"></rect></clipPath>
                          </defs>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="outline-none font-sans focus:outline-none overflow-x-hidden overflow-y-hidden text-ellipsis whitespace-nowrap inline-flex items-center gap-2 justify-center active:translate-y-px disabled:!cursor-not-allowed disabled:!opacity-50 md:px-16 px-5 py-3.5 text-base font-medium rounded-[10px] !w-full text-white bg-emerald-700 border-emerald-700 hover:bg-emerald-800 focus:ring-emerald-600 !py-3 sm:!py-3.5 text-lg font-semibold !bg-emerald-700 !border-emerald-700 hover:!bg-emerald-800 focus:!ring-emerald-600"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Loading</span>
                    </>
                  ) : (
                    'Log In'
                  )}
                </button>

                <div className="text-center mt-4">
                  <a href="/" className="inline-flex items-center gap-2 text-base font-black text-gray-900 hover:text-gray-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Home
                  </a>
                </div>

              </form>
            </div>
          </div>
      </main>
    </div>
  )
}
