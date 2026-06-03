import { useState, useEffect, useRef } from 'react'
import { ShieldAlert } from 'lucide-react'

interface DeleteAllConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteAllConfirmDialog({
  open,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
}: DeleteAllConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      setInputValue('')
      cancelRef.current?.focus()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  const isMatch = inputValue === confirmText

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/30">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-lg">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
              Type <span className="font-mono bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">{confirmText}</span> below to confirm:
            </p>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Type "${confirmText}"`}
              className="input w-full text-sm font-mono"
              autoComplete="off"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              ref={cancelRef}
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!isMatch}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isMatch
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Delete All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
