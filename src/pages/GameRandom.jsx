import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import GameBoard from '../components/GameBoard'
import GameInfo, { GameHint } from '../components/GameInfo'
import WrongAttemptPopup from '../components/WrongAttemptPopup'
import GameConfig from '../components/GameConfig'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { exportLevel } from '../utils/levelStorage'
import { generateMap, calculateDistanceToNearestStartForPoint, checkIsObstacle, checkIsDoorBlock } from '../components/MapGenerator'

function GameRandom() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [gridSize, setGridSize] = useState(10)
  const [exitCount, setExitCount] = useState(null)
  const [obstaclePercentage, setObstaclePercentage] = useState(15)
  const [maxAttempts, setMaxAttempts] = useState(5)
  const [onlyWallObstacles, setOnlyWallObstacles] = useState(true)
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
  const timeLimit = null
  const timeRemaining = null

  const initializeGame = (configOverrides = {}) => {
    const nextGridSize = configOverrides.gridSize ?? gridSize
    const nextExitCount = Object.prototype.hasOwnProperty.call(configOverrides, 'exitCount') ? configOverrides.exitCount : exitCount
    const nextObstaclePercentage = configOverrides.obstaclePercentage ?? obstaclePercentage
    const nextOnlyWallObstacles = configOverrides.onlyWallObstacles ?? onlyWallObstacles

    const mapData = generateMap(
      nextGridSize,
      'random',
      null,
      nextExitCount,
      nextObstaclePercentage,
      nextOnlyWallObstacles
    )
    if (mapData.gridSize !== nextGridSize) setGridSize(mapData.gridSize)
    setStartPoints(mapData.startPoints)
    setFarthestPoints(mapData.farthestPoints)
    setObstacles(mapData.obstacles)
    setDoorBlocks(mapData.doorBlocks || [])
    setAllCellDistances(mapData.allCellDistances)
    setGuessedPoints([])
    setGameStatus('waiting')
    setAttempts(0)
    setScore(0)
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

  const handleConfigChange = (config) => {
    let shouldReinitialize = false
    const nextConfig = {}
    if (config.gridSize !== undefined) {
      const validatedSize = Math.max(3, Math.min(30, Math.floor(config.gridSize)))
      if (validatedSize !== gridSize) {
        setGridSize(validatedSize)
        nextConfig.gridSize = validatedSize
        shouldReinitialize = true
      }
    }
    if (config.exitCount !== undefined && config.exitCount !== exitCount) {
      setExitCount(config.exitCount)
      nextConfig.exitCount = config.exitCount
      shouldReinitialize = true
    }
    if (config.obstaclePercentage !== undefined && config.obstaclePercentage !== obstaclePercentage) {
      setObstaclePercentage(config.obstaclePercentage)
      nextConfig.obstaclePercentage = config.obstaclePercentage
      shouldReinitialize = true
    }
    if (config.onlyWallObstacles !== undefined && config.onlyWallObstacles !== onlyWallObstacles) {
      setOnlyWallObstacles(config.onlyWallObstacles)
      nextConfig.onlyWallObstacles = config.onlyWallObstacles
      shouldReinitialize = true
    }
    if (config.maxAttempts !== undefined && config.maxAttempts !== maxAttempts) {
      setMaxAttempts(config.maxAttempts)
    }
    if (shouldReinitialize) initializeGame(nextConfig)
  }

  const handleBackToHome = () => navigate('/')
  const handleExportLevel = () => {
    exportLevel({
      name: 'Random Level',
      gridSize,
      difficulty: 5,
      timeLimit: null,
      maxAttempts,
      startPoints: [...startPoints],
      obstacles: [...obstacles],
      doorBlocks: [...doorBlocks],
    })
  }

  useEffect(() => {
    initializeGame()
  }, [])

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
          </div>
        </div>
        <GameConfig
          gridSize={gridSize}
          exitCount={exitCount}
          obstaclePercentage={obstaclePercentage}
          maxAttempts={maxAttempts}
          onlyWallObstacles={onlyWallObstacles}
          onConfigChange={handleConfigChange}
          gameMode="random"
          gameStatus={gameStatus}
        />
        <GameInfo
          gameStatus={gameStatus}
          attempts={attempts}
          maxAttempts={maxAttempts}
          score={score}
          startPoints={startPoints}
          farthestPoints={farthestPoints}
          onReset={resetGame}
          gridSize={gridSize}
          gameMode="random"
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

export default GameRandom
