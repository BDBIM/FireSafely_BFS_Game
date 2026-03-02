import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './GameConfig.css'

const GameConfig = ({
  gridSize,
  exitCount,
  obstaclePercentage,
  maxAttempts,
  onlyWallObstacles,
  onConfigChange,
  gameMode,
  gameStatus
}) => {
  const [localGridSize, setLocalGridSize] = useState(gridSize)
  const [localExitCount, setLocalExitCount] = useState(exitCount)
  const [localObstaclePercentage, setLocalObstaclePercentage] = useState(obstaclePercentage)
  const [localMaxAttempts, setLocalMaxAttempts] = useState(maxAttempts)
  const [localOnlyWallObstacles, setLocalOnlyWallObstacles] = useState(onlyWallObstacles)
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleApply = () => {
    onConfigChange({
      gridSize: localGridSize,
      exitCount: localExitCount,
      obstaclePercentage: localObstaclePercentage,
      maxAttempts: localMaxAttempts,
      onlyWallObstacles: localOnlyWallObstacles
    })
    setIsOpen(false)
  }

  const handleReset = () => {
    setLocalGridSize(10)
    setLocalExitCount(null)
    setLocalObstaclePercentage(15)
    setLocalMaxAttempts(5)
    setLocalOnlyWallObstacles(true)
    onConfigChange({
      gridSize: 10,
      exitCount: null,
      obstaclePercentage: 15,
      maxAttempts: 5,
      onlyWallObstacles: true
    })
  }

  const isDisabled = gameStatus === 'playing'

  return (
    <div className="absolute top-3 right-3 z-20" ref={containerRef}>
      <button
        type="button"
        title={t('gameConfig.title')}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-lg leading-none cursor-pointer select-none transition-all duration-300 border-[1.5px] ${
          isOpen
            ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] border-[#764ba2] text-white rotate-90'
            : 'bg-[#667eea]/10 border-[#667eea]/30 text-[#667eea] hover:bg-[#667eea]/20 hover:border-[#667eea] hover:rotate-45'
        }`}
      >
        ⚙
      </button>

      {isOpen && (
        <div className="config-panel-in absolute top-[calc(100%+8px)] right-0 w-[310px] md:w-[310px] max-w-[calc(100vw-32px)] rounded-xl p-3.5 bg-gradient-to-br from-[#f5f7fa] to-[#dce5f0] shadow-lg">
          <div className="text-base font-bold text-gray-800 text-center mb-3 pb-2 border-b-2 border-[#667eea]/20">
            {t('gameConfig.panelTitle')}
          </div>

          <div className="mb-3">
            <label htmlFor="config-grid-size" className="block text-sm text-gray-800 font-semibold mb-1">
              {t('gameConfig.gridSize')}：<span className="text-[#667eea] font-bold ml-1">{localGridSize}x{localGridSize}</span>
            </label>
            <input
              type="range"
              id="config-grid-size"
              min="5"
              max="30"
              value={localGridSize}
              onChange={(e) => setLocalGridSize(Number(e.target.value))}
              disabled={isDisabled}
              className="config-slider w-full h-1.5 rounded bg-gray-300 outline-none mb-1.5 appearance-none"
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {[5, 8, 10, 12, 15, 20, 25, 30].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setLocalGridSize(size)}
                  disabled={isDisabled}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-all ${
                    localGridSize === size
                      ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-[#764ba2]'
                      : 'bg-white text-[#667eea] border-[#667eea] hover:bg-gray-100 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="config-exit-count" className="block text-sm text-gray-800 font-semibold mb-1">
              {t('gameConfig.exitCount')}：<span className="text-[#667eea] font-bold ml-1">{localExitCount === null ? t('gameConfig.auto') : localExitCount}</span>
            </label>
            <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 mt-1">
              <label className="flex items-center gap-1 font-medium cursor-pointer text-[0.82rem]">
                <input type="radio" name="exit-count" checked={localExitCount === null} onChange={() => setLocalExitCount(null)} disabled={isDisabled} className="w-3.5 h-3.5 cursor-pointer accent-[#667eea] disabled:opacity-60 disabled:cursor-not-allowed" />
                {t('gameConfig.auto')}
              </label>
              {[1, 2, 3, 4, 5, 6].map(count => (
                <label key={count} className="flex items-center gap-1 font-medium cursor-pointer text-[0.82rem]">
                  <input type="radio" name="exit-count" checked={localExitCount === count} onChange={() => setLocalExitCount(count)} disabled={isDisabled} className="w-3.5 h-3.5 cursor-pointer accent-[#667eea] disabled:opacity-60 disabled:cursor-not-allowed" />
                  {t('gameConfig.exits', { count })}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="config-obstacle" className="block text-sm text-gray-800 font-semibold mb-1">
              {t('gameConfig.obstaclePercent')}：<span className="text-[#667eea] font-bold ml-1">{localObstaclePercentage}%</span>
            </label>
            <input
              type="range"
              id="config-obstacle"
              min="0"
              max="30"
              step="5"
              value={localObstaclePercentage}
              onChange={(e) => setLocalObstaclePercentage(Number(e.target.value))}
              disabled={isDisabled}
              className="config-slider w-full h-1.5 rounded bg-gray-300 outline-none mb-1.5 appearance-none"
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {[0, 5, 10, 15, 20, 25, 30].map(percent => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => setLocalObstaclePercentage(percent)}
                  disabled={isDisabled}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-all ${
                    localObstaclePercentage === percent
                      ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-[#764ba2]'
                      : 'bg-white text-[#667eea] border-[#667eea] hover:bg-gray-100 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none'
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="config-only-wall" className="flex items-center gap-1.5 font-semibold text-sm text-gray-800 cursor-pointer">
              <input type="checkbox" id="config-only-wall" checked={localOnlyWallObstacles} onChange={(e) => setLocalOnlyWallObstacles(e.target.checked)} disabled={isDisabled} className="w-3.5 h-3.5 cursor-pointer accent-[#667eea] mr-1.5 disabled:opacity-60 disabled:cursor-not-allowed" />
              {t('gameConfig.onlyWalls')}
            </label>
            <p className="text-[0.74rem] text-gray-500 mt-0.5 ml-5 italic leading-snug">{t('gameConfig.onlyWallsHint')}</p>
          </div>

          <div className="mb-3">
            <label htmlFor="config-attempts" className="block text-sm text-gray-800 font-semibold mb-1">
              {t('gameConfig.maxAttempts')}：<span className="text-[#667eea] font-bold ml-1">{t('gameConfig.maxAttemptsValue', { count: localMaxAttempts })}</span>
            </label>
            <input
              type="range"
              id="config-attempts"
              min="3"
              max="10"
              value={localMaxAttempts}
              onChange={(e) => setLocalMaxAttempts(Number(e.target.value))}
              disabled={isDisabled}
              className="config-slider w-full h-1.5 rounded bg-gray-300 outline-none mb-1.5 appearance-none"
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {[3, 4, 5, 6, 7, 8, 9, 10].map(att => (
                <button
                  key={att}
                  type="button"
                  onClick={() => setLocalMaxAttempts(att)}
                  disabled={isDisabled}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-all ${
                    localMaxAttempts === att
                      ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-[#764ba2]'
                      : 'bg-white text-[#667eea] border-[#667eea] hover:bg-gray-100 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none'
                  }`}
                >
                  {att}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-2.5 pt-2.5 border-t-2 border-[#667eea]/20">
            <button type="button" onClick={handleApply} disabled={isDisabled} className="flex-1 py-1.5 px-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#667eea] to-[#764ba2] border-none shadow-md hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all">
              {t('gameConfig.apply')}
            </button>
            <button type="button" onClick={handleReset} disabled={isDisabled} className="flex-1 py-1.5 px-3 rounded-lg text-sm font-semibold text-[#667eea] bg-white border border-[#667eea] hover:bg-gray-100 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all">
              {t('gameConfig.resetDefault')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameConfig
