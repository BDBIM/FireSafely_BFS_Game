import React from 'react'
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
  // 檢查是否為障礙物
  const isObstacle = (x, y) => {
    return obstacles && obstacles.some(obs => obs.x === x && obs.y === y)
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

  // 檢查點是否在網格範圍內
  const isValidPosition = (x, y) => {
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize
  }

  // 檢查是否為牆壁（只檢查 wall 類型的障礙物）
  const isWall = (x, y) => {
    if (!isValidPosition(x, y)) return false
    const obstacle = obstacles && obstacles.find(obs => obs.x === x && obs.y === y)
    return obstacle?.type === 'wall'
  }

  // 獲取門的開啟方向（根據周圍牆壁位置）
  const getDoorDirection = (x, y) => {
    // 檢查四個方向的牆壁
    const hasWallTop = isWall(x, y - 1)
    const hasWallBottom = isWall(x, y + 1)
    const hasWallLeft = isWall(x - 1, y)
    const hasWallRight = isWall(x + 1, y)

    // 在建築平面圖中，門應該沿著牆的方向開啟
    // 如果上下有牆（垂直牆），門應該垂直開（上下開）
    if (hasWallTop || hasWallBottom) {
      // 如果上邊有牆，門向下開（門板在上，圓弧向下）
      // 如果下邊有牆，門向上開（門板在下，圓弧向上）
      if (hasWallTop && !hasWallBottom) return 'down'
      if (hasWallBottom && !hasWallTop) return 'up'
      // 如果上下都有牆或都沒有牆，默認向下開
      return 'down'
    }
    
    // 如果左右有牆（水平牆），門應該水平開（左右開），但門板垂直放置
    // 實際上在這種情況下，門也是水平開的，只是門板位置不同
    if (hasWallLeft || hasWallRight) {
      // 如果左邊有牆，門向右開（門板在左，圓弧向右）
      // 如果右邊有牆，門向左開（門板在右，圓弧向左）
      if (hasWallLeft && !hasWallRight) return 'right'
      if (hasWallRight && !hasWallLeft) return 'left'
      // 默認向右開
      return 'right'
    }

    // 如果沒有明顯的牆壁方向，默認向右開
    return 'right'
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
    if (isDoorBlock(x, y)) {
      const direction = getDoorDirection(x, y)
      return classes + ` door-block door-${direction}`
    }
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
    if (isDoorBlock(x, y)) return '' // 門的內容由 CSS 繪製
    if (isStartPoint(x, y)) return 'Exit'
    
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
      const typeNames = {
        'wall': '障礙物（牆壁）',
        'air': '障礙物（空氣塊）',
        'pathway': '障礙物（通道塊）'
      }
      return typeNames[obstacleType] || '障礙物'
    }
    if (isDoorBlock(x, y)) return '門方塊（可通過，但不可選中）'
    if (isStartPoint(x, y)) return 'Exit'
    
    if (guessedPoint) {
      return guessedPoint.distance === Infinity 
        ? '無法到達' 
        : `距離: ${guessedPoint.distance.toFixed(2)}`
    }
    
    if ((gameStatus === 'won' || gameStatus === 'lost') && distance !== undefined) {
      return distance === Infinity 
        ? '無法到達（障礙物阻擋）' 
        : `距離: ${distance.toFixed(2)}`
    }
    
    return '點擊猜測'
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

