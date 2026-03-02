import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', labelKey: 'lang.en' },
  { code: 'fr', labelKey: 'lang.fr' },
  { code: 'zh-Hant', labelKey: 'lang.zh-Hant' },
]

function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const setLang = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    setOpen(false)
  }

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border-2 border-[#667eea]/40 bg-white/80 text-gray-700 font-medium text-sm hover:border-[#667eea] transition-colors"
        title="Language"
      >
        <span className="text-base">🌐</span>
        <span>{t(current.labelKey)}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[140px] z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLang(lang.code)}
              className={`w-full text-left py-2 px-3 text-sm font-medium transition-colors ${i18n.language === lang.code ? 'bg-[#667eea] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {t(lang.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
