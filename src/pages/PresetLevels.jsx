import React from 'react'
import { useNavigate } from 'react-router-dom'
import { presetLevels } from '../data/loadPresetLevels'
import './PresetLevels.css'

function PresetLevels() {
  const navigate = useNavigate()

  const handleSelectLevel = (level) => {
    navigate('/game', { state: { mode: 'preset', level } })
  }

  return (
    <div className="preset-levels-page">
      <div className="preset-levels-container">
        <div className="preset-levels-header">
          <button className="btn-back" onClick={() => navigate('/')}>
            返回首頁
          </button>
          <h1 className="preset-levels-title">預設關卡</h1>
          <p className="preset-levels-description">
            選擇精心設計的關卡，挑戰不同難度的謎題！
          </p>
        </div>
        <div className="preset-levels">
          {presetLevels.map((level, index) => (
            <button
              key={index}
              className="level-button"
              onClick={() => handleSelectLevel(level)}
            >
              <span className="level-name">{level.name}</span>
              <span className="level-details">
                {level.gridSize}x{level.gridSize} · {level.difficulty}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PresetLevels
