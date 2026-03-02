import React from 'react'
import { useTranslation } from 'react-i18next'
import './GameBoard.css'

const GameBoard = ({
  gridSize,
  startPoints,
  farthestPoints,
  guessedPoints,
  gameStatus,
  onCellClick,
  allCellDistances,
  obstacles,
  doorBlocks
}) => {
  const { t } = useTranslation()
  // 檢查是否為障礙物
  const isObstacle = (x, y) => {
    return obstacles && obstacles.some(obs => obs.x === x && obs.y === y)
  }

  // 檢查是否為牆壁障礙物
  const isWallObstacle = (x, y) => {
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return false
    if (!isObstacle(x, y)) return false
    return getObstacleType(x, y) === 'wall'
  }

  // 獲取障礙物類型
  const getObstacleType = (x, y) => {
    const obstacle = obstacles && obstacles.find(obs => obs.x === x && obs.y === y)
    return obstacle?.type || 'wall' // 默認為 wall 類型（向後兼容）
  }

  // 檢查是否為 door block
  const isDoorBlock = (x, y) => {
    return doorBlocks && doorBlocks.some(db => db.x === x && db.y === y)
  }

  // 依據相鄰牆壁決定門方向
  const getDoorDirectionClass = (x, y) => {
    const hasTopWall = isWallObstacle(x, y - 1)
    const hasBottomWall = isWallObstacle(x, y + 1)
    const hasLeftWall = isWallObstacle(x - 1, y)
    const hasRightWall = isWallObstacle(x + 1, y)

    if (hasLeftWall && hasRightWall) return 'door-vertical'
    if (hasTopWall && hasBottomWall) return 'door-horizontal'

    // 無明確配對時維持既有顯示（水平）
    return 'door-horizontal'
  }

  // 檢查是否為起點
  const isStartPoint = (x, y) => {
    return startPoints && startPoints.some(sp => sp.x === x && sp.y === y)
  }

  // 檢查是否為最遠點
  const isFarthestPoint = (x, y) => {
    return farthestPoints && farthestPoints.some(fp => fp.x === x && fp.y === y)
  }

  // 計算最大距離用於顏色正規化
  const getMaxDistance = () => {
    const validDistances = Object.values(allCellDistances)
      .filter(dist => dist !== Infinity && dist !== undefined)
    return validDistances.length > 0 ? Math.max(...validDistances) : 0
  }

  // 根據距離獲取單一色系漸變顏色（從淺藍到深藍）
  const getColorByDistance = (distance, maxDistance) => {
    if (distance === Infinity || distance === undefined || maxDistance === 0) {
      return null
    }
    
    // 正規化距離到 0-1 範圍
    const normalized = distance / maxDistance
    
    // 使用單一藍色系漸變
    // 色相固定為藍色 (210°)，只改變亮度和飽和度
    // 從淺藍（高亮度，高飽和度）到深藍（低亮度，高飽和度）
    
    const hue = 210 // 固定藍色色相
    const saturation = 85 + normalized * 15 // 飽和度從 85% 到 100%
    const lightness = 85 - normalized * 50 // 亮度從 85% 到 35%（從淺到深）
    
    return `hsl(${hue}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`
  }

  // 根據背景顏色確定文字顏色（HSL 格式）
  const getTextColor = (hslColor) => {
    if (!hslColor || !hslColor.startsWith('hsl')) return '#333'
    const match = hslColor.match(/\d+/g)
    if (match && match.length >= 3) {
      const lightness = parseInt(match[2])
      return lightness < 50 ? '#fff' : '#333'
    }
    return '#333'
  }

  const getCellClass = (x, y, guessedPoint) => {
    let classes = 'cell'
    
    if (isObstacle(x, y)) {
      const obstacleType = getObstacleType(x, y)
      return classes + ` obstacle obstacle-${obstacleType}`
    }
    if (isDoorBlock(x, y)) return classes + ` door-block ${getDoorDirectionClass(x, y)}`
    if (isStartPoint(x, y)) return classes + ' start-point'
    if (gameStatus !== 'playing' && gameStatus !== 'waiting' && isFarthestPoint(x, y)) return classes + ' farthest-point'
    
    if (guessedPoint) {
      classes += ' guessed'
      return guessedPoint.isCorrect ? classes + ' correct' : classes + ' incorrect'
    }
    
    const distance = allCellDistances[`${x}-${y}`]
    if ((gameStatus === 'won' || gameStatus === 'lost') && distance !== undefined && distance !== Infinity) {
      classes += ' show-distance'
    }
    
    return classes
  }

  const getCellContent = (x, y, guessedPoint, distance) => {
    if (isObstacle(x, y)) return ''
    if (isDoorBlock(x, y)) return ''
    if (isStartPoint(x, y)) return (
      <img src={`${import.meta.env.BASE_URL}exit_sign.png`} alt="Exit" className="cell-exit-sign" />
    )
    
    if (guessedPoint && gameStatus === 'playing') {
      return guessedPoint.distance === Infinity ? '∞' : guessedPoint.distance.toFixed(1)
    }
    
    if ((gameStatus === 'won' || gameStatus === 'lost') && distance !== undefined && distance !== Infinity) {
      return distance.toFixed(1)
    }
    
    return ''
  }

  const getCellTitle = (x, y, distance, guessedPoint) => {
    if (isObstacle(x, y)) {
      const obstacleType = getObstacleType(x, y)
      const typeKeys = { wall: 'board.obstacleWall', air: 'board.obstacleAir', pathway: 'board.obstaclePathway' }
      return t(typeKeys[obstacleType] || 'board.obstacle')
    }
    if (isDoorBlock(x, y)) return t('board.doorBlock')
    if (isStartPoint(x, y)) return 'Exit'
    if (guessedPoint) {
      return guessedPoint.distance === Infinity ? t('board.unreachable') : `${t('board.distance')}: ${guessedPoint.distance.toFixed(2)}`
    }
    if ((gameStatus === 'won' || gameStatus === 'lost') && distance !== undefined) {
      return distance === Infinity ? t('board.unreachableObstacle') : `${t('board.distance')}: ${distance.toFixed(2)}`
    }
    return t('board.clickToGuess')
  }

  return (
    <div className="game-board-container">
      <div 
        className="game-board"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const x = index % gridSize
          const y = Math.floor(index / gridSize)
          const distance = allCellDistances[`${x}-${y}`]
          const guessedPoint = guessedPoints.find(p => p.x === x && p.y === y)
          
          // 計算漸變顏色（僅在遊戲結束時且不是特殊格子）
          const isGameEnded = gameStatus === 'won' || gameStatus === 'lost'
          const shouldApplyDistanceColor = 
            isGameEnded &&
            !isObstacle(x, y) && 
            !isDoorBlock(x, y) &&
            !isStartPoint(x, y) && 
            !isFarthestPoint(x, y) &&
            !guessedPoint &&
            distance !== Infinity &&
            distance !== undefined
          
          const maxDistance = shouldApplyDistanceColor ? getMaxDistance() : 0
          const backgroundColor = shouldApplyDistanceColor 
            ? getColorByDistance(distance, maxDistance) 
            : null
          const textColor = backgroundColor ? getTextColor(backgroundColor) : null
          
          const isClickable = !isDoorBlock(x, y) && !isObstacle(x, y) && !isStartPoint(x, y)
          
          return (
            <div
              key={`${x}-${y}`}
              className={getCellClass(x, y, guessedPoint)}
              style={backgroundColor ? { backgroundColor, color: textColor } : {}}
              onClick={isClickable ? () => onCellClick(x, y) : undefined}
              title={getCellTitle(x, y, distance, guessedPoint)}
            >
              {getCellContent(x, y, guessedPoint, distance)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GameBoard

