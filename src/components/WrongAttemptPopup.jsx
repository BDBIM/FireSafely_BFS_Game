import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './WrongAttemptPopup.css'

export default function WrongAttemptPopup({ show, onDismiss, duration = 1500 }) {
  const { t } = useTranslation()
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => {
      onDismissRef.current?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [show, duration])

  if (!show) return null

  return (
    <div className="wrong-attempt-popup" role="alert">
      <span className="wrong-attempt-popup-text">✗ {t('game.wrongAttempt')}</span>
    </div>
  )
}
