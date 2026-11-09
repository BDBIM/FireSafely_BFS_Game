import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const DISMISS_KEY = 'offline-hint-dismissed'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export default function OfflineReady() {
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')

  useEffect(() => {
    if (isStandalone() || !('serviceWorker' in navigator)) return undefined
    let cancelled = false
    navigator.serviceWorker.ready
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready || dismissed || isStandalone()) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-4 text-sm text-gray-800 shadow-lg">
      <p className="mb-1 font-semibold">{t('offline.readyTitle')}</p>
      <p className="mb-3 leading-relaxed">{t('offline.readyHint')}</p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, '1')
          setDismissed(true)
        }}
        className="rounded-lg bg-[#667eea] px-4 py-2 font-semibold text-white"
      >
        {t('offline.dismiss')}
      </button>
    </div>
  )
}
