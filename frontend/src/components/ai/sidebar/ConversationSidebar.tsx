import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Plus, Search, ChevronLeft, MessageSquare, X } from 'lucide-react'
import { useConversationStore } from '../../../stores/conversationStore'
import { useCopilotStore } from '../../../stores/copilotStore'
import { ConversationGroup } from './ConversationGroup'
import { useTranslation } from 'react-i18next'

const GROUP_LABELS: Record<string, Record<string, string>> = {
  en: { Pinned: 'Pinned', Today: 'Today', Yesterday: 'Yesterday', 'Last 7 Days': 'Last 7 Days' },
  am: { Pinned: 'ተሰካች', Today: 'ዛሬ', Yesterday: 'ትናንት', 'Last 7 Days': 'ያለፉ 7 ቀናት' },
  om: { Pinned: 'Fixaame', Today: 'Har\'a', Yesterday: 'Kaleessa', 'Last 7 Days': 'Darban guyyaa 7' }
}

export function ConversationSidebar() {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'
  const gl = GROUP_LABELS[lang] || GROUP_LABELS.en

  const {
    conversations,
    activeConversationId,
    startNewChat,
    loading
  } = useConversationStore()

  const {
    sidebarCollapsed,
    setSidebarCollapsed
  } = useCopilotStore()

  const searchQuery = useCopilotStore(state => state.input)
  const setSearchQuery = useCopilotStore(state => state.setInput)

  const groupedConversations = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 864e5

    const groups: Record<string, any[]> = {
      Pinned: [],
      Today: [],
      Yesterday: [],
      'Last 7 Days': []
    }

    conversations
      .filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .forEach((c) => {
        if (c.pinned || c.favorite) {
          groups['Pinned'].push(c)
          return
        }
        const t = new Date(c.updatedAt).getTime()
        if (t >= todayStart) groups['Today'].push(c)
        else if (t >= yesterdayStart) groups['Yesterday'].push(c)
        else groups['Last 7 Days'].push(c)
      })

    return groups
  }, [conversations, searchQuery])

  const hasConversations = conversations.length > 0
  const hasSearchResults = Object.values(groupedConversations).some(g => g.length > 0)

  return (
    <motion.div
      animate={{ width: sidebarCollapsed ? 64 : 288 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="shrink-0 flex flex-col h-full overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, rgba(13,15,22,0.85) 0%, rgba(9,11,17,0.9) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute top-4 right-3 z-10 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-md"
      >
        <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </motion.div>
      </button>

      <div className={`flex items-center gap-3 p-4 pb-3 border-b border-white/6 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0d0f16]" />
        </div>
        {!sidebarCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
            <h1 className="text-xs font-black text-white tracking-tight leading-none">
              {lang === 'am' ? 'AI ረዳት' : lang === 'om' ? 'Gargaaraa AI' : 'PP Copilot'}
            </h1>
            <p className="text-[9px] text-amber-500/70 font-bold uppercase tracking-widest mt-0.5">
              {lang === 'am' ? 'የድሬዳዋ ቅርንጫፍ' : lang === 'om' ? 'Dammaqa Dire Dawa' : 'Dire Dawa Branch'}
            </p>
          </motion.div>
        )}
      </div>

      {!sidebarCollapsed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 overflow-hidden px-3 py-3 gap-3">
          <button
            onClick={() => startNewChat()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[11px] tracking-wide transition-all relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.25)'
            }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white">{lang === 'am' ? 'አዲስ ውይይት' : lang === 'om' ? 'Haasaa Haaraa' : 'New Chat'}</span>
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={lang === 'am' ? 'ውይይቶችን ፈልግ...' : lang === 'om' ? 'Haasaa barbaadi...' : 'Search conversations...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-[11px] text-slate-300 placeholder:text-slate-650 outline-none transition-all border border-white/6 bg-white/4 focus:border-amber-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {loading && !hasConversations ? (
              <div className="space-y-3 animate-pulse pt-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-2">
                    <div className="w-5 h-5 rounded-md bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 bg-white/10 rounded" />
                      <div className="h-2 w-1/3 bg-white/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasConversations ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-[10px] text-slate-600 font-semibold">
                  {lang === 'am' ? 'እስካሁን ምንም ውይይት የለም' : lang === 'om' ? 'Haasaa hin jiru' : 'No conversations yet'}
                </p>
                <p className="text-[9px] text-slate-700 mt-1">
                  {lang === 'am' ? 'ከላይ አዲስ ውይይት ይጀምሩ' : lang === 'om' ? 'Gubbaatti haasaa haaraa jalqabi' : 'Start a new chat above'}
                </p>
              </div>
            ) : searchQuery && !hasSearchResults ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-[10px] text-slate-600 font-semibold">
                  {lang === 'am' ? 'ምንም ውጤት አልተገኘም' : lang === 'om' ? 'Bu\'aa hin argamne' : 'No results found'}
                </p>
                <p className="text-[9px] text-slate-700 mt-1">
                  {lang === 'am' ? 'በሌላ ቃል ይፈልጉ' : lang === 'om' ? 'Jechaa biraa yaali' : 'Try a different search term'}
                </p>
              </div>
            ) : (
              Object.entries(groupedConversations).map(([group, items]) => (
                <ConversationGroup
                  key={group}
                  groupName={gl[group] || group}
                  items={items}
                  activeId={activeConversationId}
                />
              ))
            )}
          </div>
        </motion.div>
      )}

      {sidebarCollapsed && (
        <div className="flex flex-col items-center gap-3 pt-3 px-3">
          <button
            onClick={() => startNewChat()}
            className="w-10 h-10 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 flex items-center justify-center text-amber-400 transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>
      )}
    </motion.div>
  )
}
