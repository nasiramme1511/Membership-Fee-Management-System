import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Copy, Check, Zap, TrendingUp, Target, Users } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { Message } from '../../../hooks/useAIStream'
import { SortableTable } from './SortableTable'
import { ExportMenu } from '../export/ExportMenu'
import { useCopilotStore } from '../../../stores/copilotStore'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'react-i18next'

interface Props { msg: Message }

const CHART_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

const KPI = { total: { en: 'Total', am: 'ጠቅላላ', om: 'Waliigala' }, rate: { en: 'Rate', am: 'መቶኛ', om: 'Hirmaanna' }, active: { en: 'Active', am: 'ንቁ', om: 'Hojiirra' } }
const L_CHART = { en: 'Chart', am: 'ግራፍ', om: 'Kaarta' }
const L_DATA = { en: 'Data', am: 'ውሂብ', om: 'Daataa' }
const L_RECS = { en: 'Recommendations', am: 'ምክሮች', om: 'Yaadota' }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f1117]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="text-white">{typeof entry.value === 'number' && entry.value > 1000 ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function renderChart(chartType: string, data: any[]) {
  if (!data?.length) return null
  const margin = { top: 8, right: 8, bottom: 0, left: -16 }
  switch (chartType) {
    case 'area':
    case 'line':
      return (
        <div className="w-full h-[200px] mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={margin}>
              <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2.5} fill="url(#ga)" name="Amount" dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
              {data[0]?.payers && <Area type="monotone" dataKey="payers" stroke="#10b981" strokeWidth={2} fill="none" name="Payers" dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )
    case 'bar':
      return (
        <div className="w-full h-[200px] mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {['rate', 'revenue', 'value', 'amount'].filter(k => data[0]?.[k]).map(k => (
                <Bar key={k} dataKey={k} fill={k === 'rate' ? '#f59e0b' : k === 'revenue' ? '#3b82f6' : k === 'value' ? '#10b981' : '#8b5cf6'} radius={[4, 4, 0, 0]} name={k.charAt(0).toUpperCase() + k.slice(1)} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
    case 'pie':
      return (
        <div className="w-full h-[200px] mt-3 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )
    default: return null
  }
}

function useAI18n() {
  const { i18n } = useTranslation()
  return i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'
}

export function MessageBubble({ msg }: Props) {
  const { user } = useAuth()
  const isUser = msg.role === 'user'
  const lang = useAI18n()
  const sd = msg.structuredData
  const metrics = sd?.metrics
  const chartType = sd?.chartType
  const chartData = sd?.chartData
  const tableData = sd?.tableData
  const recommendations = sd?.recommendations
  const structuredSummary = sd?.summary
  const structuredTitle = sd?.title
  const structuredIntent = sd?.intent
  const messageRef = useRef<HTMLDivElement>(null)
  const { copiedId, setCopiedId } = useCopilotStore()

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="shrink-0 mt-1 w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[88%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-[12px] font-medium leading-relaxed text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {msg.content}
          </div>
        ) : (
          <div ref={messageRef} data-msg-id={msg.id} className="w-full rounded-2xl rounded-tl-sm overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {structuredIntent && (
              <div className="flex items-center justify-between px-4 pt-4 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border-amber-500/20">
                    <Zap className="w-2.5 h-2.5" />
                    {structuredIntent.replace(/_/g, ' ')}
                  </span>
                  {structuredTitle && <span className="text-[11px] font-bold text-white/80 truncate">{structuredTitle}</span>}
                </div>
                <button
                  onClick={() => handleCopy(msg.id, sd ? JSON.stringify(sd, null, 2) : msg.content)}
                  className="p-1.5 rounded-lg text-slate-650 hover:text-slate-350 hover:bg-white/5 transition-all"
                >
                  {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <div className="px-4 pb-4 pt-3 space-y-4">
              {metrics && Object.keys(metrics).length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: KPI.total[lang] || KPI.total.en, value: metrics.totalCollected ? `ETB ${metrics.totalCollected.toLocaleString()}` : '—', icon: TrendingUp, color: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400' },
                    { label: KPI.rate[lang] || KPI.rate.en, value: metrics.completionRate ? `${metrics.completionRate}%` : '—', icon: Target, color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400' },
                    { label: KPI.active[lang] || KPI.active.en, value: metrics.activeMembers ? metrics.activeMembers.toLocaleString() : '—', icon: Users, color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400' }
                  ].map((kpi, i) => (
                    <div key={i} className={`p-3 rounded-2xl bg-gradient-to-br border shadow-xl flex flex-col gap-1.5 transition-all ${kpi.color}`}>
                      <div className="flex items-center justify-between w-full opacity-80">
                        <span className="text-[8px] font-black uppercase tracking-wider">{kpi.label}</span>
                        <kpi.icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-sm font-black text-white leading-none">{kpi.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[12px] text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
                {structuredSummary || msg.content}
              </p>

              {chartType && chartType !== 'table' && chartData && chartData.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{L_CHART[lang] || L_CHART.en}</p>
                  {renderChart(chartType, chartData)}
                </div>
              )}

              {tableData && tableData.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{L_DATA[lang] || L_DATA.en}</p>
                  <SortableTable data={tableData} />
                </div>
              )}

              {recommendations && recommendations.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5">{L_RECS[lang] || L_RECS.en}</p>
                  <div className="space-y-2">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2.5 items-start p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer">
                        <div className="shrink-0 w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 flex items-center justify-center text-[9px] font-black mt-0.5">{i + 1}</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isUser && sd && (
                <div className="pt-2 flex justify-start">
                  <ExportMenu data={sd} messageRef={messageRef} />
                </div>
              )}
            </div>
          </div>
        )}

        <span className="text-[9px] text-slate-650 font-medium mt-1 px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <div className="shrink-0 mt-1 w-8 h-8 rounded-xl bg-slate-800 border border-white/8 flex items-center justify-center text-[12px] font-black text-white">
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      )}
    </div>
  )
}
