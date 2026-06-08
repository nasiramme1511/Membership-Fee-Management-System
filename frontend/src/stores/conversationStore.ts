import { create } from 'zustand'
import {
  getConversations,
  createConversation as apiCreateConversation,
  updateConversation,
  deleteConversation
} from '../services/conversationService'

let localIdCounter = 0
function nextLocalId() {
  return --localIdCounter
}

export interface Conversation {
  id: number
  userId: number
  title: string
  pinned: number
  favorite: number
  createdAt: string
  updatedAt: string
}

interface ConversationState {
  conversations: Conversation[]
  activeConversationId: number | null
  loading: boolean
  error: string | null
  fetchConversations: () => Promise<void>
  setActiveConversationId: (id: number | null) => void
  startNewChat: (initialQuery?: string, onChatCreated?: (id: number) => void) => Promise<number | null>
  renameConversation: (id: number, title: string) => Promise<void>
  deleteConversation: (id: number) => Promise<void>
  togglePin: (c: Conversation) => Promise<void>
  toggleFavorite: (c: Conversation) => Promise<void>
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  loading: false,
  error: null,

  fetchConversations: async () => {
    set({ loading: true, error: null })
    try {
      const data = await getConversations()
      if (data?.success) {
        set({ conversations: data.data, loading: false })
      } else {
        set({ error: 'Failed to load conversations', loading: false })
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch conversations', loading: false })
    }
  },

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  startNewChat: async (initialQuery, onChatCreated) => {
    set({ loading: true })
    try {
      const title = initialQuery ? initialQuery.substring(0, 35) : 'New Conversation'
      const data = await apiCreateConversation(title)
      if (data?.success) {
        const newConv = data.data
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeConversationId: newConv.id,
          loading: false
        }))
        if (onChatCreated) onChatCreated(newConv.id)
        return newConv.id
      }
    } catch {}
    set({ loading: false })
    const localConv = {
      id: nextLocalId(),
      userId: 0,
      title: initialQuery ? initialQuery.substring(0, 35) : 'New Conversation',
      pinned: 0,
      favorite: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    set((state) => ({
      conversations: [localConv, ...state.conversations],
      activeConversationId: localConv.id
    }))
    if (onChatCreated) onChatCreated(localConv.id)
    return localConv.id
  },

  renameConversation: async (id, title) => {
    const previousConversations = get().conversations
    // Optimistic UI Update
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
      )
    }))

    try {
      const data = await updateConversation(id, { title })
      if (!data?.success) {
        throw new Error('Rename failed on server')
      }
    } catch (err) {
      // Rollback
      set({ conversations: previousConversations })
      console.error(err)
    }
  },

  deleteConversation: async (id) => {
    const previousConversations = get().conversations
    const wasActive = get().activeConversationId === id

    // Optimistic UI Update
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId: wasActive ? null : state.activeConversationId
    }))

    try {
      const data = await deleteConversation(id)
      if (!data?.success) {
        throw new Error('Delete failed on server')
      }
    } catch (err) {
      // Rollback
      set({
        conversations: previousConversations,
        activeConversationId: wasActive ? id : get().activeConversationId
      })
      console.error(err)
    }
  },

  togglePin: async (c) => {
    const previousConversations = get().conversations
    const nextPinned = c.pinned ? 0 : 1

    // Optimistic UI Update
    set((state) => ({
      conversations: state.conversations.map((item) =>
        item.id === c.id ? { ...item, pinned: nextPinned, updatedAt: new Date().toISOString() } : item
      )
    }))

    try {
      const data = await updateConversation(c.id, { pinned: nextPinned })
      if (!data?.success) {
        throw new Error('Toggle pin failed')
      }
    } catch (err) {
      // Rollback
      set({ conversations: previousConversations })
      console.error(err)
    }
  },

  toggleFavorite: async (c) => {
    const previousConversations = get().conversations
    const nextFav = c.favorite ? 0 : 1

    // Optimistic UI Update
    set((state) => ({
      conversations: state.conversations.map((item) =>
        item.id === c.id ? { ...item, favorite: nextFav, updatedAt: new Date().toISOString() } : item
      )
    }))

    try {
      const data = await updateConversation(c.id, { favorite: nextFav })
      if (!data?.success) {
        throw new Error('Toggle favorite failed')
      }
    } catch (err) {
      // Rollback
      set({ conversations: previousConversations })
      console.error(err)
    }
  }
}))
