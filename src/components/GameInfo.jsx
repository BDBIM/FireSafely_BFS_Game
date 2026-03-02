import React from 'react'
import { useTranslation } from 'react-i18next'

const GameInfo = ({
  gameStatus,
  attempts,
  maxAttempts,
  score,
  startPoints,
  farthestPoints,
  onReset,
  gridSize,
  gameMode = 'random',
  timeLimit = null,
  timeRemaining = null
}) => {
  const { t, i18n } = useTranslation()

  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'waiting':
        return t('game.waiting')
      case 'playing':
        return t('game.guessing', { attempts, maxAttempts })
      case 'won':
        return t('game.won', { score })
      case 'lost':
        if (timeLimit != null && timeRemaining === 0) {
          return t('game.timeUp')
        }
        if (farthestPoints && farthestPoints.length > 0) {
          if (farthestPoints.length === 1) {
            return t('game.lostFarthest', { points: `(${farthestPoints[0].x}, ${farthestPoints[0].y})` })
          }
          return t('game.lostFarthestCount', { count: farthestPoints.length })
        }
        return t('game.lostFarthest', { points: '' })
      default:
        return ''
    }
  }

  return (
    <div className="mb-5 relative z-10 pointer-events-auto">
      <div className="rounded-xl p-5 mb-4 bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2]">
        <div className="text-lg font-semibold text-gray-800 text-center mb-4 min-h-[30px] flex items-center justify-center">
          {getStatusMessage()}
        </div>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
          {timeLimit != null && (
            <div className="flex items-center gap-2">
              <span className="text-base text-gray-500 font-medium">{t('game.timeRemaining')}：</span>
              <span
                className={`text-lg font-bold min-w-[4ch] ${timeRemaining !== null && timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-[#667eea]'}`}
              >
                {timeRemaining != null ? t('common.seconds', { count: timeRemaining }) : '—'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-base text-gray-500 font-medium">{t('game.attempts')}：</span>
            <span className="text-lg font-bold text-[#667eea]">{attempts}/{maxAttempts}</span>
          </div>
          {score > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-base text-gray-500 font-medium">{t('game.score')}：</span>
              <span className="text-lg font-bold text-[#667eea]">{score}</span>
            </div>
          )}
          <button
            type="button"
            onClick={onReset}
            className="py-2 px-5 rounded-lg text-white font-semibold text-base bg-gradient-to-br from-[#667eea] to-[#764ba2] border-none shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 relative z-10 pointer-events-auto select-none"
          >
            {gameStatus === 'playing' ? t('game.restart') : t('game.newGame')}
          </button>
        </div>
      </div>

      {startPoints && startPoints.length > 0 && (
        <div className="rounded-lg p-3 text-center bg-amber-100 border-2 border-amber-400">
          <p className="text-amber-800 text-sm font-medium m-0">
            {t('game.hint', {
              count: startPoints.length,
              coords: startPoints.map((sp) => `(${sp.x}, ${sp.y})`).join(i18n.language === 'zh-Hant' ? '、' : ', ')
            })}
          </p>
        </div>
      )}
    </div>
  )
}

export default GameInfo
