import { useTranslation } from 'react-i18next'
import { Search, Plus, MessageSquare, Trash2 } from 'lucide-react'
import { useConversationStore } from '../../../stores/conversationStore'
import { useState } from 'react'

const PLACEHOLDER: Record<string, string> = { en: 'Search conversations...', am: 'ውይይቶችን ፈልግ...', om: 'Haasaa barbaadi...' }
const EMPTY: Record<string, string> = { en: 'No conversations yet', am: 'እስካሁን ምንም ውይይት የለም', om: 'Haasaa hin jiru' }
const SUB: Record<string, string> = { en: 'Start a new chat below', am: 'ከታች አዲስ ውይይት ይጀምሩ', om: 'Gaditti haasaa haaraa jalqabi' }

export function ConversationSidebar() {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'
  const { conversations, activeConversationId, setActiveConversationId, startNewChat, deleteConversation } = useConversationStore()
  const [search, setSearch] = useState('')

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-72 shrink-0 flex flex-col h-full overflow-hidden rounded-[20px] relative"
      style={{
        background: 'linear-gradient(180deg, rgba(12,14,22,0.9) 0%, rgba(8,9,14,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <div className="px-4 pt-4 pb-3">
        <button
          onClick={() => startNewChat()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: '0 4px 14px rgba(245,158,11,0.25)'
          }}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={PLACEHOLDER[lang]}
            className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-amber-500/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">{EMPTY[lang]}</p>
            <p className="text-[10px] text-slate-600 mt-1">{SUB[lang]}</p>
          </div>
        ) : (
          filtered.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                activeConversationId === conv.id
                  ? 'bg-amber-500/10 border border-amber-500/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: activeConversationId === conv.id ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)' }}
              >
                <MessageSquare className={`w-3.5 h-3.5 ${activeConversationId === conv.id ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${activeConversationId === conv.id ? 'text-amber-200' : 'text-slate-300'}`}>
                  {conv.title}
                </p>
                <p className="text-[9px] text-slate-600 truncate mt-0.5">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
