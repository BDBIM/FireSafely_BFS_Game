import React from 'react'
import './GameInfo.css'

const GameInfo = ({
  gameStatus,
  attempts,
  maxAttempts,
  score,
  startPoints,
  farthestPoints,
  onReset,
  gridSize,
  gameMode = 'random'
}) => {
  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'waiting':
        return '準備開始遊戲...'
      case 'playing':
        return `猜測中... (${attempts}/${maxAttempts})`
      case 'won':
        return `🎉 恭喜！你找到了最遠點！得分：${score}`
      case 'lost':
        const pointsText = farthestPoints && farthestPoints.length > 0
          ? farthestPoints.length === 1
            ? `(${farthestPoints[0].x}, ${farthestPoints[0].y})`
            : `有 ${farthestPoints.length} 個最遠點`
          : ''
        return `😢 遊戲結束！最遠點${pointsText}`
      default:
        return ''
    }
  }

  return (
    <div className="game-info">
      <div className="info-section">
        <div className="status-message">{getStatusMessage()}</div>
        <div className="info-stats">
          <div className="stat-item">
            <span className="stat-label">嘗試次數：</span>
            <span className="stat-value">{attempts}/{maxAttempts}</span>
          </div>
          {score > 0 && (
            <div className="stat-item">
              <span className="stat-label">得分：</span>
              <span className="stat-value">{score}</span>
            </div>
          )}
          <button 
            className="reset-button"
            onClick={onReset}
          >
            {gameStatus === 'playing' ? '重新開始' : '新遊戲'}
          </button>
        </div>
      </div>
      
      {startPoints && startPoints.length > 0 && (
        <div className="hint-section">
          <p className="hint-text">
            💡 提示：有 {startPoints.length} 個 Exit {startPoints.map((sp, idx) => `(${sp.x}, ${sp.y})`).join('、')}，請找出距離最近 Exit 最遠的格子！注意：黑色格子是障礙物（牆壁），需要繞過它們。
          </p>
        </div>
      )}
    </div>
  )
}

export default GameInfo

