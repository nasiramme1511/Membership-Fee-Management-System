import { useState, useRef, useEffect, createContext, useContext, type RefObject } from 'react'
import { FileDown, FileText, FileSpreadsheet, Table2, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import { exportPDF, exportWord, exportExcel, exportCSV } from '../../../services/exportService'
import { AIStructuredResponse } from '../../../hooks/useAIStream'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'react-i18next'

interface ExportMenuProps {
  data: AIStructuredResponse
  messageRef?: RefObject<HTMLDivElement | null>
}

type ExportFormat = 'pdf' | 'word' | 'excel' | 'csv'
type ToastInfo = { message: string; type: 'success' | 'error' } | null

interface ExportContextType {
  registerExport: (key: string, data: AIStructuredResponse, ref: RefObject<HTMLDivElement | null>) => void
  triggerExport: (key: string, format: ExportFormat) => Promise<void>
}

const ExportContext = createContext<ExportContextType | null>(null)

export function useExportContext() {
  return useContext(ExportContext)
}

const FORMATS: { key: ExportFormat; label: string; icon: any; color: string }[] = [
  { key: 'pdf', label: 'Export PDF', icon: FileText, color: 'text-red-400 hover:text-red-300' },
  { key: 'word', label: 'Export Word', icon: FileText, color: 'text-blue-400 hover:text-blue-300' },
  { key: 'excel', label: 'Export Excel', icon: FileSpreadsheet, color: 'text-emerald-400 hover:text-emerald-300' },
  { key: 'csv', label: 'Export CSV', icon: Table2, color: 'text-green-400 hover:text-green-300' }
]

export function ExportProvider({ children }: { children: React.ReactNode }) {
  const exportsRef = useRef<Map<string, { data: AIStructuredResponse; ref: RefObject<HTMLDivElement | null> }>>(new Map())
  const { i18n } = useTranslation()
  const lng = i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'

  const registerExport = (key: string, data: AIStructuredResponse, ref: RefObject<HTMLDivElement | null>) => {
    exportsRef.current.set(key, { data, ref })
  }

  const triggerExport = async (key: string, format: ExportFormat) => {
    const entry = exportsRef.current.get(key)
    if (!entry) return
    const { data, ref } = entry
    switch (format) {
      case 'pdf':
        await exportPDF(data, ref?.current, lng)
        break
      case 'word':
        await exportWord(data, lng)
        break
      case 'excel':
        await exportExcel(data, lng)
        break
      case 'csv':
        await exportCSV(data, lng)
        break
    }
  }

  return (
    <ExportContext.Provider value={{ registerExport, triggerExport }}>
      {children}
    </ExportContext.Provider>
  )
}

export function ExportMenu({ data, messageRef }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<ExportFormat | null>(null)
  const [toast, setToast] = useState<ToastInfo>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const lng = i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'

  const hasExportableContent = !!(
    data?.metrics ||
    (data?.tableData && data.tableData.length > 0) ||
    data?.summary ||
    (data?.chartData && data.chartData.length > 0) ||
    (data?.recommendations && data.recommendations.length > 0)
  )
  if (!hasExportableContent) return null

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleExport = async (format: ExportFormat) => {
    setLoading(format)
    setOpen(false)
    try {
      switch (format) {
        case 'pdf':
          await exportPDF(data, messageRef?.current || null, lng, user || undefined)
          break
        case 'word':
          await exportWord(data, lng, user || undefined)
          break
        case 'excel':
          await exportExcel(data, lng, user || undefined)
          break
        case 'csv':
          await exportCSV(data, lng, 'table', user || undefined)
          break
      }
      setToast({ message: `Exported as ${format.toUpperCase()}`, type: 'success' })
    } catch (err: any) {
      setToast({ message: `Export failed: ${err.message || 'Unknown error'}`, type: 'error' })
    } finally {
      setLoading(null)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border"
        style={{
          background: 'rgba(245,158,11,0.1)',
          borderColor: 'rgba(245,158,11,0.2)',
          color: '#f59e0b'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.2)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)' }}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{loading ? `Exporting ${loading.toUpperCase()}...` : 'Export \u25BC'}</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1.5 min-w-[160px] rounded-xl overflow-hidden shadow-2xl z-50"
          style={{
            background: '#0f1117',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="py-1">
            <p className="px-3 py-1.5 text-[8px] font-black text-slate-500 uppercase tracking-widest">Export as</p>
            {FORMATS.map(fmt => (
              <button
                key={fmt.key}
                onClick={() => handleExport(fmt.key)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
              >
                <fmt.icon className={`w-4 h-4 ${fmt.color}`} />
                {fmt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl z-[100] text-sm font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-600/90 text-white border border-emerald-500/50'
              : 'bg-red-600/90 text-white border border-red-500/50'
          }`}
          style={{ backdropFilter: 'blur(12px)' }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
