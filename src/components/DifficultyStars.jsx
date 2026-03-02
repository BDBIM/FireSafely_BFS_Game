import React from 'react'
import { useTranslation } from 'react-i18next'

function DifficultyStars({ difficulty, className = '' }) {
  const { t } = useTranslation()
  if (difficulty == null || typeof difficulty !== 'number') return null

  const stars = Math.max(0.5, Math.min(5, difficulty / 2))
  const fullCount = Math.floor(stars)
  const hasHalf = stars % 1 >= 0.5
  const emptyCount = 5 - fullCount - (hasHalf ? 1 : 0)

  return (
    <span className={`inline-flex items-center gap-0 text-[1em] leading-none ${className}`} title={t('game.level') + ' ' + difficulty + '/10'}>
      {Array.from({ length: fullCount }, (_, i) => (
        <span key={`full-${i}`} className="inline-block text-[#f0c040]">★</span>
      ))}
      {hasHalf && (
        <span className="relative inline-block w-[1em] h-[1em]">
          <span className="absolute left-0 top-0 w-1/2 overflow-hidden text-[#f0c040] z-[1]">★</span>
          <span className="absolute left-0 top-0 text-gray-300 z-0">☆</span>
        </span>
      )}
      {Array.from({ length: emptyCount }, (_, i) => (
        <span key={`empty-${i}`} className="inline-block text-gray-300">☆</span>
      ))}
    </span>
  )
}

export default DifficultyStars
