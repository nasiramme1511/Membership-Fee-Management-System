import { useState, useEffect, useRef, useCallback } from 'react'
import { getConversationMessages } from '../services/conversationService'
import i18n from '../i18n'

function lang() {
  return i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('or') ? 'om' : 'en'
}

const STEPS: Record<string, string[]> = {
  en: ['Analyzing...', 'Processing...', 'Generating response...'],
  am: ['በመተንተን ላይ...', 'በማቀነባበር ላይ...', 'ምላሽ በማዘጋጀት ላይ...'],
  om: ['Xiinxaluu jira...', 'Itti fufuu jira...', 'Deebii qopheessuu jira...']
}

const PROCESSING = { en: 'Processing...', am: 'በማቀነባበር ላይ...', om: 'Itti fufuu jira...' }

export interface AIStructuredResponse {
  title: string
  intent: string
  summary: string
  metrics?: Record<string, number>
  chartType?: 'line' | 'pie' | 'bar' | 'area' | 'table'
  chartData?: any[]
  tableData?: any[]
  recommendations?: string[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  structuredData?: AIStructuredResponse
  timestamp: Date
}

export function useAIStream(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingStatus, setStreamingStatus] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const loadMessages = useCallback(async (id: number) => {
    if (id < 0) return
    try {
      setError(null)
      const res = await getConversationMessages(id)
      if (res?.success) {
        setMessages(
          res.data.map((m: any) => ({
            id: String(m.id),
            role: m.role,
            content: m.content,
            structuredData: typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata,
            timestamp: new Date(m.createdAt || Date.now())
          }))
        )
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId)
    } else {
      setMessages([])
    }
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [conversationId, loadMessages])

  const sendMessage = useCallback(async (text: string) => {
    if (!conversationId) return

    setIsStreaming(true)
    setStreamingStatus(PROCESSING[lang()] || PROCESSING.en)
    setStreamingText('')
    setError(null)

    setMessages(prev => [...prev, {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    }])

    abortRef.current = new AbortController()

    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: text, lang: lang() }),
        signal: abortRef.current.signal
      })

      if (!response.ok) throw new Error('Connection failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response stream')

      let buffer = ''
      let finalData: AIStructuredResponse | null = null
      const statusSteps = STEPS[lang()] || STEPS.en
      let stepIdx = 0
      const stepTimer = setInterval(() => {
        setStreamingStatus(statusSteps[stepIdx % statusSteps.length])
        stepIdx++
      }, 1500)

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        for (const block of buffer.split('\n\n')) {
          const lines = block.split('\n')
          let type = 'message', data = ''
          for (const line of lines) {
            if (line.startsWith('event:')) type = line.slice(6).trim()
            else if (line.startsWith('data:')) data = line.slice(5).trim()
          }
          if (type === 'text') setStreamingText(prev => prev + data)
          else if (type === 'done') { try { finalData = JSON.parse(data) } catch {} }
          else if (type === 'error') throw new Error(data || 'Stream error')
          else if (type === 'status') setStreamingStatus(data)
        }
        buffer = ''
      }

      clearInterval(stepTimer)

      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: finalData?.summary || streamingText || 'Done.',
        structuredData: finalData || undefined,
        timestamp: new Date()
      }])
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setError(err.message)
      const isOffline = conversationId < 0
      setMessages(prev => [...prev, {
        id: isOffline ? `a-${Date.now()}` : `err-${Date.now()}`,
        role: 'assistant',
        content: isOffline
          ? `Got it. I'm in offline mode — start the backend server to get full analysis with charts and data reports. For now, here's what I can help with:\n\n• **Quick tasks** — Type what you need and I'll guide you\n• **Data analysis** — Connect the backend for live insights\n• **Reports** — I'll generate them once the engine is online`
          : `Connection issue: ${err.message || 'Please try again.'}`,
        timestamp: new Date()
      }])
    } finally {
      setIsStreaming(false)
      setStreamingText('')
      setStreamingStatus('')
    }
  }, [conversationId])

  return { messages, sendMessage, isStreaming, streamingStatus, streamingText, error }
}

const EXPORT_PATTERNS: { pattern: RegExp; format: 'pdf' | 'word' | 'excel' | 'csv' }[] = [
  { pattern: /\bexport\b.*\b(pdf|pdf report)\b/i, format: 'pdf' },
  { pattern: /\b(download|save|get)\b.*\b(pdf|pdf report)\b/i, format: 'pdf' },
  { pattern: /\bexport\b.*\b(word|docx|document)\b/i, format: 'word' },
  { pattern: /\b(download|save|get)\b.*\b(word|docx|document)\b/i, format: 'word' },
  { pattern: /\bexport\b.*\b(excel|spreadsheet|xlsx)\b/i, format: 'excel' },
  { pattern: /\b(generate|create|make)\b.*\b(excel|spreadsheet)\b/i, format: 'excel' },
  { pattern: /\bexport\b.*\b(csv)\b/i, format: 'csv' },
  { pattern: /\b(download|save|get)\b.*\b(csv)\b/i, format: 'csv' },
]

export interface ExportCommandResult {
  match: boolean
  format: 'pdf' | 'word' | 'excel' | 'csv' | null
}

export function detectExportCommand(text: string): ExportCommandResult {
  for (const { pattern, format } of EXPORT_PATTERNS) {
    if (pattern.test(text)) {
      return { match: true, format }
    }
  }
  return { match: false, format: null }
}
