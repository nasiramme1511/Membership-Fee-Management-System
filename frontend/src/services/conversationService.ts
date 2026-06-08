import api from '../lib/api'

export const getConversations = async () => {
  const res = await api.get('/ai/conversations')
  return res.data
}

export const createConversation = async (title?: string) => {
  const res = await api.post('/ai/conversations', { title: title || 'New Conversation' })
  return res.data
}

export const updateConversation = async (id: number, data: { title?: string; pinned?: number; favorite?: number }) => {
  const res = await api.put(`/ai/conversations/${id}`, data)
  return res.data
}

export const deleteConversation = async (id: number) => {
  const res = await api.delete(`/ai/conversations/${id}`)
  return res.data
}

export const getConversationMessages = async (id: number) => {
  const res = await api.get(`/ai/conversations/${id}/messages`)
  return res.data
}

export const exportConversationExcel = async (id: number) => {
  const res = await api.get(`/ai/conversations/${id}/export`, { responseType: 'blob' })
  return res.data
}
