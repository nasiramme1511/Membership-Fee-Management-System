import { useState, useEffect, useMemo } from 'react'
import api from '../lib/api'
import { useTranslation } from 'react-i18next'
import { Download, FileText, Filter, Wallet, Banknote, Building2, AlertTriangle, Users, Search, Printer } from 'lucide-react'
import { motion } from 'framer-motion'
import PageLoader from '../components/PageLoader'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getCurrentEthiopianPeriod, ETHIOPIAN_MONTHS_EN_LIST } from '../utils/ethiopianCalendar'

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
const ITEMS_PER_PAGE = 10

export default function Reports() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [monthlyData, setMonthlyData] = useState<any>(null)
  const [yearlyData, setYearlyData] = useState<any>(null)
  const [quarterlyData, setQuarterlyData] = useState<any>(null)
  const [hqBranch, setHqBranch] = useState<any>(null)
  const [defaulters, setDefaulters] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('monthly')
  const [selectedMonth, setSelectedMonth] = useState(getCurrentEthiopianPeriod().month)
  const [selectedYear, setSelectedYear] = useState(getCurrentEthiopianPeriod().year)
  const [sectorTypes, setSectorTypes] = useState<any[]>([])
  const [selectedSectorType, setSelectedSectorType] = useState('')
  const [sectors, setSectors] = useState<any[]>([])
  const [selectedSectorId, setSelectedSectorId] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  const [sectorReportData, setSectorReportData] = useState<any>(null)
  const [sectorReportLoading, setSectorReportLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    api.get('/sector-types').then(res => setSectorTypes(res.data))
  }, [])

  useEffect(() => {
    if (selectedSectorType) {
      api.get(`/sectors?type=${selectedSectorType}`).then(res => setSectors(res.data))
    } else {
      setSectors([])
    }
  }, [selectedSectorType])

  useEffect(() => {
    if (selectedSectorId) {
      api.get(`/sectors/${selectedSectorId}/categories`).then(res => setCategories(res.data)).catch(() => {})
    } else {
      setCategories([])
    }
  }, [selectedSectorId])

  useEffect(() => {
    if (reportType === 'sectors') {
      fetchSectorReport()
    } else {
      fetchReports()
    }
  }, [reportType, selectedMonth, selectedYear, selectedSectorType, selectedSectorId, selectedCategoryId, paymentStatus])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const fetchSectorReport = async () => {
    setSectorReportLoading(true)
    try {
      const params: Record<string, any> = { month: selectedMonth, year: selectedYear }
      if (selectedSectorType) params.sectorType = selectedSectorType
      if (selectedSectorId) params.sectorId = selectedSectorId
      if (selectedCategoryId) params.memberCategoryId = selectedCategoryId
      if (paymentStatus) params.paymentStatus = paymentStatus
      const res = await api.get('/reports/sectors', { params })
      setSectorReportData(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setSectorReportLoading(false)
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const filterParams: Record<string, any> = {}
      if (selectedSectorType) filterParams.sectorType = selectedSectorType
      if (selectedSectorId) filterParams.sectorId = selectedSectorId
      if (selectedCategoryId) filterParams.memberCategoryId = selectedCategoryId
      if (reportType === 'monthly') {
        const res = await api.get('/reports/monthly-revenue', {
          params: { month: selectedMonth, year: selectedYear, ...filterParams }
        })
        setMonthlyData(res.data.data)
      } else if (reportType === 'yearly') {
        const res = await api.get('/reports/yearly-revenue', {
          params: { year: selectedYear, ...filterParams }
        })
        setYearlyData(res.data.data)
      } else if (reportType === 'quarterly') {
        const res = await api.get('/reports/quarterly-revenue', {
          params: { year: selectedYear, ...filterParams }
        })
        setQuarterlyData(res.data.data)
      } else if (reportType === 'hq-branch') {
        const res = await api.get('/reports/hq-branch', {
          params: { year: selectedYear, ...filterParams }
        })
        setHqBranch(res.data.data)
      } else if (reportType === 'defaulters') {
        const res = await api.get('/reports/defaulters', { params: filterParams })
        setDefaulters(res.data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const filterParams: Record<string, any> = {}
      if (selectedSectorType) filterParams.sectorType = selectedSectorType
      if (selectedSectorId) filterParams.sectorId = selectedSectorId
      if (selectedCategoryId) filterParams.memberCategoryId = selectedCategoryId
      filterParams.month = selectedMonth
      filterParams.year = selectedYear

      // Context-aware export: defaulters -> unpaid; revenue reports -> paid; otherwise all
      if (reportType === 'defaulters') {
        filterParams.paymentStatus = 'unpaid'
      } else if (['monthly', 'yearly', 'quarterly', 'hq-branch'].includes(reportType)) {
        filterParams.paymentStatus = 'paid'
      }

      const res = await api.get('/reports/export', { params: filterParams })
      const data = res.data.data
      
      const XLSX = await import('xlsx')
      
      const membersWs = XLSX.utils.json_to_sheet(data.members)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, membersWs, 'Members')
      
      const paymentsWs = XLSX.utils.json_to_sheet(data.payments)
      XLSX.utils.book_append_sheet(wb, paymentsWs, 'Payments')
      
      const receiptsWs = XLSX.utils.json_to_sheet(data.receipts)
      XLSX.utils.book_append_sheet(wb, receiptsWs, 'Receipts')
      
      const now = new Date()
      XLSX.writeFile(wb, `PP-Dire-Dawa-Branch-Full-Report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSectorExport = async () => {
    if (!sectorReportData?.sectors) return
    const XLSX = await import('xlsx')

    const rows = sectorReportData.sectors.map((s: any) => ({
      [t('common.sector_name')]: s.sectorName,
      [t('common.total_members')]: s.totalMembers,
      [t('common.paid_members')]: s.paidMembers,
      [t('common.unpaid_members')]: s.unpaidMembers,
      [t('common.total_revenue')]: s.totalRevenue,
      [t('common.payment_percentage')]: `${s.paymentPercentage}%`
    }))

    rows.push({
      [t('common.sector_name')]: 'TOTAL',
      [t('common.total_members')]: sectorReportData.summary.totalMembers,
      [t('common.paid_members')]: sectorReportData.summary.totalPaidMembers,
      [t('common.unpaid_members')]: sectorReportData.summary.totalUnpaidMembers,
      [t('common.total_revenue')]: sectorReportData.summary.totalRevenue,
      [t('common.payment_percentage')]: `${sectorReportData.summary.overallCollectionRate}%`
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sector Report')

    const now = new Date()
    XLSX.writeFile(wb, `PP-Sector-Report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`)
  }

  const handlePrint = () => {
    window.print()
  }

  const filteredSectors = useMemo(() => {
    if (!sectorReportData?.sectors) return []
    let result = sectorReportData.sectors
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((s: any) => s.sectorName.toLowerCase().includes(q))
    }
    return result
  }, [sectorReportData, searchQuery])

  const totalPages = Math.ceil(filteredSectors.length / ITEMS_PER_PAGE)
  const paginatedSectors = filteredSectors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">{t('common.reports')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('common.financial_audit_reports')}</p>
        </div>
        <div className="flex gap-2">
          {reportType === 'sectors' ? (
            <>
              <button onClick={handleSectorExport} className="btn btn-primary flex items-center gap-2">
                <Download className="w-4 h-4" />
                {t('common.export_excel')}
              </button>
              <button onClick={handlePrint} className="btn btn-secondary flex items-center gap-2">
                <Printer className="w-4 h-4" />
                {t('common.print')}
              </button>
            </>
          ) : (
            <button onClick={handleExport} className="btn btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              {t('common.export_excel')}
            </button>
          )}
        </div>
      </div>

      {reportType === 'sectors' && sectorReportData && !sectorReportLoading && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: t('common.total_members'), value: sectorReportData.summary.totalMembers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: t('common.total_paid'), value: sectorReportData.summary.totalPaidMembers.toLocaleString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: t('common.total_unpaid'), value: sectorReportData.summary.totalUnpaidMembers.toLocaleString(), icon: Users, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
            { label: t('common.total_revenue'), value: `ETB ${sectorReportData.summary.totalRevenue.toLocaleString()}`, icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: t('common.collection_rate'), value: `${sectorReportData.summary.overallCollectionRate}%`, icon: Banknote, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' }
          ].map((s, idx) => (
            <div key={idx} className="card flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <div className="min-w-0">
                <p className="text-lg font-bold truncate">{s.value}</p>
                <p className="text-[10px] text-gray-500 truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="font-medium">{t('common.report_type')}:</span>
          </div>
          <select
            value={reportType}
            onChange={(e) => { setReportType(e.target.value); setPaymentStatus('') }}
            className="input"
          >
            <option value="monthly">{t('common.monthly_revenue')}</option>
            <option value="yearly">{t('common.yearly_revenue')}</option>
            <option value="quarterly">{t('common.quarterly_revenue')}</option>
            <option value="hq-branch">{t('common.hq_vs_branch')}</option>
            <option value="defaulters">{t('common.defaulter_report')}</option>
            <option value="sectors">{t('common.sector_report')}</option>
          </select>

          {user?.role !== 'sector_officer' && (
            <select
              value={selectedSectorType}
              onChange={(e) => { setSelectedSectorType(e.target.value); setSelectedSectorId(''); setSelectedCategoryId(''); }}
              className="input"
            >
              <option value="">{t('common.all_sector_types')}</option>
              {sectorTypes.map(t_obj => (
                <option key={t_obj.id} value={t_obj.name}>
                  {t_obj.name === 'Institution' ? t('common.institution')
                    : t_obj.name === 'Rural Cluster' ? t('common.rural')
                    : t_obj.name === 'Urban Woreda' ? t('common.urban')
                    : t_obj.name === 'Secondary School' ? t('common.secondary_school')
                    : t_obj.name === 'Health Institution' ? t('common.health_institution')
                    : t_obj.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedSectorId}
            onChange={(e) => { setSelectedSectorId(e.target.value); setSelectedCategoryId(''); }}
            className="input"
            disabled={!selectedSectorType && user?.role !== 'sector_officer'}
          >
            <option value="">{t('common.all_units')}</option>
            {sectors.map(s => (
              <option key={s.id} value={s.id}>{t(`common.${s.name}`, { defaultValue: s.name })}</option>
            ))}
          </select>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="input"
          >
            <option value="">{t('common.all_categories')}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{t(`common.${c.name}`, { defaultValue: c.name })}</option>
            ))}
          </select>

          {reportType === 'sectors' && (
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="input"
            >
              <option value="">{t('common.all_statuses')}</option>
              <option value="paid">{t('common.paid')}</option>
              <option value="unpaid">{t('common.unpaid')}</option>
            </select>
          )}

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="input"
            style={{ display: reportType === 'monthly' || reportType === 'sectors' ? 'block' : 'none' }}
          >
            {ETHIOPIAN_MONTHS_EN_LIST.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {t(`common.eth_month_${idx + 1}`, { defaultValue: name })}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="input"
          >
            {Array.from({ length: 11 }, (_, i) => getCurrentEthiopianPeriod().year + 5 - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {reportType !== 'sectors' && loading ? (
        <PageLoader />
      ) : reportType !== 'sectors' ? (
        <>
          {reportType === 'monthly' && monthlyData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">{t('common.revenue_by_type')}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData.byType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" tickFormatter={(v) => t(v)} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `ETB ${value.toLocaleString()}`} />
                      <Legend formatter={(v) => t(v)} />
                      <Bar dataKey="totalRevenue" fill="#0ea5e9" name={t('common.total_revenue')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">{t('common.revenue_by_category')}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData.byCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => t(v)} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `ETB ${value.toLocaleString()}`} />
                      <Legend formatter={(v) => t(v)} />
                      <Bar dataKey="totalRevenue" fill="#22c55e" name={t('common.total_revenue')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {reportType === 'yearly' && yearlyData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: t('common.yearly_revenue'), value: `ETB ${yearlyData.totalRevenue?.toLocaleString() || 0}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: t('common.total_payments'), value: yearlyData.totalPayments || 0, icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' }
                ].map((s, idx) => (
                  <div key={idx} className="card flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">{t('common.monthly_breakdown')}</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={yearlyData.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" tickFormatter={(m) => t(`common.eth_month_${m}`)} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `ETB ${value.toLocaleString()}`} />
                    <Legend formatter={(v) => t(v)} />
                    <Bar dataKey="monthlyRevenue" fill="#0ea5e9" name={t('common.total_revenue')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {reportType === 'quarterly' && quarterlyData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: t('common.quarterly_revenue'), value: `ETB ${quarterlyData.totalRevenue?.toLocaleString() || 0}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: t('common.total_payments'), value: quarterlyData.totalPayments || 0, icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' }
                ].map((s, idx) => (
                  <div key={idx} className="card flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">{t('common.quarterly_breakdown')}</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={quarterlyData.quarterlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `ETB ${value.toLocaleString()}`} />
                    <Legend formatter={(v) => t(v)} />
                    <Bar dataKey="totalRevenue" fill="#f59e0b" name={t('common.total_revenue')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {reportType === 'hq-branch' && hqBranch && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: `${t('common.hq_share')} (${hqBranch.hqShare.percentage}%)`, value: `ETB ${hqBranch.hqShare.amount?.toLocaleString() || 0}`, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: `${t('common.branch_share')} (${hqBranch.branchShare.percentage}%)`, value: `ETB ${hqBranch.branchShare.amount?.toLocaleString() || 0}`, icon: Users, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' }
                ].map((s, idx) => (
                  <div key={idx} className="card flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">{t('common.distribution_chart')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: `${t('common.hq_share')} (20%)`, value: hqBranch.hqShare.amount },
                        { name: `${t('common.branch_share')} (80%)`, value: hqBranch.branchShare.amount }
                      ]}
                      cx="50%"
                      cy="50%"
                      label
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#0ea5e9" />
                      <Cell fill="#22c55e" />
                    </Pie>
                    <Tooltip formatter={(value: number) => `ETB ${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {reportType === 'defaulters' && defaulters && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: t('common.total_defaulters'), value: defaulters.totalDefaulters || 0, icon: Users, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: t('common.total_outstanding'), value: `ETB ${defaulters.totalOutstanding?.toLocaleString() || 0}`, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' }
                ].map((s, idx) => (
                  <div key={idx} className="card flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th>{t('common.member_id')}</th>
                      <th>{t('common.full_name')}</th>
                      <th>{t('common.sector_unit')}</th>
                      <th>{t('common.membership_type')}</th>
                      <th>{t('common.monthly_fee')}</th>
                      <th>{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {defaulters.defaulters?.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-500">{t('common.no_defaulters_found')} ✅</td></tr>
                    ) : (
                      defaulters.defaulters?.map((member: any) => (
                        <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td>{member.memberId}</td>
                          <td>{member.fullName}</td>
                          <td>{member.branch}</td>
                          <td>{t(member.membershipType)}</td>
                          <td className="font-semibold">ETB {(member.contributionMonthlyFee || member.contribution?.monthlyFee || 0).toLocaleString()}</td>
                          <td><span className="badge badge-danger">{t(member.paymentStatus)}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}

      {reportType === 'sectors' && (
        <>
          {sectorReportLoading ? (
            <PageLoader />
          ) : sectorReportData ? (
            <div className="space-y-4">
              <div className="card print:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('common.search_sector')}
                    className="input pl-10"
                  />
                </div>
              </div>

              <div className="table-container print:overflow-visible">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10">{t('common.sector_name')}</th>
                      <th className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10">{t('common.total_members')}</th>
                      <th className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10">{t('common.paid_members')}</th>
                      <th className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10">{t('common.unpaid_members')}</th>
                      <th className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10">{t('common.total_revenue')}</th>
                      <th className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10">{t('common.payment_percentage')}</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {paginatedSectors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">{t('common.no_data')}</td>
                      </tr>
                    ) : (
                      paginatedSectors.map((sector: any) => (
                        <tr key={sector.sectorId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="font-medium">{sector.sectorName}</td>
                          <td>{sector.totalMembers}</td>
                          <td><span className="badge badge-success">{sector.paidMembers}</span></td>
                          <td><span className="badge badge-danger">{sector.unpaidMembers}</span></td>
                          <td className="font-semibold">ETB {sector.totalRevenue.toLocaleString()}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    sector.paymentPercentage >= 80 ? 'bg-emerald-500'
                                    : sector.paymentPercentage >= 50 ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${sector.paymentPercentage}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold">{sector.paymentPercentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between print:hidden">
                  <p className="text-[11px] text-gray-500">
                    {t('common.showing_records', {
                      start: Math.min(filteredSectors.length, 1 + (currentPage - 1) * ITEMS_PER_PAGE),
                      end: Math.min(currentPage * ITEMS_PER_PAGE, filteredSectors.length),
                      total: filteredSectors.length
                    })}
                  </p>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">{t('common.no_report_data')}</p>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
