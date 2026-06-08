import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Pin } from 'lucide-react'
import { Conversation } from '../../../stores/conversationStore'
import { ConversationItem } from './ConversationItem'

interface ConversationGroupProps {
  groupName: string
  items: Conversation[]
  activeId: number | null
}

export function ConversationGroup({ groupName, items, activeId }: ConversationGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (items.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full px-1 mb-1.5 group text-left"
      >
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          {groupName === 'Pinned' && <Pin className="w-2.5 h-2.5 text-amber-500" />}
          {groupName}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-500 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-0.5"
          >
            {items.map((c) => (
              <ConversationItem key={c.id} c={c} isActive={activeId === c.id} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
