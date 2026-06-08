import React, { useRef, useCallback } from 'react'
import { Send, Loader2, Paperclip, Mic } from 'lucide-react'
import { useCopilotStore } from '../../../stores/copilotStore'
import { useTranslation } from 'react-i18next'

interface ChatInputProps {
  onSend: (text: string) => void
  loading: boolean
}

export function ChatInput({ onSend, loading }: ChatInputProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const {
    input,
    setInput,
    inputFocused,
    setInputFocused
  } = useCopilotStore()

  const autoResize = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  }, [])

  const handleSendClick = () => {
    const text = input.trim()
    if (!text || loading) return
    onSend(text)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendClick()
    }
  }

  return (
    <div className="shrink-0 px-5 pb-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <div
        className="flex items-end gap-2 max-w-3xl mx-auto rounded-2xl p-2 transition-all duration-200"
        style={{
          background: inputFocused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
          border: inputFocused ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.07)',
          boxShadow: inputFocused ? '0 0 0 3px rgba(245,158,11,0.08)' : 'none'
        }}
      >
        <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-slate-350 transition-all shrink-0">
          <Paperclip className="w-4 h-4" />
        </button>

        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => { setInput(e.target.value); autoResize() }}
          onKeyDown={handleKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder={lang === 'am'
            ? 'ኮፓይለቱን ጥያቄ ይጠይቁ...'
            : 'Ask about members, payments, sectors, collections, or reports...'}
          className="flex-1 px-2 py-2 bg-transparent border-none outline-none resize-none text-[12px] text-slate-200 placeholder:text-slate-605 focus:ring-0 max-h-36"
          style={{ scrollbarWidth: 'thin' }}
        />

        <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-slate-350 transition-all shrink-0">
          <Mic className="w-4 h-4" />
        </button>

        <button
          onClick={handleSendClick}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl shrink-0 transition-all duration-200"
          style={{
            background: !input.trim() || loading
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: !input.trim() || loading ? 'none' : '0 4px 14px rgba(245,158,11,0.3)',
            opacity: !input.trim() || loading ? 0.4 : 1
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      <p className="text-center text-[9px] text-slate-700 font-bold uppercase tracking-widest mt-2.5">
        {lang === 'am'
          ? 'የኢንተርፕራይዝ ደረጃ ኢንተሊጀንስ • ወሳኝ ውጤቶችን ያረጋግጡ'
          : lang === 'om'
          ? 'Sadarkaa Enterpriizee • Bu\'aa murteessaa mirkaneessi'
          : 'Enterprise-Grade Intelligence • Verify critical outputs'}
      </p>
    </div>
  )
}
