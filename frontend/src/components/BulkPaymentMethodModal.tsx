import { useState, useEffect, useRef, Fragment } from 'react'
import { X, ArrowLeft, Smartphone, CloudUpload, Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getCurrentEthiopianPeriod } from '../utils/ethiopianCalendar'
import api from '../lib/api'

interface BulkPaymentMethodModalProps {
  members: any[]
  periodMonth: number
  periodYear: number
  onClose: () => void
  onSuccess: () => void
}

type Step = 'choose_method' | 'choose_bank' | 'upload_slip'
type PaymentMethod = 'direct' | 'manual' | null
type BankOption = { id: string; name: string; logo: string; topLogo: string; accountNo: string; accountHolder: string }

const BANK_OPTIONS: BankOption[] = [
  { id: 'telebirr',  name: 'Telebirr',  logo: '/telebirr_logo.png', topLogo: '/telebirr_logo.png', accountNo: '0964358567', accountHolder: 'Muaz Amin Shebo' },
  { id: 'cbe_birr',  name: 'CBE',      logo: '/cbe_step2.png',     topLogo: '/cbe_step3.png',     accountNo: '1000476051111', accountHolder: 'Muaz Amin Shebo' },
  { id: 'ebirr',     name: 'E-Birr',    logo: '/ebirr_logo.png',    topLogo: '/ebirr_logo.png',    accountNo: '0964358567',  accountHolder: 'Muaz Amin Shebo' }
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 })
}

/* ─── Inline Upload Form ─────────────────────────────────────────────────── */
function UploadForm({
  members,
  periodMonth,
  periodYear,
  selectedBank,
  paymentMethod,
  onClose,
  onSuccess,
}: {
  members: any[]
  periodMonth: number
  periodYear: number
  selectedBank: BankOption | null
  paymentMethod: PaymentMethod
  onClose: () => void
  onSuccess: () => void
}) {
  const { t } = useTranslation()
  const { user } = useAuth()

  // Calculate total amount from members
  const totalAmount = members.reduce((sum, m) => sum + Number(m.fee), 0).toString()

  // File & TID
  const [file,    setFile]    = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [transactionId, setTransactionId] = useState('')

  // Copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Notes
  const [notes, setNotes] = useState('')

  // Status
  const [loading,         setLoading]         = useState(false)
  const [uploadProgress,  setUploadProgress]  = useState(0)
  const [error,           setError]           = useState('')
  const [success,         setSuccess]         = useState(false)

  // No sector logic needed here

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(f.type)) { setError('Only JPG, PNG, and PDF files are allowed.'); return }
    if (f.size > 5 * 1024 * 1024)  { setError('File size must be under 5MB.'); return }
    setError('')
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => setPreview(ev.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    // Reuse change handler via synthetic event trick
    const dt = new DataTransfer()
    dt.items.add(f)
    const fakeEvt = { target: { files: dt.files } } as unknown as React.ChangeEvent<HTMLInputElement>
    handleFileChange(fakeEvt)
  }

  const canSubmit =
    !loading && !success &&
    members.length > 0 &&
    (paymentMethod === 'direct' ? !!transactionId : !!file)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    setUploadProgress(0)

    const fd = new FormData()
    fd.append('members', JSON.stringify(members))
    fd.append('periodMonth', String(periodMonth))
    fd.append('periodYear', String(periodYear))
    fd.append('totalAmount', totalAmount)
    fd.append('bankName', selectedBank ? selectedBank.name : 'Commercial Bank of Ethiopia')
    fd.append('method', paymentMethod === 'direct' ? 'Bank Transfer' : 'Bank Transfer')
    fd.append('notes', notes)
    if (paymentMethod === 'direct' && transactionId) fd.append('transactionId', transactionId)
    if (paymentMethod === 'manual' && file) fd.append('receipt', file)

    try {
      await api.post('/payments/bulk-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => { if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100)) }
      })
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1400)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="px-5 pb-5 pt-2 space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Bank badge (when coming from Manual Pay) */}
      {selectedBank && paymentMethod === 'manual' && (
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 -mt-2">
          <img src={selectedBank.logo} alt={selectedBank.name} className="w-6 h-6 object-contain" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">{selectedBank.name} · Transfer to</p>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide">{selectedBank.accountNo}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle className="w-4 h-4 shrink-0" />Payment slip submitted successfully!
        </div>
      )}

      {/* Direct Payment Details (At the Top) */}
      {paymentMethod === 'direct' && (
        <div className="flex flex-col gap-1.5 -mt-2 pt-0.5">
          {/* Header with Logo */}
          <div className="flex flex-col items-center justify-center">
            <img 
              src={selectedBank?.topLogo} 
              alt={selectedBank?.name} 
              className={`object-contain max-w-full ${
                selectedBank?.id === 'cbe_birr' 
                  ? 'h-24 -mb-3' 
                  : 'h-16'
              }`} 
            />
          </div>

          {/* Recipient Name */}
          <div className="bg-slate-100/80 dark:bg-slate-800 rounded-lg p-3 text-base font-semibold text-slate-700 dark:text-slate-300">
            {selectedBank?.accountHolder || 'Prosperity Party Dire Dawa Branch Office'}
          </div>

          {/* Account Number */}
          <div className="flex items-center justify-between bg-slate-100/80 dark:bg-slate-800 rounded-lg p-3">
            <span className="text-base text-slate-700 dark:text-slate-300">
              Account: <strong className="text-black dark:text-white font-sans">{selectedBank?.accountNo}</strong>
            </span>
            <button 
              onClick={(e) => { e.preventDefault(); handleCopy(selectedBank?.accountNo || '', 'account') }}
              className={`text-sm rounded px-3 py-1.5 font-sans font-semibold border transition-all duration-200 ${
                copiedField === 'account'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {copiedField === 'account' ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between bg-slate-100/80 dark:bg-slate-800 rounded-lg p-3">
            <span className="text-base text-slate-700 dark:text-slate-300">
              Amount: <strong className="text-black dark:text-white font-sans">Br{Number(totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
            </span>
            <button 
              onClick={(e) => { e.preventDefault(); handleCopy(totalAmount || '0', 'amount') }}
              className={`text-sm rounded px-3 py-1.5 font-sans font-semibold border transition-all duration-200 ${
                copiedField === 'amount'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {copiedField === 'amount' ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          {/* Instruction Text */}
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-2 py-2 leading-relaxed font-medium">
            Transfer Br{Number(totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} to the above account , Then Paste the Transaction ID Found in your {selectedBank?.name} confirmation SMS or bank receipt below
          </p>
        </div>
      )}

      {/* Selected Members Summary */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Paying for {members.length} members (Month {periodMonth}/{periodYear})
        </p>
        <p className="text-[10px] mt-1 text-slate-500">
          Total Fee: <strong className="text-black dark:text-white">ETB {Number(totalAmount).toLocaleString()}</strong>
        </p>
      </div>

      {/* Transaction ID or Reference No (Direct Pay only) */}
      {paymentMethod === 'direct' && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 relative">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-base text-slate-700 dark:text-slate-300 font-sans">
                <strong className="text-black dark:text-white">Transaction ID</strong> or Reference No
              </p>
              <a href="#" onClick={e => e.preventDefault()} className="text-sm text-blue-500 flex items-center gap-1.5 mt-1 hover:underline">
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold font-sans">i</span>
                Where can I find this?
              </a>
            </div>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div className="relative">
            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-tl-sm bg-[#90EE90] opacity-80" />
            <div className="absolute -left-1 -bottom-1 w-2 h-2 rounded-bl-sm bg-[#90EE90] opacity-80" />
            
            <input
              type="text"
              value={transactionId}
              onChange={e => setTransactionId(e.target.value)}
              className="w-full border-2 border-[#5B9BD5] dark:border-blue-500 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/30 text-sm font-medium tracking-wide bg-transparent outline-none z-10 relative font-sans placeholder-slate-400"
              placeholder="e.g. FT21..."
            />
            {!transactionId && (
              <div className="absolute left-[75px] top-1/2 -translate-y-1/2 pointer-events-none text-[#2E7D32] font-bold tracking-[6px] text-lg font-sans opacity-80">
                - - - - - - - - -
              </div>
            )}
          </div>

        </div>
      )}

      {/* Receipt upload (Manual Pay only) */}
      {paymentMethod === 'manual' && (
        <div>
          <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
            Upload Receipt (JPG, PNG, PDF) <span className="text-red-500">*</span>
          </label>
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-5 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer relative"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
            ) : file ? (
              <div className="flex items-center justify-center gap-2 text-sm text-black font-bold dark:text-slate-400">
                <FileText className="w-5 h-5 text-indigo-500" />
                {file.name}
              </div>
            ) : (
              <div className="text-sm text-black font-bold">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p>Click or drag to upload receipt</p>
                <p className="text-[10px] mt-1 text-black font-bold">JPG, PNG or PDF (max 5MB)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes (Manual Pay only) */}
      {paymentMethod !== 'direct' && (
        <div>
          <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes..."
            className="input font-sans"
          />
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`btn flex-1 flex items-center justify-center gap-2 ${paymentMethod === 'direct' ? 'bg-[#0070F3] hover:bg-[#0060DF] text-white border-transparent' : 'btn-primary'}`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : paymentMethod === 'direct' ? null : <Upload className="w-4 h-4" />}
          {loading ? 'Submitting…' : paymentMethod === 'direct' ? 'CONFIRM PAYMENT' : 'Submit for Approval'}
        </button>
      </div>
    </div>
  )
}

/* ─── Main Modal ─────────────────────────────────────────────────────────── */
export default function BulkPaymentMethodModal({ members, periodMonth, periodYear, onClose, onSuccess }: BulkPaymentMethodModalProps) {
  const [step, setStep]                 = useState<Step>('choose_method')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null)
  const [direction, setDirection]       = useState(1)

  const goTo = (nextStep: Step, dir = 1) => { setDirection(dir); setStep(nextStep) }

  const handleSelectMethod = (method: PaymentMethod) => {
    setPaymentMethod(method)
    // Both Direct Pay and Manual Pay go through Step 2 (bank selection)
    goTo('choose_bank', 1)
  }

  const handleSelectBank = (bank: BankOption) => {
    setSelectedBank(bank)
    goTo('upload_slip', 1)
  }

  const handleBack = () => {
    if (step === 'choose_bank') {
      setPaymentMethod(null)
      setSelectedBank(null)
      goTo('choose_method', -1)
    } else if (step === 'upload_slip') {
      goTo('choose_bank', -1)
    }
  }

  const stepNumber: Record<Step, number> = {
    choose_method: 1,
    choose_bank:   2,
    upload_slip:   3
  }

  const headerTitle: Record<Step, string> = {
    choose_method: 'Choose Payment Method',
    choose_bank:   paymentMethod === 'manual' ? 'Choose Your Payment App' : 'Choose Payment Method',
    upload_slip:   paymentMethod === 'direct' ? 'Enter Transaction Details' : 'Upload Payment Slip'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {step !== 'choose_method' && (
                <button
                  onClick={handleBack}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" />
                {headerTitle[step]}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Step indicator */}
              <div className="flex items-center gap-1">
                {([1, 2, 3] as const).map((n, idx) => (
                  <Fragment key={n}>
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                        stepNumber[step] === n
                          ? 'bg-amber-500 text-white'
                          : stepNumber[step] > n
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >{n}</span>
                    {idx < 2 && <span className="w-8 h-1 bg-black dark:bg-slate-400" />}
                  </Fragment>
                ))}
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* ── Step Content ─────────────────────────────────────────────── */}
          <AnimatePresence mode="wait" custom={direction}>

            {/* Step 1 – Choose Method */}
            {step === 'choose_method' && (
              <motion.div
                key="choose_method"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
                className="p-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSelectMethod('direct')}
                    className="group flex flex-col items-center gap-3 p-6 border-2 border-slate-100 dark:border-slate-700 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-200 text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Smartphone className="w-7 h-7 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-bold text-black dark:text-white text-sm">Direct Pay</p>
                      <p className="text-xs text-black font-bold dark:text-slate-400 mt-1 leading-relaxed">
                        Instant activation via Telebirr, CBE Birr or Card. No receipt needed.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectMethod('manual')}
                    className="group flex flex-col items-center gap-3 p-5 border-2 border-slate-100 dark:border-slate-700 rounded-2xl hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all duration-200 text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <CloudUpload className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-black dark:text-white text-sm">Manual Pay</p>
                      <p className="text-xs text-black font-bold dark:text-slate-400 mt-1 leading-relaxed">
                        Pay using your preferred Payment Method first, then upload a screenshot for verification.
                      </p>
                    </div>
                    {/* Mini step guide */}
                    <div className="w-full mt-1 space-y-1 text-left">
                      {[
                        { n: 1, label: 'Choose payment app' },
                        { n: 2, label: 'Complete transfer' },
                        { n: 3, label: 'Upload receipt here' },
                      ].map(s => (
                        <div key={s.n} className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-400/80 text-white text-[9px] font-bold flex items-center justify-center shrink-0">{s.n}</span>
                          <span className="text-[10px] text-black font-bold dark:text-slate-400">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2 – Choose Bank / Payment App */}
            {step === 'choose_bank' && (
              <motion.div
                key="choose_bank"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
                className="p-6"
              >
                <p className="text-sm text-black font-bold dark:text-slate-400 mb-4">
                  {paymentMethod === 'manual'
                    ? 'Select the app you used to make the payment:'
                    : 'Select how you want to pay:'}
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {BANK_OPTIONS.map(bank => (
                    <button
                      key={bank.id}
                      onClick={() => handleSelectBank(bank)}
                      className="group flex flex-col items-center gap-2.5 p-4 border-2 border-slate-100 dark:border-slate-700 rounded-xl hover:border-amber-300 dark:hover:border-amber-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                    >
                      <div className="w-24 h-24 flex items-center justify-center p-1 rounded-xl group-hover:scale-110 transition-transform duration-200">
                        <img src={bank.logo} alt={bank.name} className="max-w-full max-h-full object-contain drop-shadow-sm" />
                      </div>
                      <p className="text-sm font-bold text-black dark:text-slate-300">{bank.name}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3 – Upload Form (inline) */}
            {step === 'upload_slip' && (
              <motion.div
                key="upload_slip"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
              >
                <UploadForm
                  members={members}
                  periodMonth={periodMonth}
                  periodYear={periodYear}
                  selectedBank={selectedBank}
                  paymentMethod={paymentMethod}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
