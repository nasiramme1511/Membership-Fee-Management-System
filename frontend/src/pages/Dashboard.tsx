import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import PageLoader from '../components/PageLoader'
import OrganizationTree from '../components/OrganizationTree'
import { Users, DollarSign, TrendingUp, AlertTriangle, Building2, Bot, Sparkles, Download, FileText, BarChart3, PieChartIcon } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

interface DashboardData {
  summary: {
    totalMembers: number
    activeMembers: number
    yearlyRevenue: number
    monthlyRevenue: number
    pendingPayments: number
    defaultedMembers: number
  }
  sectorPaymentMetrics?: {
    pendingDeposits: number
    approvedDeposits: number
    rejectedDeposits: number
    pendingDepositsCount: number
    approvedDepositsCount: number
    rejectedDepositsCount: number
    totalDeposited: number
    remainingBalance: number
    collectionRate: number
    expectedRevenue: number
    collectedAmount: number
    totalMembers: number
    paidMembers: number
    unpaidMembers: number
  }
  membersByType: Array<{ _id: string; count: number }>
  membersByBranch: Array<{ _id: string; count: number }>
  membersByCluster: Array<{ _id: string; count: number }>
  membersBySector: Array<{ _id: string; count: number }>
  membersByCategory: Array<{ _id: string; count: number }>
  paymentTrend: Array<{ _id: { year: number; month: number }; revenue: number; count: number }>
  topContributors: Array<{ fullName: string; memberId: string; branch: string; contribution: { monthlyFee: number } }>
  revenueByType: Array<{ _id: string; totalRevenue: number }>
  scopedToSector: boolean
}

interface AnalyticsSummary {
  totalMembers: number
  paidMembers: number
  unpaidMembers: number
  totalCollection: number
  completionRate: number
}

interface SectorAnalytics {
  sector: string
  members: number
  paid: number
  unpaid: number
  collectionAmount: number
  collectionRate: number
}

interface AIInsights {
  totalActiveMembers: number
  paidToday: number
  todayRevenue: number
  paidThisMonth: number
  unpaidThisMonth: number
  monthlyRevenue: number
  yearlyPayers: number
  yearlyRevenue: number
  completionRate: number
  topSector: string | null
  topSectorRevenue: number
  insight: string
}

const COLORS = ['#C6930B', '#0F172A', '#1E293B', '#475569', '#EAB308', '#926C08', '#FDE047', '#D1D5DB']
const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function Dashboard() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language || 'am'

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null)
  const [sectorAnalytics, setSectorAnalytics] = useState<SectorAnalytics[]>([])
  const [showSectorChart, setShowSectorChart] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const isSectorOfficer = user?.role === 'sector_officer'

  const fetchAll = () => {
    api.get('/dashboard/stats')
      .then(res => setData(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
    api.get('/analytics/summary')
      .then(res => setAnalyticsSummary(res.data.data))
      .catch(() => {})
    api.get('/analytics/sectors')
      .then(res => setSectorAnalytics(res.data.data))
      .catch(() => {})
  }

  useEffect(() => { fetchAll() }, [refreshKey])

  useEffect(() => {
    api.get('/ai/dashboard')
      .then(res => setAiInsights(res.data.data))
      .catch(() => {})
  }, [])

  // Poll every 10s for real-time updates
  useEffect(() => {
    const id = setInterval(() => setRefreshKey(k => k + 1), 10000)
    return () => clearInterval(id)
  }, [])

  // Refresh on window focus
  useEffect(() => {
    const onFocus = () => setRefreshKey(k => k + 1)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Listen for cross-page refresh signals (from Payments.tsx via localStorage)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dashboardRefresh') setRefreshKey(k => k + 1)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Same-tab immediate refresh via custom event
  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('dashboard-updated', handler)
    return () => window.removeEventListener('dashboard-updated', handler)
  }, [])

  const exportReport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    try {
      const res = await api.get(`/reports/export?format=${format}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `membership-report.${format}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  if (loading) {
    return <PageLoader message={t('common.analytics_loading')} />
  }

  if (!data) {
    return <div className="text-center text-rose-500 py-20 font-bold">{t('common.dashboard_fail')}</div>
  }

  const statCards = [
    {
      title: isSectorOfficer ? t('common.sector_members') : t('common.total_members'),
      value: analyticsSummary?.totalMembers ?? data.summary.totalMembers,
      icon: Users,
      color: 'text-slate-900 dark:text-white',
      bgColor: 'bg-white dark:bg-slate-900',
      borderColor: 'border-slate-200 dark:border-slate-800',
      subtext: `${data.summary.activeMembers} ${t('common.active')} ${t('common.members')}`
    },
    {
      title: t('common.paid_members'),
      value: analyticsSummary?.paidMembers ?? 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-white dark:bg-slate-900',
      borderColor: 'border-emerald-100 dark:border-emerald-900/30',
      subtext: `${analyticsSummary?.completionRate ?? 0}% ${t('common.completion_rate')}`
    },
    {
      title: t('common.unpaid_members'),
      value: analyticsSummary?.unpaidMembers ?? data.summary.pendingPayments,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-white dark:bg-slate-900',
      borderColor: 'border-rose-100 dark:border-rose-900/30',
      subtext: `${data.summary.defaultedMembers} ${t('common.inactive')}`
    },
    {
      title: t('common.collected_revenue'),
      value: `ETB ${Number(analyticsSummary?.totalCollection ?? data.summary.yearlyRevenue).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-[var(--gold)]',
      bgColor: 'bg-white dark:bg-slate-900',
      borderColor: 'border-[var(--gold)]/30',
      subtext: `ETB ${Number(data.summary.monthlyRevenue).toLocaleString()} ${t('common.just_now')}`
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, rotateX: 20, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: { type: "spring", bounce: 0.4 } as any
    }
  }

  const paidVsUnpaid = analyticsSummary ? [
    { name: t('common.paid'), value: analyticsSummary.paidMembers },
    { name: t('common.unpaid'), value: analyticsSummary.unpaidMembers }
  ] : []

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
      style={{ perspective: 1000 }}
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
            <span className="text-[var(--gold)]">{t('common.app_title')}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-2 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {currentLang === 'am' ? 'የድሬዳዋ አስተዳደር መንግስት ተቋማት' : 'Dire Dawa Administration Institutions'}
            </span>
          </h1>
          {user?.role === 'admin' && (
            <p className="text-[11px] text-slate-500 font-medium">
              {currentLang === 'am'
                ? 'የድሬዳዋ አስተዳደር መንግስት ተቋማት የአባልነት መዋጮ አስተዳደር ስርዓት'
                : 'Dire Dawa Administration Institutions membership contribution management system'
              }
            </p>
          )}
          {user?.role === 'sector_officer' && (
            <p className="text-[11px] text-slate-500 font-medium">
              {currentLang === 'am' ? 'ዘርፍ' : 'Sector'}: <span className="text-[var(--gold)] font-bold">{user?.assignedSectorUnit?.name || 'Assigned Sector'}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportReport('pdf')} className="btn btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => exportReport('csv')} className="btn btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", bounce: 0.6 }}
            className={`card border-b-2 ${card.borderColor} flex flex-col gap-2 group shadow-[0_10px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all relative overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-[var(--navy)] transition-colors`}>
                <card.icon className={`w-4 h-4 ${card.color} group-hover:text-white`} />
              </div>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('common.live')}</span>
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{card.value}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{card.title}</p>
            </div>
            <p className="text-[9px] font-medium text-slate-400 border-t border-slate-50 dark:border-slate-800 pt-1.5 mt-1 relative z-10">
              {card.subtext}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Sector Payment Metrics Grid */}
      {data.sectorPaymentMetrics && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} className="card border-b-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('common.expected_revenue')}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">ETB {Number(data.sectorPaymentMetrics.expectedRevenue).toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{t('common.total_members')}: {data.sectorPaymentMetrics.totalMembers}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="card border-b-2 border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-slate-900">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('common.collected_revenue')}</p>
            <p className="text-xl font-black text-emerald-600">ETB {Number(data.sectorPaymentMetrics.collectedAmount).toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{t('common.paid_members')}: {data.sectorPaymentMetrics.paidMembers}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="card border-b-2 border-[var(--gold)]/30 bg-white dark:bg-slate-900">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('common.total_deposited')}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">ETB {Number(data.sectorPaymentMetrics.totalDeposited).toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{t('common.approved_deposits')}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="card border-b-2 border-blue-200 dark:border-blue-900/30 bg-white dark:bg-slate-900">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('common.pending_approvals')}</p>
            <p className="text-xl font-black text-blue-600">{data.sectorPaymentMetrics.pendingDepositsCount}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{t('common.waiting_review')}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="card border-b-2 border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-slate-900">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('common.approved_deposits')}</p>
            <p className="text-xl font-black text-emerald-600">ETB {Number(data.sectorPaymentMetrics.approvedDeposits).toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{data.sectorPaymentMetrics.approvedDepositsCount} {t('common.deposits')}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="card border-b-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('common.remaining_balance')}</p>
            <p className={`text-xl font-black ${data.sectorPaymentMetrics.remainingBalance > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              ETB {Number(data.sectorPaymentMetrics.remainingBalance).toLocaleString()}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">{t('common.collection_rate')}: {data.sectorPaymentMetrics.collectionRate}%</p>
          </motion.div>
        </motion.div>
      )}

      {/* AI Insights Widget */}
      {aiInsights && (
        <motion.div variants={itemVariants}>
          <div className="card bg-gradient-to-r from-amber-50 to-amber-50/30 dark:from-amber-950/20 dark:to-slate-900 border-amber-200 dark:border-amber-900/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start gap-4 relative">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">AI Insights</h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[8px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Live
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[18px] font-black text-slate-900 dark:text-white">{aiInsights.paidToday}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Paid Today</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-black text-emerald-600">ETB {Number(aiInsights.todayRevenue).toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Today's Revenue</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-black text-rose-600">{aiInsights.unpaidThisMonth}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Unpaid This Month</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-black text-blue-600">{aiInsights.completionRate}%</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Completion Rate</p>
                  </div>
                </div>
                {aiInsights.insight && (
                  <div className="mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-900/20">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      {aiInsights.insight}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Row 1 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Trend */}
        <motion.div whileHover={{ scale: 1.01 }} className="card">
          <h3 className="text-lg font-semibold mb-4">{t('common.revenue_trend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.paymentTrend.slice(-12)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id.month"
                tickFormatter={(m) => t(`common.eth_month_${m}`)}
              />
              <YAxis />
              <Tooltip formatter={(value: number) => `ETB ${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Paid vs Unpaid */}
        {paidVsUnpaid.length > 0 && (
          <motion.div whileHover={{ scale: 1.01 }} className="card">
            <h3 className="text-lg font-semibold mb-4">Paid vs Unpaid Members</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paidVsUnpaid}
                  cx="50%" cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paidVsUnpaid.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isSectorOfficer && (
          <motion.div whileHover={{ scale: 1.01 }} className="card">
            <h3 className="text-lg font-semibold mb-4">{t('common.members_by_unit')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.membersByBranch}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} tickFormatter={(v) => t(v)} />
                <YAxis />
                <Tooltip formatter={(value, name, props) => [value, t(props.payload._id)]} />
                <Bar dataKey="count" fill="#0ea5e9" name={t('common.members')} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {!isSectorOfficer ? (
          <motion.div whileHover={{ scale: 1.01 }} className="card">
            <h3 className="text-lg font-semibold mb-4">{t('common.members_by_type')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.membersByCluster.map((d: any) => ({
                    ...d,
                    _id: d._id === 'Institution' ? t('common.institution')
                       : d._id === 'Rural Cluster' ? t('common.rural')
                       : d._id === 'Urban Woreda' ? t('common.urban')
                       : d._id === 'Secondary School' ? t('common.secondary_school')
                       : d._id === 'Health Institution' ? t('common.health_institution')
                       : d._id || 'N/A'
                  }))}
                  cx="50%" cy="50%"
                  labelLine={false}
                  label={({ _id, percent }: any) => `${t(_id)} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.membersByCluster.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0ea5e9' : index === 1 ? '#22c55e' : '#f59e0b'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [value, t(props.payload._id)]} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <motion.div whileHover={{ scale: 1.01 }} className="card">
            <h3 className="text-lg font-semibold mb-4">{t('common.members_by_category')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.membersByCategory?.length ? data.membersByCategory : data.membersByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} tickFormatter={(v) => t(v)} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value, name, props) => [value, t(props.payload._id)]} />
                <Bar dataKey="count" name={t('common.members')} radius={[4, 4, 0, 0]}>
                  {(data.membersByCategory?.length ? data.membersByCategory : data.membersByType).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </motion.div>

      {/* Sector Performance Chart */}
      {sectorAnalytics.length > 0 && (
        <motion.div variants={itemVariants}>
          <motion.div whileHover={{ scale: 1.01 }} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sector Performance</h3>
              <button
                onClick={() => setShowSectorChart(!showSectorChart)}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                {showSectorChart ? 'Show Table' : 'Show Chart'}
              </button>
            </div>
            {showSectorChart ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorAnalytics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="sector" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="collectionRate" name="Collection Rate %" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 px-2 font-bold text-slate-500 uppercase tracking-wider">Sector</th>
                      <th className="text-right py-2 px-2 font-bold text-slate-500 uppercase tracking-wider">Members</th>
                      <th className="text-right py-2 px-2 font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                      <th className="text-right py-2 px-2 font-bold text-slate-500 uppercase tracking-wider">Unpaid</th>
                      <th className="text-right py-2 px-2 font-bold text-slate-500 uppercase tracking-wider">Collection</th>
                      <th className="text-right py-2 px-2 font-bold text-slate-500 uppercase tracking-wider">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorAnalytics.map((s, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-2 font-medium">{s.sector}</td>
                        <td className="text-right py-2 px-2">{s.members}</td>
                        <td className="text-right py-2 px-2 text-emerald-600 font-medium">{s.paid}</td>
                        <td className="text-right py-2 px-2 text-rose-600 font-medium">{s.unpaid}</td>
                        <td className="text-right py-2 px-2">ETB {s.collectionAmount.toLocaleString()}</td>
                        <td className="text-right py-2 px-2">
                          <span className={`font-bold ${s.collectionRate >= 75 ? 'text-emerald-600' : s.collectionRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {s.collectionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Top Contributors & Revenue by Type */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div whileHover={{ scale: 1.01 }} className="card">
          <h3 className="text-lg font-semibold mb-4">{t('common.top_contributors')}</h3>
          <div className="space-y-3">
            {data.topContributors.length === 0 ? (
              <p className="text-center text-gray-400 py-6">{t('common.no_contributors')}</p>
            ) : (
              data.topContributors.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{member.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.memberId} &middot; {member.branch}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600 text-sm">ETB {member.contribution.monthlyFee.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {!isSectorOfficer && (
          <motion.div whileHover={{ scale: 1.01 }} className="card">
            <h3 className="text-lg font-semibold mb-4">{t('common.revenue_by_type')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(value: number) => `ETB ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#22c55e" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </motion.div>

      {/* Members by Sector */}
      {!isSectorOfficer && data.membersBySector?.length > 0 && (
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="card">
          <h3 className="text-lg font-semibold mb-4">{t('common.members_by_sector')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.membersBySector.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" name={t('common.members')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Organization Hierarchy Tree */}
      {!isSectorOfficer && (
        <motion.div variants={itemVariants}>
          <OrganizationTree />
        </motion.div>
      )}
    </motion.div>
  )
}
