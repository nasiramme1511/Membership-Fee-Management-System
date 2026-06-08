import { useTranslation } from 'react-i18next'
import { Brain, BarChart3, TrendingUp, Users, FileText, HelpCircle, Sparkles } from 'lucide-react'
import { Message } from '../../../hooks/useAIStream'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { useConversationStore } from '../../../stores/conversationStore'

interface ChatWorkspaceProps {
  messages: Message[]
  isStreaming: boolean
  streamingStatus: string
  streamingText: string
  onSend: (text: string) => void
}

const LANG_LABELS: Record<string, string> = { en: 'Active', am: 'ንቁ', om: 'Hojiirra' }
const LANG_IDLE: Record<string, string> = { en: 'Click "New Chat" to start', am: '"አዲስ ውይይት" ጠቅ ያድርጉ', om: '"Haasaa Haaraa" tuqiitii jalqabi' }

const TASK_PROMPTS = [
  { icon: BarChart3, q: 'Analyze the current data and give me a summary of key findings.' },
  { icon: TrendingUp, q: 'Compare trends and show me month-over-month changes.' },
  { icon: Users, q: 'Give me insights about member activity and engagement.' },
  { icon: FileText, q: 'Generate a comprehensive report with the latest data.' },
  { icon: HelpCircle, q: 'Explain how the collection process works step by step.' },
  { icon: Sparkles, q: 'What are the best actions I can take to improve collection rates?' },
]

const PROMPT_LABELS: Record<string, string[]> = {
  en: ['Analyze Data', 'Compare Trends', 'Member Insights', 'Generate Report', 'Explain', 'Suggestions'],
  am: ['ውሂብ ተንትን', 'አዝማሚያ አወዳድር', 'የአባላት ግንዛቤ', 'ሪፖርት አዘጋጅ', 'አብራራ', 'አስተያየቶች'],
  om: ['Daataa Xiinxali', 'Fakkeenya Walbira Qabi', 'Hubannoo Miseensota', 'Gabaasa Qopheessi', 'Ibsi', 'Yaada'],
}

const PROMPT_COLORS = [
  'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400',
  'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
  'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
  'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
  'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-400',
  'from-rose-500/20 to-rose-600/10 border-rose-500/20 text-rose-400',
]

export function ChatWorkspace({
  messages, isStreaming, streamingStatus, streamingText, onSend
}: ChatWorkspaceProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'
  const { conversations, activeConversationId } = useConversationStore()
  const activeTitle = conversations.find(c => c.id === activeConversationId)?.title || 'AI Assistant'

  const quickPrompts = TASK_PROMPTS.map((p, i) => ({
    ...p,
    label: PROMPT_LABELS[lang][i] || PROMPT_LABELS.en[i],
    color: PROMPT_COLORS[i]
  }))

  const iconMap = [BarChart3, TrendingUp, Users, FileText, HelpCircle, Sparkles]
  quickPrompts.forEach((p, i) => { p.icon = iconMap[i] })

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative rounded-[20px]"
      style={{
        background: 'linear-gradient(180deg, rgba(10,12,19,0.85) 0%, rgba(8,9,14,0.9) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      {messages.length === 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[20px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.15] blur-[120px]"
            style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/20 flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-amber-400" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tight leading-none">
              {activeConversationId ? activeTitle : lang === 'am' ? 'AI ረዳት' : lang === 'om' ? 'Gargaaraa AI' : 'AI Assistant'}
            </h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {activeConversationId ? LANG_LABELS[lang] : LANG_IDLE[lang]}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingStatus={streamingStatus}
          streamingText={streamingText}
          quickPrompts={quickPrompts}
        />
      </div>

      <ChatInput onSend={onSend} loading={isStreaming} />
    </div>
  )
}
