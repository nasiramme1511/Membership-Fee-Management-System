import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastState {
  message: string
  type: ToastType
  visible: boolean
}

export function useToast(duration = 4000) {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false })

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), duration)
  }, [duration])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }))
  }, [])

  return { toast, showToast, hideToast }
}
