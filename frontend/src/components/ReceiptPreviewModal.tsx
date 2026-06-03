import { useEffect, useState } from 'react'
import { X, FileText, Download, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ReceiptPreviewModalProps {
  fileName: string
  onClose: () => void
}

export default function ReceiptPreviewModal({ fileName, onClose }: ReceiptPreviewModalProps) {
  const [loading, setLoading] = useState(true)
  const [isImage, setIsImage] = useState(false)
  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
    : import.meta.env.PROD
      ? window.location.origin
      : 'http://localhost:5000'
  const fileUrl = `${baseUrl}/uploads/receipts/${fileName}`

  useEffect(() => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    setIsImage(['jpg', 'jpeg', 'png'].includes(ext || ''))
    setLoading(false)
  }, [fileName])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Payment Receipt
            </h3>
            <div className="flex items-center gap-2">
              <a
                href={fileUrl}
                download
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4 text-slate-500" />
              </a>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
          <div className="p-4 overflow-y-auto max-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            ) : isImage ? (
              <img src={fileUrl} alt="Receipt" className="max-w-full max-h-[60vh] rounded-lg object-contain" />
            ) : (
              <div className="text-center p-8">
                <FileText className="w-16 h-16 mx-auto mb-3 text-slate-400" />
                <p className="text-sm text-slate-500 mb-3">PDF receipt uploaded</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Open PDF
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
