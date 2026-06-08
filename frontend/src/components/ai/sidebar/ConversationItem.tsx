import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Pin, Star, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { Conversation, useConversationStore } from '../../../stores/conversationStore'
import { useTranslation } from 'react-i18next'

interface ConversationItemProps {
  c: Conversation
  isActive: boolean
}

const MENU_ITEMS = {
  rename: { en: 'Rename', am: 'ሰይም ቀይር', om: 'Maqaa jijjiiri' },
  unpin: { en: 'Unpin', am: 'አውልቅ', om: 'Hiqi' },
  pin: { en: 'Pin', am: 'ሰካ', om: 'Fixaasi' },
  unfavorite: { en: 'Unfavorite', am: 'ከምርጥ አውልቅ', om: 'Filannoo irraa hiqi' },
  favorite: { en: 'Favorite', am: 'ወደ ምርጥ', om: 'Filannoo' },
  delete_: { en: 'Delete', am: 'ሰርዝ', om: 'Haqui' }
}

export function ConversationItem({ c, isActive }: ConversationItemProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'
  const m = MENU_ITEMS

  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(c.title)

  const {
    setActiveConversationId,
    renameConversation,
    deleteConversation,
    togglePin,
    toggleFavorite
  } = useConversationStore()

  const handleRenameConfirm = () => {
    if (renameValue.trim() && renameValue !== c.title) {
      renameConversation(c.id, renameValue)
    }
    setRenaming(false)
  }

  return (
    <div
      onMouseLeave={() => setActiveMenuId(null)}
      className={`relative group rounded-xl transition-all duration-150 cursor-pointer ${
        isActive
          ? 'bg-amber-500/10 border border-amber-500/20 shadow-md shadow-amber-500/5'
          : 'hover:bg-white/4'
      }`}
    >
      <div
        onClick={() => setActiveConversationId(c.id)}
        className="flex items-start gap-2 px-2.5 py-2 pr-8 min-w-0"
      >
        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[9px] ${
          isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'
        }`}>
          <MessageSquare className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          {renaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameConfirm}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
              autoFocus
              className="w-full bg-transparent text-white outline-none border-b border-amber-500 py-0.5 text-[11px] font-bold"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className={`text-[11px] font-semibold leading-tight truncate ${
              isActive ? 'text-amber-100' : 'text-slate-400'
            }`}>{c.title}</p>
          )}
          <p className="text-[9px] text-slate-500 font-medium mt-0.5">
            {new Date(c.updatedAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-1">
        {c.pinned === 1 && <Pin className="w-2.5 h-2.5 text-amber-500" />}
        {c.favorite === 1 && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setActiveMenuId(activeMenuId === c.id ? null : c.id)
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-all"
        >
          <MoreVertical className="w-3 h-3" />
        </button>
      </div>

      <AnimatePresence>
        {activeMenuId === c.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-2 top-8 z-50 w-36 rounded-xl p-1 shadow-2xl"
            style={{
              background: '#151820',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {[
              {
                icon: Edit2,
                label: m.rename[lang] || m.rename.en,
                color: 'text-blue-400',
                action: () => {
                  setRenaming(true)
                  setActiveMenuId(null)
                }
              },
              {
                icon: Pin,
                label: c.pinned ? (m.unpin[lang] || m.unpin.en) : (m.pin[lang] || m.pin.en),
                color: 'text-amber-400',
                action: () => {
                  togglePin(c)
                  setActiveMenuId(null)
                }
              },
              {
                icon: Star,
                label: c.favorite ? (m.unfavorite[lang] || m.unfavorite.en) : (m.favorite[lang] || m.favorite.en),
                color: 'text-yellow-400',
                action: () => {
                  toggleFavorite(c)
                  setActiveMenuId(null)
                }
              },
              {
                icon: Trash2,
                label: m.delete_[lang] || m.delete_.en,
                color: 'text-rose-400',
                action: () => {
                  deleteConversation(c.id)
                  setActiveMenuId(null)
                }
              }
            ].map(({ icon: Icon, label, color, action }) => (
              <button
                key={label}
                onClick={(e) => {
                  e.stopPropagation()
                  action()
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${color} hover:bg-white/6 transition-colors`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
