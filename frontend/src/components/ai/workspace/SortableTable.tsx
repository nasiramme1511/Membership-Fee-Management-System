import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface SortableTableProps {
  data: any[]
}

export function SortableTable({ data }: SortableTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const keys = useMemo(() => {
    if (!data || data.length === 0) return []
    return Object.keys(data[0]).filter(k => k !== 'id' && k !== 'membersList')
  }, [data])

  const sortedData = useMemo(() => {
    if (!data) return []
    let sortableItems = [...data]
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        if (aVal === undefined || bVal === undefined) return 0
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
        }
        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()
        if (aStr < bStr) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [data, sortConfig])

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedData.slice(start, start + itemsPerPage)
  }, [sortedData, currentPage])

  if (!data || data.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mt-3 w-full">
      <div className="overflow-x-auto rounded-xl border border-white/5 max-h-[220px] scrollbar-thin">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 sticky top-0 backdrop-blur-md z-10">
            <tr>
              {keys.map(key => {
                const isSorted = sortConfig?.key === key
                const isAsc = sortConfig?.direction === 'asc'
                return (
                  <th
                    key={key}
                    onClick={() => requestSort(key)}
                    className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-white/5 hover:text-white transition-all select-none"
                  >
                    <div className="flex items-center gap-1">
                      {key.replace(/([A-Z])/g, ' $1')}
                      {isSorted && (
                        isAsc ? <ChevronUp className="w-3 h-3 text-amber-500" /> : <ChevronDown className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                {keys.map(key => (
                  <td key={key} className="px-3 py-2 text-[11px] text-slate-300 font-medium whitespace-nowrap">
                    {typeof row[key] === 'number' && row[key] > 1000
                      ? row[key].toLocaleString()
                      : String(row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-[10px] text-slate-500 font-bold">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
