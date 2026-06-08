import { useCallback } from 'react'
import { useConversationStore } from '../stores/conversationStore'
import { useCopilotStore } from '../stores/copilotStore'
import { useAIStream, detectExportCommand, type Message } from '../hooks/useAIStream'
import { ConversationSidebar } from '../components/ai/sidebar/ConversationSidebar'
import { ChatWorkspace } from '../components/ai/workspace/ChatWorkspace'
import { useAuth } from '../context/AuthContext'
import { exportPDF, exportWord, exportExcel, exportCSV } from '../services/exportService'

export default function AIAssistant() {
  const { activeConversationId, fetchConversations } = useConversationStore()
  const { sidebarCollapsed } = useCopilotStore()
  const { user } = useAuth()

  const { messages, sendMessage, isStreaming, streamingStatus, streamingText } =
    useAIStream(activeConversationId)

  const handleSend = useCallback((text: string) => {
    const cmd = detectExportCommand(text)
    if (cmd.match && cmd.format) {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && m.structuredData)
      if (lastAssistant?.structuredData) {
        const sd = lastAssistant.structuredData
        try {
          const msgEl = document.querySelector(`[data-msg-id="${lastAssistant.id}"]`) as HTMLElement | null
          switch (cmd.format) {
            case 'pdf':
              exportPDF(sd, msgEl, 'en', user || undefined)
              break
            case 'word':
              exportWord(sd, 'en', user || undefined)
              break
            case 'excel':
              exportExcel(sd, 'en', user || undefined)
              break
            case 'csv':
              exportCSV(sd, 'en', 'table', user || undefined)
              break
          }
        } catch {}
        return
      }
    }
    sendMessage(text)
  }, [messages, sendMessage, user])

  return (
    <div className="flex h-[calc(100vh-8.5rem)] gap-3 overflow-hidden relative select-none">
      <ConversationSidebar />
      <ChatWorkspace
        messages={messages}
        isStreaming={isStreaming}
        streamingStatus={streamingStatus}
        streamingText={streamingText}
        onSend={handleSend}
      />
    </div>
  )
}
