import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Message } from '../../../hooks/useAIStream'
import { MessageBubble } from './MessageBubble'
import { useCopilotStore } from '../../../stores/copilotStore'

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  streamingStatus: string
  streamingText: string
  quickPrompts: Array<{ icon: any; label: string; q: string; color: string }>
}

const WELCOME: Record<string, { title: string; desc: string }> = {
  en: { title: 'AI Assistant', desc: 'Click "New Chat" to start, then ask anything about members, payments, reports, or trends.' },
  am: { title: 'AI ረዳት', desc: '"አዲስ ውይይት" የሚለውን ጠቅ ያድርጉ እና ስለ አባላት፣ ክፍያዎች፣ ሪፖርቶች ወይም አዝማሚያዎች ይጠይቁ።' },
  om: { title: 'Gargaaraa AI', desc: '"Haasaa Haaraa" jedhu tuqiitii waan miseensota, kaffaltii, gabaasa ykn booda fooyya\'iinsaa gaafadhu.' }
}

export function MessageList({
  messages, isStreaming, streamingStatus, streamingText, quickPrompts
}: MessageListProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'
  const { setInput } = useCopilotStore()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-40 bg-gradient-to-tr from-amber-500 to-amber-300" />
            <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 10px 40px rgba(245,158,11,0.25)' }}>
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight mb-2">{WELCOME[lang].title}</h3>
          <p className="text-[12px] text-slate-400 max-w-md mx-auto font-medium leading-relaxed">{WELCOME[lang].desc}</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {quickPrompts.map((p, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              onClick={() => setInput(p.q)}
              className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border bg-gradient-to-br ${p.color}`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
                <p.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white leading-tight">{p.label}</p>
                <p className="text-[9px] text-white/40 mt-0.5 line-clamp-1">{p.q}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full pb-4 relative z-10">
      <AnimatePresence initial={false}>
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

        {isStreaming && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
            <div className="shrink-0 mt-1 w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="px-4 py-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />)}
                  </div>
                  <span className="text-[10px] font-bold text-amber-500 animate-pulse">{streamingStatus || 'Processing...'}</span>
                </div>
                {streamingText && <p className="text-[12px] text-slate-400 leading-relaxed">{streamingText}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  )
}
