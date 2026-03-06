import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import GameBoard from '../components/GameBoard'
import GameInfo, { GameHint } from '../components/GameInfo'
import WrongAttemptPopup from '../components/WrongAttemptPopup'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { presetLevels } from '../data/loadPresetLevels'
import { generateMap, calculateDistanceToNearestStartForPoint, checkIsObstacle, checkIsDoorBlock } from '../components/MapGenerator'

const CLASSIC_LEVEL_COUNT = 8
const NEXT_LEVEL_COUNTDOWN_SEC = 5
const TIME_BONUS_MAX = 5000 // max bonus at 0 seconds; each second reduces bonus by 1

function getNumericDifficulty(level) {
  const d = level.difficulty
  if (typeof d === 'number' && d >= 1 && d <= 10) return d
  return 5
}

// Pick 8 random levels and sort by difficulty (easiest first)
function pickClassicLevels() {
  const pool = [...presetLevels]
  if (pool.length === 0) return []
  const count = Math.min(CLASSIC_LEVEL_COUNT, pool.length)
  const shuffled = pool.sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)
  return selected.sort((a, b) => getNumericDifficulty(a) - getNumericDifficulty(b))
}

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function GameClassic() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [levels] = useState(() => pickClassicLevels())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [overallStartTime] = useState(() => Date.now())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [totalLevelScore, setTotalLevelScore] = useState(0) // sum of each level's score when won
  const [showingAnswer, setShowingAnswer] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)

  const level = levels[currentIndex] || null
  const maxAttempts = (typeof level?.maxAttempts === 'number' && level.maxAttempts >= 1) ? level.maxAttempts : 5
  const timeLimit = level?.timeLimit != null && typeof level.timeLimit === 'number' ? level.timeLimit : null

  const [gridSize, setGridSize] = useState(level?.gridSize || 10)
  const [startPoints, setStartPoints] = useState([])
  const [farthestPoints, setFarthestPoints] = useState([])
  const [guessedPoints, setGuessedPoints] = useState([])
  const [gameStatus, setGameStatus] = useState('waiting')
  const [attempts, setAttempts] = useState(0)
  const [score, setScore] = useState(0)
  const [allCellDistances, setAllCellDistances] = useState({})
  const [obstacles, setObstacles] = useState([])
  const [doorBlocks, setDoorBlocks] = useState([])
  const [showWrongPopup, setShowWrongPopup] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(() => (timeLimit != null ? timeLimit : null))

  const initializeForLevel = (lvl) => {
    if (!lvl) return
    const mapData = generateMap(lvl.gridSize, 'preset', lvl)
    setGridSize(mapData.gridSize)
    setStartPoints(mapData.startPoints)
    setFarthestPoints(mapData.farthestPoints)
    setObstacles(mapData.obstacles)
    setDoorBlocks(mapData.doorBlocks || [])
    setAllCellDistances(mapData.allCellDistances)
    setGuessedPoints([])
    setGameStatus('waiting')
    setAttempts(0)
    setScore(0)
    setShowingAnswer(false)
    setCountdownSeconds(0)
    if (lvl.timeLimit != null && typeof lvl.timeLimit === 'number') {
      setTimeRemaining(lvl.timeLimit)
    } else {
      setTimeRemaining(null)
    }
  }

  useEffect(() => {
    if (level) initializeForLevel(level)
  }, [currentIndex, level])

  // Countdown 5 → 0 when showing answer; advance to next level when countdown hits 0
  useEffect(() => {
    if (!showingAnswer || currentIndex >= levels.length - 1 || countdownSeconds <= 0) return
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          setCurrentIndex((i) => (i + 1 < levels.length ? i + 1 : i))
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showingAnswer, currentIndex, levels.length, countdownSeconds])

  const isLastLevel = currentIndex >= levels.length - 1
  const gameEnded = gameStatus === 'lost' || (gameStatus === 'won' && showingAnswer && isLastLevel)

  // Overall elapsed timer (updates every second); stop when game is finished or failed
  useEffect(() => {
    if (gameEnded) return
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - overallStartTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [overallStartTime, gameEnded])

  const handleCellClick = (x, y) => {
    if (showingAnswer) return
    if (gameStatus === 'waiting') setGameStatus('playing')
    else if (gameStatus !== 'playing') return
    if (startPoints.some(sp => sp.x === x && sp.y === y)) return
    if (checkIsObstacle(x, y, obstacles)) return
    if (checkIsDoorBlock(x, y, doorBlocks)) return
    if (guessedPoints.some(p => p.x === x && p.y === y)) return

    const newAttempts = attempts + 1
    const clickedDistance = calculateDistanceToNearestStartForPoint(
      { x, y }, startPoints, obstacles, gridSize, doorBlocks
    )
    const isCorrect = farthestPoints.some(fp => fp.x === x && fp.y === y)

    setAttempts(newAttempts)
    setGuessedPoints([...guessedPoints, { x, y, distance: clickedDistance, isCorrect }])

    if (isCorrect) {
      const levelScore = 1000 + (maxAttempts - newAttempts + 1) * 200
      setGameStatus('won')
      setScore(levelScore)
      setTotalLevelScore((prev) => prev + levelScore)
      setShowingAnswer(true)
      setCountdownSeconds(NEXT_LEVEL_COUNTDOWN_SEC)
    } else {
      setShowWrongPopup(true)
      if (newAttempts >= maxAttempts) setGameStatus('lost')
    }
  }

  const resetGame = () => initializeForLevel(level)

  useEffect(() => {
    const isActive = gameStatus === 'waiting' || gameStatus === 'playing'
    if (!isActive || timeLimit == null || timeRemaining == null) return
    if (timeRemaining <= 0) {
      setGameStatus('lost')
      return
    }
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev != null && prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [gameStatus, timeLimit, timeRemaining])

  useEffect(() => {
    if (timeLimit != null && timeRemaining === 0 && gameStatus === 'playing') setGameStatus('lost')
  }, [timeLimit, timeRemaining, gameStatus])

  const handleBackToHome = () => navigate('/')

  if (levels.length === 0) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <div className="bg-white rounded-[20px] p-8 shadow-card max-w-md text-center">
          <p className="text-gray-600 mb-4">{t('classic.noLevels')}</p>
          <button
            type="button"
            onClick={handleBackToHome}
            className="py-2.5 px-5 rounded-lg text-white font-semibold bg-gradient-to-br from-[#667eea] to-[#764ba2]"
          >
            ← {t('common.backToHome')}
          </button>
        </div>
      </div>
    )
  }

  const allComplete = gameStatus === 'won' && showingAnswer && isLastLevel

  if (allComplete) {
    const timeBonus = Math.max(0, TIME_BONUS_MAX - elapsedSeconds)
    const totalScore = totalLevelScore + timeBonus
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <div className="bg-white rounded-[20px] p-8 shadow-card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎉 {t('classic.allComplete')}</h2>
          <p className="text-lg text-gray-600 mb-1">{t('classic.totalTime')}: <strong>{formatElapsed(elapsedSeconds)}</strong></p>
          <p className="text-sm text-gray-500 mb-1">{t('classic.levelsTotal')}: <strong>{totalLevelScore}</strong></p>
          <p className="text-sm text-gray-500 mb-2">{t('classic.timeBonus')}: <strong>+{timeBonus}</strong></p>
          <p className="text-xl font-bold text-[#667eea] mb-4">{t('classic.totalScore')}: <strong>{totalScore}</strong></p>
          <button
            type="button"
            onClick={handleBackToHome}
            className="mt-6 py-3 px-6 rounded-lg text-white font-semibold bg-gradient-to-br from-[#667eea] to-[#764ba2] hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            ← {t('common.backToHome')}
          </button>
        </div>
      </div>
    )
  }

  if (!level) return null

  return (
    <div className="w-full min-h-screen flex justify-center items-center">
      <WrongAttemptPopup show={showWrongPopup} onDismiss={() => setShowWrongPopup(false)} />
      <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-card w-full max-w-[900px] relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <button
            type="button"
            onClick={handleBackToHome}
            className="py-2.5 px-5 rounded-lg text-white font-semibold text-base bg-gradient-to-br from-[#667eea] to-[#764ba2] border-none shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 md:w-auto w-full"
          >
            ← {t('common.backToHome')}
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="py-2 px-4 rounded-lg font-semibold text-sm bg-amber-100 text-amber-800 border border-amber-400">
              {t('classic.levelCounter', { current: currentIndex + 1, total: levels.length })}
            </div>
            <div className="py-2 px-4 rounded-lg font-semibold text-sm bg-blue-100 text-blue-800 border border-blue-400">
              ⏱ {t('classic.totalTime')}: {formatElapsed(elapsedSeconds)}
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {gameStatus === 'won' && showingAnswer && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/40" aria-modal="true" role="dialog">
            <div className="rounded-xl py-5 px-8 bg-green-50 border-2 border-green-400 text-green-800 text-center font-semibold text-lg shadow-xl">
              {isLastLevel ? t('classic.allComplete') : t('classic.nextLevelIn', { seconds: countdownSeconds })}
            </div>
          </div>
        )}

        {gameStatus === 'lost' && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
            <div className="rounded-xl py-6 px-6 max-w-sm w-full bg-red-50 border-2 border-red-400 text-red-800 text-center shadow-xl">
              <p className="font-semibold text-lg m-0">{t('classic.gameOver')}</p>
              <p className="text-sm m-0 mt-2">{t('classic.totalTime')}: {formatElapsed(elapsedSeconds)} · {t('classic.levelCounter', { current: currentIndex + 1, total: levels.length })}</p>
              <button
                type="button"
                onClick={handleBackToHome}
                className="mt-4 py-2.5 px-5 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600 transition-colors"
              >
                ← {t('common.backToHome')}
              </button>
            </div>
          </div>
        )}

        <GameInfo
          gameStatus={gameStatus}
          attempts={attempts}
          maxAttempts={maxAttempts}
          score={score}
          startPoints={startPoints}
          farthestPoints={farthestPoints}
          onReset={resetGame}
          gridSize={gridSize}
          gameMode="classic"
          timeLimit={timeLimit}
          timeRemaining={timeRemaining}
        />
        <GameBoard
          gridSize={gridSize}
          startPoints={startPoints}
          farthestPoints={farthestPoints}
          guessedPoints={guessedPoints}
          gameStatus={gameStatus}
          onCellClick={handleCellClick}
          allCellDistances={allCellDistances}
          obstacles={obstacles}
          doorBlocks={doorBlocks}
        />
        <GameHint startPoints={startPoints} />
      </div>
    </div>
  )
}

export default GameClassic
