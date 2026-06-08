import { useTranslation } from 'react-i18next'
import { Languages, Check } from 'lucide-react'
import { useState } from 'react'

const LANGUAGES = [
  { code: 'en', label: 'English', localLabel: 'English' },
  { code: 'am', label: 'Amharic', localLabel: 'አማርኛ' },
  { code: 'om', label: 'Afaan Oromo', localLabel: 'Afaan Oromoo' },
  { code: 'so', label: 'Somali', localLabel: 'Soomaali' }
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const currentLang = i18n.language?.startsWith('am') ? 'am' : i18n.language?.startsWith('om') ? 'om' : i18n.language?.startsWith('so') ? 'so' : 'en'
  const current = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0]

  const switchLang = (code: string) => {
    i18n.changeLanguage(code)
    document.documentElement.lang = code
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-[10px] font-black text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
      >
        <Languages className="w-3.5 h-3.5" />
        <span>{current.localLabel}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-black/10 py-1.5 min-w-[170px]">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLang(lang.code)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-bold transition-colors text-left
                  ${currentLang === lang.code
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                  ${currentLang === lang.code
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-slate-300 dark:border-slate-600'
                  }`}>
                  {currentLang === lang.code && <Check className="w-3 h-3 text-white" />}
                </span>
                <div className="flex flex-col">
                  <span>{lang.label}</span>
                  {lang.localLabel !== lang.label && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">{lang.localLabel}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
