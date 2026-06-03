import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Bot, User, Sparkles, Download, Trash2, Loader2, Brain,
  Copy, Check, Volume2, VolumeX, History, Menu, X, ArrowUpRight,
  TrendingUp, Users, Building2, BarChart2, PieChart as PieIcon,
  HelpCircle, Calendar, MessageSquare
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend
} from 'recharts'

interface AIStructuredResponse {
  title: string
  intent: 'trend_analysis' | 'comparison' | 'member_lookup' | 'sector_analysis'
  summary: string
  metrics?: {
    totalCollected: number
    totalExpected: number
    completionRate: number
  }
  chartType: 'line' | 'pie' | 'bar' | 'table'
  chartData: any[]
  tableData: any[]
  recommendations: string[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  structuredData?: AIStructuredResponse
  timestamp: Date
}

interface HistoryLog {
  id: number
  userId: number
  question: string
  response: AIStructuredResponse
  timestamp: string
  userFullName?: string
  userRole?: string
}

const WELCOME: Record<string, string> = {
  en: 'Hello! I am your AI Assistant for the Membership Fee Management System. Ask me anything about members, payments, sectors, or reports.',
  am: 'ሰላም! እኔ የአባልነት መዋጮ አስተዳደር ስርዓት የ AI ረዳት ነኝ። ስለ አባላት፣ ክፍያዎች፣ ዘርፎች ወይም ሪፖርቶች ማንኛውንም ነገር ይጠይቁኝ።',
  om: 'Akkam! Ani gargaaraa AI sirna Bulchiinsa Miseensummaa fi Gumaacha keesani. Waa\'ee miseensotaa, kaffaltii, sektarii, ykn gabaasaa waan ta\'e gaafadhaa.'
}

const CATEGORIZED_SUGGESTIONS: Record<string, Record<string, string[]>> = {
  en: {
    General: ['How many active members?', 'Generate monthly report'],
    Payments: ['How many members paid this month?', 'What is total contribution this year?', 'Show payment trend'],
    Members: ['Show unpaid members', 'Show members who have not paid for 3 months'],
    Sectors: ['Which sector has the highest collection rate?', 'Show sector performance']
  },
  am: {
    General: ['ስንት ንቁ አባላት አሉ?', 'ወርሃዊ ሪፖርት ፍጠር'],
    Payments: ['በዚህ ወር ስንት አባላት ከፍለዋል?', 'በዚህ አመት ጠቅላላ መዋጮ ስንት ነው?', 'የክፍያ አዝማሚያ አሳይ'],
    Members: ['ያልከፈሉ አባላት አሳይ', 'ለ3 ወራት ያልከፈሉ አባላት አሳይ'],
    Sectors: ['የትኛው ዘርፍ ከፍተኛ የመሰብሰብ መጠን አለው?', 'የዘርፍ አፈጻጸም አሳይ']
  },
  om: {
    General: ['Miseensonni hojiirra jiran meeqa?', 'Gabatee ji\'aa uumi'],
    Payments: ['Ji\'a kana miseensonni meeqa kaffalan?', 'Gumaacha waliigalaa bara kanaa meeqa?', 'Haala kaffaltii argisiisi'],
    Members: ['Miseensota hin kaffalin argisiisi', 'Miseensota ji\'a 3 hin kaffalin argisiisi'],
    Sectors: ['Sektarii kam baay\'ina walitti qabuu ol\'aanaa qaba?', 'Hojiirra oolmaa sektarii argisiisi']
  }
}

const THINKING: Record<string, string> = {
  en: 'Analyzing system metrics...',
  am: 'የስርዓት መለኪያዎችን በመተንተን ላይ...',
  om: 'Meeqa qorachaa jira...'
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function AIAssistant() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const currentLang = i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'

  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME[currentLang] || WELCOME.en, timestamp: new Date() }
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [activeTab, setActiveTab] = useState('General')
  
  // History Sidebar states
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // UX actions states
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const tabs = Object.keys(CATEGORIZED_SUGGESTIONS[currentLang] || CATEGORIZED_SUGGESTIONS.en)
  const suggestions = CATEGORIZED_SUGGESTIONS[currentLang]?.[activeTab] || CATEGORIZED_SUGGESTIONS.en[activeTab] || []

  // Load chat logs from backend
  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await api.get('/ai/history')
      if (res.data && res.data.success) {
        setHistoryLogs(res.data.data)
      }
    } catch (err) {
      console.error('Error fetching AI history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setShowSuggestions(false)
    setLoading(true)

    try {
      const res = await api.post('/ai/chat', { message: messageText, language: currentLang })
      const structuredData: AIStructuredResponse = res.data.data

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: structuredData.summary,
        structuredData,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      fetchHistory() // Refresh logs sidebar
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: err.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleReloadHistory = (log: HistoryLog) => {
    const userMsg: Message = {
      id: `hist-u-${log.id}`,
      role: 'user',
      content: log.question,
      timestamp: new Date(log.timestamp)
    }

    const aiMsg: Message = {
      id: `hist-a-${log.id}`,
      role: 'assistant',
      content: log.response.summary,
      structuredData: log.response,
      timestamp: new Date(log.timestamp)
    }

    setMessages([
      { id: 'welcome', role: 'assistant', content: WELCOME[currentLang] || WELCOME.en, timestamp: new Date() },
      userMsg,
      aiMsg
    ])
    setShowSuggestions(false)
    setSidebarOpen(false) // Close drawer on mobile
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearConversation = () => {
    setMessages([
      { id: 'welcome', role: 'assistant', content: WELCOME[currentLang] || WELCOME.en, timestamp: new Date() }
    ])
    setShowSuggestions(true)
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSpeak = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
        if (isSpeakingId === id) {
          setIsSpeakingId(null)
          return
        }
      }

      const utterance = new SpeechSynthesisUtterance(text)
      const isAmharic = /[\u1200-\u137F]/.test(text)
      if (isAmharic) utterance.lang = 'am-ET'
      
      utterance.onend = () => setIsSpeakingId(null)
      utterance.onerror = () => setIsSpeakingId(null)
      
      setIsSpeakingId(id)
      window.speechSynthesis.speak(utterance)
    } else {
      alert('Speech synthesis is not supported on this browser.')
    }
  }

  // Helper to render Intent Badges
  const renderIntentBadge = (intent: string) => {
    const badges: Record<string, { label: string; style: string; icon: any }> = {
      trend_analysis: { label: 'Trend Analysis', style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: TrendingUp },
      comparison: { label: 'Comparative Study', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', icon: BarChart2 },
      member_lookup: { label: 'Member Lookup', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: Users },
      sector_analysis: { label: 'Sector Analysis', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Building2 }
    }
    const currentBadge = badges[intent] || { label: 'General Query', style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', icon: HelpCircle }
    const Icon = currentBadge.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold tracking-wide ${currentBadge.style}`}>
        <Icon className="w-3.5 h-3.5" />
        {currentBadge.label}
      </span>
    )
  }

  // Dynamic visual charts selector
  const renderVisualChart = (chartType: string, chartData: any[]) => {
    if (!chartData || chartData.length === 0) return null

    switch (chartType) {
      case 'line':
        return (
          <div className="w-full h-[280px] bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(30, 41, 59, 0.9)', color: '#fff', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={3} name="Total (ETB)" activeDot={{ r: 6 }} />
                {chartData[0] && 'payers' in chartData[0] && (
                  <Line type="monotone" dataKey="payers" stroke="#10b981" strokeWidth={2} name="Payers count" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      case 'pie':
        return (
          <div className="w-full h-[280px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(30, 41, 59, 0.9)', color: '#fff', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )
      case 'bar':
        return (
          <div className="w-full h-[280px] bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, bottom: 5, left: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(30, 41, 59, 0.9)', color: '#fff', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                {chartData[0] && 'rate' in chartData[0] && (
                  <Bar dataKey="rate" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Rate (%)" />
                )}
                {chartData[0] && 'revenue' in chartData[0] && (
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue (ETB)" />
                )}
                {chartData[0] && 'value' in chartData[0] && (
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Count" />
                )}
                {chartData[0] && 'amount' in chartData[0] && (
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Amount (ETB)" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      default:
        return null
    }
  }

  // Dynamic tables layout
  const renderDataTable = (tableData: any[]) => {
    if (!tableData || tableData.length === 0) return null

    // Determine headers based on available fields
    const sample = tableData[0]
    const keys = Object.keys(sample).filter(k => k !== 'id' && k !== 'membersList')

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/20 max-h-[300px] custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0">
            <tr>
              {keys.map((key) => (
                <th key={key} className="px-4 py-2.5 capitalize">{key.replace(/([A-Z])/g, ' $1')}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {tableData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                {keys.map((key) => {
                  const val = row[key]
                  return (
                    <td key={key} className="px-4 py-2.5 whitespace-nowrap font-medium">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6 relative overflow-hidden">
      
      {/* 1. History Sidebar (collapsible drawer on mobile, persistent column on large screens) */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`w-[280px] shrink-0 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 flex flex-col z-30 absolute lg:static top-0 bottom-0 left-0 shadow-xl lg:shadow-none h-full`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                Query History
              </h3>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No past analytics queries
                </div>
              ) : (
                historyLogs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => handleReloadHistory(log)}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/20 hover:border-amber-300 dark:hover:border-amber-700/60 hover:bg-amber-50/20 dark:hover:bg-slate-800/50 transition-all group"
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      {log.question}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-[9px] text-slate-400 font-medium">
                      <span>{log.response?.title || 'Report'}</span>
                      <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Panel Container */}
      <div className="flex-1 flex flex-col h-full bg-white/40 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800/40 backdrop-blur-md rounded-2xl p-4 shadow-sm overflow-hidden relative">
        
        {/* Toggle Sidebar Buttons & Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors shrink-0"
              title="Toggle sidebar history"
            >
              <Menu className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-md shadow-amber-500/10">
                <Brain className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none">AI Analytics Dashboard</h2>
                <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mt-1 inline-block">SYSTEM KNOWLEDGE INSTANT AGENT</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={clearConversation} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:border-red-200 dark:hover:border-red-800/40 transition-colors" title="Clear thread">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar mb-4">
          <AnimatePresence>
            {messages.map((msg) => {
              const isUser = msg.role === 'user'
              const responseData = msg.structuredData

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-col lg:flex-row'}`}
                >
                  {/* User/Bot Avatar Icon */}
                  <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                    isUser
                      ? 'bg-slate-800 dark:bg-slate-700'
                      : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                  }`}>
                    {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4.5 h-4.5 text-white" />}
                  </div>

                  <div className={`max-w-full ${isUser ? 'max-w-[75%]' : 'flex-1'} flex flex-col`}>
                    
                    {/* User messages bubbles */}
                    {isUser ? (
                      <div className="bg-amber-500 text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-sm font-medium shadow-sm shadow-amber-500/10 leading-relaxed">
                        {msg.content}
                      </div>
                    ) : (
                      /* AI Glassmorphic response card layout */
                      <div className="w-full bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-slate-200/70 dark:border-slate-800/60 rounded-2xl p-6 shadow-lg shadow-slate-100/10 dark:shadow-none space-y-5">
                        
                        {/* Intent & Controls Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                          {responseData?.intent && renderIntentBadge(responseData.intent)}
                          
                          {/* Copy & TTS actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSpeak(msg.id, responseData?.summary || msg.content)}
                              className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isSpeakingId === msg.id ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                              title={isSpeakingId === msg.id ? 'Mute AI Summary Voice' : 'Read AI Summary Out Loud'}
                            >
                              {isSpeakingId === msg.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleCopy(msg.id, responseData ? JSON.stringify(responseData, null, 2) : msg.content)}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                              title="Copy response payload JSON"
                            >
                              {copiedId === msg.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Title Header */}
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            {responseData?.title || 'System Response'}
                            <ArrowUpRight className="w-4 h-4 text-slate-300" />
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">Verified audit-grade output</span>
                        </div>

                        {/* Summary Narrative */}
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-normal bg-slate-50/40 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/40">
                          {responseData?.summary || msg.content}
                        </p>

                        {/* Metric Cards Grid */}
                        {responseData?.metrics && (responseData.metrics.totalCollected > 0 || responseData.metrics.totalExpected > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/10 dark:to-slate-900 border border-emerald-500/10">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Total Collected</span>
                              <span className="text-lg font-black text-slate-900 dark:text-emerald-300 block mt-1">ETB {Number(responseData.metrics.totalCollected).toLocaleString()}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/10 dark:to-slate-900 border border-blue-500/10">
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Total Expected</span>
                              <span className="text-lg font-black text-slate-900 dark:text-blue-300 block mt-1">ETB {Number(responseData.metrics.totalExpected).toLocaleString()}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-amber-950/10 dark:to-slate-900 border border-amber-500/10">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Collection Rate</span>
                              <span className="text-lg font-black text-slate-900 dark:text-amber-300 block mt-1">{responseData.metrics.completionRate}%</span>
                            </div>
                          </div>
                        )}

                        {/* Visual Chart Section */}
                        {responseData?.chartType && responseData.chartType !== 'table' && responseData.chartData && responseData.chartData.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Interactive Visualization</span>
                            {renderVisualChart(responseData.chartType, responseData.chartData)}
                          </div>
                        )}

                        {/* Tables Section */}
                        {responseData?.tableData && responseData.tableData.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Tabular Metrics</span>
                            {renderDataTable(responseData.tableData)}
                          </div>
                        )}

                        {/* Recommendations */}
                        {responseData?.recommendations && responseData.recommendations.length > 0 && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2.5">System Recommendations</span>
                            <ul className="space-y-2.5">
                              {responseData.recommendations.map((rec, i) => (
                                <li key={i} className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                  <div className="shrink-0 w-5 h-5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">
                                    {i + 1}
                                  </div>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      </div>
                    )}
                    
                    <span className={`text-[9px] text-slate-400 mt-1.5 px-2 ${isUser ? 'self-end' : 'self-start'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Thinking loading state */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="bg-white/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/30 backdrop-blur rounded-2xl rounded-tl-none p-5 shadow-md flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="text-xs font-semibold text-slate-500">{THINKING[currentLang] || THINKING.en}</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion tabs & badges */}
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 space-y-3"
          >
            {/* Category selection tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-1 gap-4 overflow-x-auto select-none no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-xs font-bold transition-all relative shrink-0 ${
                    activeTab === tab
                      ? 'text-amber-500'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Sugesstions pill actions */}
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-800 hover:text-amber-600 dark:hover:text-amber-400 hover:shadow-sm transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Chat input panel */}
        <div className="relative">
          <div className="flex items-end gap-2 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur rounded-2xl p-2.5 shadow-sm focus-within:ring-2 focus-within:ring-amber-500/25 focus-within:border-amber-500 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentLang === 'am' ? 'ስለ አባላት፣ ክፍያዎች፣ ዘርፎች ጥያቄ ይጠይቁ...' : currentLang === 'om' ? 'Waa\'ee miseensotaa, kaffaltii, sektarkota gaafadhaa...' : 'Ask a question about members, payments, sectors...'}
              rows={1}
              className="flex-1 px-3 py-2 bg-transparent border-0 outline-none resize-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 max-h-32 focus:ring-0"
              style={{ scrollbarWidth: 'thin' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/10 transition-all shrink-0"
            >
              {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
            </button>
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 text-center font-medium">
            AI analytics dashboards are constructed instantly. Verify critical information.
          </p>
        </div>

      </div>
    </div>
  )
}
