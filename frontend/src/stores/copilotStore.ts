import { create } from 'zustand'

interface CopilotUIState {
  sidebarCollapsed: boolean
  showPrefsEditor: boolean
  rightPanelTab: 'insights' | 'alerts'
  copiedId: string | null
  ttsSpeakingId: string | null
  input: string
  inputFocused: boolean
  setSidebarCollapsed: (val: boolean) => void
  setShowPrefsEditor: (val: boolean) => void
  setRightPanelTab: (tab: 'insights' | 'alerts') => void
  setCopiedId: (id: string | null) => void
  setTtsSpeakingId: (id: string | null) => void
  setInput: (text: string) => void
  setInputFocused: (val: boolean) => void
}

export const useCopilotStore = create<CopilotUIState>((set) => ({
  sidebarCollapsed: false,
  showPrefsEditor: false,
  rightPanelTab: 'insights',
  copiedId: null,
  ttsSpeakingId: null,
  input: '',
  inputFocused: false,

  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
  setShowPrefsEditor: (val) => set({ showPrefsEditor: val }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setCopiedId: (id) => set({ copiedId: id }),
  setTtsSpeakingId: (id) => set({ ttsSpeakingId: id }),
  setInput: (text) => set({ input: text }),
  setInputFocused: (val) => set({ inputFocused: val })
}))
