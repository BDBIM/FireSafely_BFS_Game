import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import GameBoard from '../components/GameBoard'
import GameInfo, { GameHint } from '../components/GameInfo'
import WrongAttemptPopup from '../components/WrongAttemptPopup'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { exportLevel } from '../utils/levelStorage'
import { generateMap, calculateDistanceToNearestStartForPoint, checkIsObstacle, checkIsDoorBlock } from '../components/MapGenerator'

function GamePreset() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const level = location.state?.level || null

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
  const maxAttempts = (typeof level?.maxAttempts === 'number' && level.maxAttempts >= 1) ? level.maxAttempts : 5
  const timeLimit = level?.timeLimit != null && typeof level.timeLimit === 'number' ? level.timeLimit : null
  const [timeRemaining, setTimeRemaining] = useState(() => (timeLimit != null ? timeLimit : null))

  const initializeGame = () => {
    const mapData = generateMap(gridSize, 'preset', level)
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
    if (level?.timeLimit != null) {
      setTimeRemaining(level.timeLimit)
    } else {
      setTimeRemaining(null)
    }
  }

  const handleCellClick = (x, y) => {
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
      setGameStatus('won')
      setScore(1000 + (maxAttempts - newAttempts + 1) * 200)
    } else {
      setShowWrongPopup(true)
      if (newAttempts >= maxAttempts) setGameStatus('lost')
    }
  }

  const resetGame = () => initializeGame()

  const handleBackToHome = () => navigate('/')
  const handleExportLevel = () => {
    exportLevel({
      name: level?.name ?? 'Exported Level',
      gridSize,
      difficulty: level?.difficulty ?? 5,
      timeLimit: level?.timeLimit ?? null,
      maxAttempts,
      startPoints: [...startPoints],
      obstacles: [...obstacles],
      doorBlocks: [...doorBlocks],
    })
  }

  useEffect(() => {
    if (!level) {
      navigate('/presetLevels', { replace: true })
      return
    }
    initializeGame()
  }, [level])

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
            <button
              type="button"
              onClick={handleExportLevel}
              className="py-2 px-4 rounded-lg font-semibold text-sm bg-white/90 text-[#667eea] border-2 border-white hover:bg-white hover:shadow-md transition-all duration-300"
            >
              📥 {t('game.exportLevel')}
            </button>
            <LanguageSwitcher />
            <div className="py-2 px-4 rounded-lg text-white font-semibold text-sm bg-gradient-to-br from-[#f093fb] to-[#f5576c]">
              {t('game.level')}: {level.name}
            </div>
          </div>
        </div>
        <GameInfo
          gameStatus={gameStatus}
          attempts={attempts}
          maxAttempts={maxAttempts}
          score={score}
          startPoints={startPoints}
          farthestPoints={farthestPoints}
          onReset={resetGame}
          gridSize={gridSize}
          gameMode="preset"
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

export default GamePreset
