import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import GameBoard from '../components/GameBoard'
import GameInfo from '../components/GameInfo'
import GameConfig from '../components/GameConfig'
import { generateMap, calculateDistanceToNearestStartForPoint, checkIsObstacle } from '../components/MapGenerator'
import '../App.css'

function Game() {
  const location = useLocation()
  const navigate = useNavigate()
  const gameMode = location.state?.mode || 'random' // 'random' or 'preset'
  const presetLevel = location.state?.level || null

  const [gridSize, setGridSize] = useState(presetLevel?.gridSize || 10)
  const [doorCount, setDoorCount] = useState(null) // null 表示自動
  const [obstaclePercentage, setObstaclePercentage] = useState(15)
  const [maxAttempts, setMaxAttempts] = useState(5)
  const [startPoints, setStartPoints] = useState([])
  const [farthestPoints, setFarthestPoints] = useState([])
  const [guessedPoints, setGuessedPoints] = useState([])
  const [gameStatus, setGameStatus] = useState('waiting')
  const [attempts, setAttempts] = useState(0)
  const [score, setScore] = useState(0)
  const [allCellDistances, setAllCellDistances] = useState({})
  const [obstacles, setObstacles] = useState([])

  // 初始化遊戲
  const initializeGame = () => {
    const mapData = generateMap(
      gridSize, 
      gameMode, 
      presetLevel, 
      doorCount, 
      obstaclePercentage
    )
    
    if (mapData.gridSize !== gridSize) {
      setGridSize(mapData.gridSize)
    }
    
    setStartPoints(mapData.startPoints)
    setFarthestPoints(mapData.farthestPoints)
    setObstacles(mapData.obstacles)
    setAllCellDistances(mapData.allCellDistances)
    setGuessedPoints([])
    setGameStatus('waiting')
    setAttempts(0)
    setScore(0)
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
    if (guessedPoints.some(p => p.x === x && p.y === y)) return
    
    const newAttempts = attempts + 1
    const clickedDistance = calculateDistanceToNearestStartForPoint(
      { x, y }, 
      startPoints, 
      obstacles, 
      gridSize
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
    
    if (config.gridSize !== undefined) {
      const validatedSize = Math.max(3, Math.min(30, Math.floor(config.gridSize)))
      if (validatedSize !== gridSize) {
        setGridSize(validatedSize)
        shouldReinitialize = true
      }
    }
    
    if (config.doorCount !== undefined && config.doorCount !== doorCount) {
      setDoorCount(config.doorCount)
      shouldReinitialize = true
    }
    
    if (config.obstaclePercentage !== undefined && config.obstaclePercentage !== obstaclePercentage) {
      setObstaclePercentage(config.obstaclePercentage)
      shouldReinitialize = true
    }
    
    if (config.maxAttempts !== undefined && config.maxAttempts !== maxAttempts) {
      setMaxAttempts(config.maxAttempts)
      // 不需要重新初始化遊戲，只更新嘗試次數限制
    }
    
    if (shouldReinitialize) {
      initializeGame()
    }
  }

  // 返回首頁
  const handleBackToHome = () => {
    navigate('/')
  }

  useEffect(() => {
    initializeGame()
  }, [gameMode, presetLevel])

  return (
    <div className="app">
      <div className="app-container">
        <div className="game-header">
          <button className="back-button" onClick={handleBackToHome}>
            ← 返回首頁
          </button>
          <h1 className="app-title">最遠點猜測遊戲</h1>
          {gameMode === 'preset' && presetLevel && (
            <div className="level-info">關卡: {presetLevel.name}</div>
          )}
        </div>
        <GameConfig
          gridSize={gridSize}
          doorCount={doorCount}
          obstaclePercentage={obstaclePercentage}
          maxAttempts={maxAttempts}
          onConfigChange={handleConfigChange}
          gameMode={gameMode}
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
          gameMode={gameMode}
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
        />
      </div>
    </div>
  )
}

export default Game

