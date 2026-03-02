import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import GameBoard from '../components/GameBoard'
import GameInfo from '../components/GameInfo'
import GameConfig from '../components/GameConfig'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { generateMap, calculateDistanceToNearestStartForPoint, checkIsObstacle, checkIsDoorBlock } from '../components/MapGenerator'

function Game() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const gameMode = location.state?.mode || 'random' // 'random' or 'preset'
  const presetLevel = location.state?.level || null

  const [gridSize, setGridSize] = useState(presetLevel?.gridSize || 10)
  const [exitCount, setExitCount] = useState(null) // null 表示自動
  const [obstaclePercentage, setObstaclePercentage] = useState(15)
  const [maxAttempts, setMaxAttempts] = useState(5)
  const [onlyWallObstacles, setOnlyWallObstacles] = useState(true) // 默認只生成牆壁障礙物
  const [startPoints, setStartPoints] = useState([])
  const [farthestPoints, setFarthestPoints] = useState([])
  const [guessedPoints, setGuessedPoints] = useState([])
  const [gameStatus, setGameStatus] = useState('waiting')
  const [attempts, setAttempts] = useState(0)
  const [score, setScore] = useState(0)
  const [allCellDistances, setAllCellDistances] = useState({})
  const [obstacles, setObstacles] = useState([])
  const [doorBlocks, setDoorBlocks] = useState([])
  const timeLimit = presetLevel?.timeLimit != null && typeof presetLevel.timeLimit === 'number' ? presetLevel.timeLimit : null
  const [timeRemaining, setTimeRemaining] = useState(() => (timeLimit != null ? timeLimit : null))

  // 初始化遊戲
  const initializeGame = (configOverrides = {}) => {
    const nextGridSize = configOverrides.gridSize ?? gridSize
    const nextExitCount = Object.prototype.hasOwnProperty.call(configOverrides, 'exitCount')
      ? configOverrides.exitCount
      : exitCount
    const nextObstaclePercentage = configOverrides.obstaclePercentage ?? obstaclePercentage
    const nextOnlyWallObstacles = configOverrides.onlyWallObstacles ?? onlyWallObstacles

    const mapData = generateMap(
      nextGridSize,
      gameMode, 
      presetLevel, 
      nextExitCount,
      nextObstaclePercentage,
      nextOnlyWallObstacles
    )
    
    if (mapData.gridSize !== nextGridSize) {
      setGridSize(mapData.gridSize)
    }
    
    setStartPoints(mapData.startPoints)
    setFarthestPoints(mapData.farthestPoints)
    setObstacles(mapData.obstacles)
    setDoorBlocks(mapData.doorBlocks || [])
    setAllCellDistances(mapData.allCellDistances)
    setGuessedPoints([])
    setGameStatus('waiting')
    setAttempts(0)
    setScore(0)
    if (presetLevel?.timeLimit != null) {
      setTimeRemaining(presetLevel.timeLimit)
    } else {
      setTimeRemaining(null)
    }
  }

  // 處理格子點擊
  const handleCellClick = (x, y) => {
    if(gameStatus === 'waiting'){
      setGameStatus('playing')
    }else if (gameStatus !== 'playing'){
      return
    }
    if (startPoints.some(sp => sp.x === x && sp.y === y)) return
    if (checkIsObstacle(x, y, obstacles)) return
    if (checkIsDoorBlock(x, y, doorBlocks)) return // door blocks 不能點擊
    if (guessedPoints.some(p => p.x === x && p.y === y)) return
    
    const newAttempts = attempts + 1
    const clickedDistance = calculateDistanceToNearestStartForPoint(
      { x, y }, 
      startPoints, 
      obstacles, 
      gridSize,
      doorBlocks
    )
    const isCorrect = farthestPoints.some(fp => fp.x === x && fp.y === y)
    
    setAttempts(newAttempts)
    setGuessedPoints([
      ...guessedPoints,
      { x, y, distance: clickedDistance, isCorrect }
    ])
    
    if (isCorrect) {
      setGameStatus('won')
      setScore(calculateScore(newAttempts, maxAttempts))
    } else if (newAttempts >= maxAttempts) {
      setGameStatus('lost')
    }
  }

  // 計算分數
  const calculateScore = (usedAttempts, maxAttempts) => {
    const baseScore = 1000
    const attemptBonus = (maxAttempts - usedAttempts + 1) * 200
    return baseScore + attemptBonus
  }

  // 重置遊戲
  const resetGame = () => {
    initializeGame()
  }

  // 處理配置變更
  const handleConfigChange = (config) => {
    if (gameMode === 'preset') return // 預設關卡不能改變配置
    
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
      // 不需要重新初始化遊戲，只更新嘗試次數限制
    }
    
    if (shouldReinitialize) {
      initializeGame(nextConfig)
    }
  }

  // 返回首頁
  const handleBackToHome = () => {
    navigate('/')
  }

  useEffect(() => {
    initializeGame()
  }, [gameMode, presetLevel])

  // 倒數計時：有時間限制時，一進入關卡就開始倒數（不需等點擊），到 0 即失敗
  useEffect(() => {
    const isActive = gameStatus === 'waiting' || gameStatus === 'playing'
    if (!isActive || timeLimit == null || timeRemaining == null) return
    if (timeRemaining <= 0) {
      setGameStatus('lost')
      return
    }
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev == null || prev <= 1) return 0
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameStatus, timeLimit, timeRemaining])

  // 當剩餘時間變為 0 時結束遊戲
  useEffect(() => {
    const isActive = gameStatus === 'waiting' || gameStatus === 'playing'
    if (timeLimit != null && timeRemaining === 0 && isActive) {
      setGameStatus('lost')
    }
  }, [timeLimit, timeRemaining, gameStatus])

  return (
    <div className="w-full min-h-screen flex justify-center items-center">
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
            <LanguageSwitcher />
            {gameMode === 'preset' && presetLevel && (
              <div className="py-2 px-4 rounded-lg text-white font-semibold text-sm bg-gradient-to-br from-[#f093fb] to-[#f5576c]">
                {t('game.level')}: {presetLevel.name}
              </div>
            )}
          </div>
        </div>
        {gameMode === 'random' && (
          <GameConfig
            gridSize={gridSize}
            exitCount={exitCount}
            obstaclePercentage={obstaclePercentage}
            maxAttempts={maxAttempts}
            onlyWallObstacles={onlyWallObstacles}
            onConfigChange={handleConfigChange}
            gameMode={gameMode}
            gameStatus={gameStatus}
          />
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
          gameMode={gameMode}
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
      </div>
    </div>
  )
}

export default Game

