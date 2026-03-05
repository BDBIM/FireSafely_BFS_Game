import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { saveLevel, exportLevel, importLevel } from '../utils/levelStorage'
import { generateMap } from '../components/MapGenerator'
import LanguageSwitcher from '../components/LanguageSwitcher'
import './LevelEditor.css'

function LevelEditor() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const importedLevel = location.state?.importedLevel

  const [gridSize, setGridSize] = useState(importedLevel?.gridSize || 10)
  const [cellType, setCellType] = useState('exit') // 'exit', 'obstacle', 'door-block', 'empty', 'eraser'
  const [isDrawing, setIsDrawing] = useState(false)
  const [obstacleType, setObstacleType] = useState('wall') // 'wall', 'air', 'pathway'
  const [startPoints, setStartPoints] = useState(importedLevel?.startPoints || [])
  const [obstacles, setObstacles] = useState(importedLevel?.obstacles || [])
  const [doorBlocks, setDoorBlocks] = useState(importedLevel?.doorBlocks || [])
  const [levelName, setLevelName] = useState(importedLevel?.name || '')
  const [difficulty, setDifficulty] = useState(() => {
    const d = importedLevel?.difficulty
    return typeof d === 'number' && d >= 1 && d <= 10 ? d : 5
  })
  const [timeLimit, setTimeLimit] = useState(() => {
    const t = importedLevel?.timeLimit
    return t != null && typeof t === 'number' && t >= 0 ? t : 30
  })
  const [timeLimitInput, setTimeLimitInput] = useState(() => {
    const t = importedLevel?.timeLimit
    return t != null && typeof t === 'number' && t >= 0 ? String(t) : '30'
  })
  const [maxAttempts, setMaxAttempts] = useState(() => {
    const m = importedLevel?.maxAttempts
    return typeof m === 'number' && m >= 1 ? m : 5
  })
  const [previewMode, setPreviewMode] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const importFileInputRef = useRef(null)
  const hasInitializedEmptyRef = useRef(false)

  // 判斷指定障礙物清單中的牆壁
  const isWallObstacle = (x, y, obstacleList = obstacles) => {
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return false
    const obstacle = obstacleList.find(obs => obs.x === x && obs.y === y)
    return obstacle?.type === 'wall'
  }

  // 依據相鄰牆壁決定門方向（左右牆 = 垂直門；上下牆 = 水平門）
  const getDoorDirectionClass = (x, y, obstacleList = obstacles) => {
    const hasTopWall = isWallObstacle(x, y - 1, obstacleList)
    const hasBottomWall = isWallObstacle(x, y + 1, obstacleList)
    const hasLeftWall = isWallObstacle(x - 1, y, obstacleList)
    const hasRightWall = isWallObstacle(x + 1, y, obstacleList)

    if (hasLeftWall && hasRightWall) return 'door-vertical'
    if (hasTopWall && hasBottomWall) return 'door-horizontal'
    return 'door-horizontal'
  }

  // 卸載時移除匯入用 file input
  useEffect(() => {
    return () => {
      const input = importFileInputRef.current
      if (input?.parentNode) input.parentNode.removeChild(input)
      importFileInputRef.current = null
    }
  }, [])

  // 僅在初次進入編輯器且無從路由帶入的關卡時清空；之後用「匯入以編輯」載入時不再清空（避免 effect 因 gridSize 變動而清掉剛匯入的資料）
  useEffect(() => {
    if (importedLevel) {
      const d = importedLevel.difficulty
      setDifficulty(typeof d === 'number' && d >= 1 && d <= 10 ? d : 5)
      const t = importedLevel.timeLimit
      if (t != null && typeof t === 'number' && t >= 0) {
        setTimeLimit(t)
        setTimeLimitInput(String(t))
      } else {
        setTimeLimit(30)
        setTimeLimitInput('30')
      }
      const m = importedLevel.maxAttempts
      setMaxAttempts(typeof m === 'number' && m >= 1 ? m : 5)
    } else if (!hasInitializedEmptyRef.current) {
      hasInitializedEmptyRef.current = true
      setStartPoints([])
      setObstacles([])
      setDoorBlocks([])
      setLevelName('')
    }
  }, [importedLevel])

  // 套用工具到指定格子（供點擊與拖曳使用）
  // isDragging: 拖曳時為 true，只做「塗上」或「擦除」，不做切換
  const applyToolToCell = (x, y, isDragging = false) => {
    if (previewMode) return

    const tool = cellType === 'eraser' ? 'empty' : cellType
    const currentObstacleType = obstacleType

    const clearCell = () => {
      setStartPoints(prev => prev.filter(sp => !(sp.x === x && sp.y === y)))
      setObstacles(prev => prev.filter(obs => !(obs.x === x && obs.y === y)))
      setDoorBlocks(prev => prev.filter(db => !(db.x === x && db.y === y)))
    }

    if (tool === 'exit') {
      setStartPoints(prev => {
        const isStart = prev.some(sp => sp.x === x && sp.y === y)
        if (isStart && !isDragging) return prev.filter(sp => !(sp.x === x && sp.y === y))
        if (isStart && isDragging) return prev
        return [...prev.filter(sp => !(sp.x === x && sp.y === y)), { x, y }]
      })
      setObstacles(prev => prev.filter(obs => !(obs.x === x && obs.y === y)))
      setDoorBlocks(prev => prev.filter(db => !(db.x === x && db.y === y)))
    } else if (tool === 'obstacle') {
      setObstacles(prev => {
        const isObstacle = prev.some(obs => obs.x === x && obs.y === y)
        if (isObstacle && !isDragging) return prev.filter(obs => !(obs.x === x && obs.y === y))
        if (isObstacle && isDragging) return prev
        return [...prev.filter(obs => !(obs.x === x && obs.y === y)), { x, y, type: currentObstacleType }]
      })
      setStartPoints(prev => prev.filter(sp => !(sp.x === x && sp.y === y)))
      setDoorBlocks(prev => prev.filter(db => !(db.x === x && db.y === y)))
    } else if (tool === 'door-block') {
      setDoorBlocks(prev => {
        const isDoorBlock = prev.some(db => db.x === x && db.y === y)
        if (isDoorBlock && !isDragging) return prev.filter(db => !(db.x === x && db.y === y))
        if (isDoorBlock && isDragging) return prev
        return [...prev.filter(db => !(db.x === x && db.y === y)), { x, y }]
      })
      setStartPoints(prev => prev.filter(sp => !(sp.x === x && sp.y === y)))
      setObstacles(prev => prev.filter(obs => !(obs.x === x && obs.y === y)))
    } else if (tool === 'empty') {
      clearCell()
    }
  }

  // 拖曳繪製：滑鼠按下開始（單擊或拖曳的第一格）
  const handleCellMouseDown = (x, y) => {
    if (previewMode) return
    setIsDrawing(true)
    applyToolToCell(x, y, false)
  }

  // 拖曳繪製：滑鼠移入格子時（像筆一樣連續塗上）
  const handleCellMouseEnter = (x, y) => {
    if (previewMode || !isDrawing) return
    applyToolToCell(x, y, true)
  }

  // 全域滑鼠放開時結束拖曳
  useEffect(() => {
    const handleMouseUp = () => setIsDrawing(false)
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  // 預覽關卡
  const handlePreview = () => {
    if (startPoints.length === 0) {
      alert(t('editor.addExitFirst'))
      return
    }

    const level = {
      name: levelName || '未命名關卡',
      gridSize,
      difficulty,
      timeLimit,
      maxAttempts,
      startPoints,
      obstacles,
      doorBlocks
    }

    const mapData = generateMap(gridSize, 'preset', level)
    setPreviewData(mapData)
    setPreviewMode(true)
  }

  // 退出預覽
  const handleExitPreview = () => {
    setPreviewMode(false)
    setPreviewData(null)
  }

  // 保存關卡
  const handleSave = () => {
    if (startPoints.length === 0) {
      alert(t('editor.addExitFirst'))
      return
    }

    if (!levelName.trim()) {
      alert(t('editor.enterLevelName'))
      return
    }

    const level = {
      name: levelName.trim(),
      gridSize,
      difficulty,
      timeLimit,
      maxAttempts,
      startPoints: [...startPoints],
      obstacles: [...obstacles],
      doorBlocks: [...doorBlocks]
    }

    if (saveLevel(level)) {
      alert(t('editor.saveSuccess'))
      navigate('/', { state: { showCustomLevels: true } })
    } else {
      alert(t('editor.saveFailed'))
    }
  }

  // 匯入關卡到編輯器編輯（使用單一 input 並每次清空 value，才能連續匯入不同或相同檔案）
  const handleImportToEdit = () => {
    let input = importFileInputRef.current
    if (!input) {
      input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.style.display = 'none'
      document.body.appendChild(input)
      importFileInputRef.current = input
    }
    input.value = ''
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const level = await importLevel(file)
        if (!level.gridSize || !level.startPoints || !level.obstacles) {
          alert(t('home.invalidLevelFile'))
          return
        }
        const size = Math.max(3, Math.min(30, parseInt(level.gridSize, 10) || 10))
        setGridSize(size)
        setStartPoints(Array.isArray(level.startPoints) ? level.startPoints : [])
        setObstacles(Array.isArray(level.obstacles) ? level.obstacles : [])
        setDoorBlocks(Array.isArray(level.doorBlocks) ? level.doorBlocks : [])
        setLevelName(level.name != null ? String(level.name) : '')
        const d = level.difficulty
        setDifficulty(typeof d === 'number' && d >= 1 && d <= 10 ? d : 5)
        const t = level.timeLimit
        if (t != null && typeof t === 'number' && t >= 0) {
          setTimeLimit(t)
          setTimeLimitInput(String(t))
        } else {
          setTimeLimit(30)
          setTimeLimitInput('30')
        }
        const m = level.maxAttempts
        setMaxAttempts(typeof m === 'number' && m >= 1 ? m : 5)
        setPreviewMode(false)
        setPreviewData(null)
      } catch (err) {
        alert(err?.message || t('home.importFailed'))
      } finally {
        input.value = ''
      }
    }
    input.click()
  }

  // 導出關卡
  const handleExport = () => {
    if (startPoints.length === 0) {
      alert(t('editor.addExitFirst'))
      return
    }

    const level = {
      name: levelName || '未命名關卡',
      gridSize,
      difficulty,
      timeLimit,
      maxAttempts,
      startPoints: [...startPoints],
      obstacles: [...obstacles],
      doorBlocks: [...doorBlocks]
    }

    exportLevel(level)
  }

  // 清除所有
  const handleClear = () => {
    if (window.confirm(t('editor.confirmClear'))) {
      setStartPoints([])
      setObstacles([])
      setDoorBlocks([])
    }
  }

  // 獲取格子類型和內容
  const getCellInfo = (x, y) => {
    const isStart = startPoints.some(sp => sp.x === x && sp.y === y)
    const obstacle = obstacles.find(obs => obs.x === x && obs.y === y)
    const doorBlock = doorBlocks.find(db => db.x === x && db.y === y)
    
    if (isStart) return { type: 'exit', content: 'Exit' }
    if (obstacle) return { type: 'obstacle', subtype: obstacle.type, content: '' }
    if (doorBlock) return { type: 'door-block', content: '' }
    return { type: 'empty', content: '' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5 pb-[120px]">
      <div className="max-w-[1400px] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-wrap justify-between items-center gap-4 px-6 py-5 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white">
          <h1 className="m-0 text-2xl font-bold">{t('editor.title')}</h1>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
            type="button"
            onClick={() => navigate('/')}
            className="py-2.5 px-5 rounded-lg bg-white/20 border-2 border-white text-white font-medium cursor-pointer text-base transition-all duration-300 hover:bg-white/30 hover:-translate-y-0.5"
          >
            {t('common.backToHome')}
          </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 p-5">
          <div className="w-full lg:w-[300px] flex flex-col gap-5">
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="m-0 mb-4 text-gray-800 text-lg font-semibold">{t('editor.gridSettings')}</h3>
              <div className="mb-4">
                <label className="block mb-1 text-gray-600 font-medium">{t('editor.gridSize')}:</label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={gridSize}
                  onChange={(e) => setGridSize(Math.max(3, Math.min(30, parseInt(e.target.value) || 10)))}
                  className="w-full py-2 px-3 border-2 border-gray-200 rounded-md text-base focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="m-0 mb-4 text-gray-800 text-lg font-semibold">{t('editor.levelInfo')}</h3>
              <div className="mb-4">
                <label className="block mb-1 text-gray-600 font-medium">{t('editor.levelName')}:</label>
                <input
                  type="text"
                  placeholder={t('editor.levelNamePlaceholder')}
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                  className="w-full py-2 px-3 border-2 border-gray-200 rounded-md text-base focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-gray-600 font-medium">{t('editor.difficulty')}:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={difficulty}
                  onChange={(e) => setDifficulty(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                  className="w-full py-2 px-3 border-2 border-gray-200 rounded-md text-base focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-gray-600 font-medium">{t('editor.timeLimit')}:</label>
                <input
                  type="number"
                  min={1}
                  placeholder={t('editor.timeLimitPlaceholder')}
                  value={timeLimitInput}
                  onChange={(e) => {
                    const raw = e.target.value.trim()
                    setTimeLimitInput(raw)
                    const n = raw === '' ? null : parseInt(raw, 10)
                    setTimeLimit(n != null && !isNaN(n) && n >= 1 ? n : null)
                  }}
                  className="w-full py-2 px-3 border-2 border-gray-200 rounded-md text-base focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
              <div className="mb-0">
                <label className="block mb-1 text-gray-600 font-medium">{t('editor.maxAttempts')}:</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 5)))}
                  className="w-full py-2 px-3 border-2 border-gray-200 rounded-md text-base focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="m-0 mb-4 text-gray-800 text-lg font-semibold">{t('editor.stats')}</h3>
              <div className="flex flex-col gap-2 text-gray-600">
                <div className="py-2 px-3 bg-white rounded-md border border-gray-200">{t('editor.exitCount')}: {startPoints.length}</div>
                <div className="py-2 px-3 bg-white rounded-md border border-gray-200">{t('editor.obstacleCount')}: {obstacles.length}</div>
                <div className="py-2 px-3 bg-white rounded-md border border-gray-200">{t('editor.doorBlockCount')}: {doorBlocks.length}</div>
                <div className="py-2 px-3 bg-white rounded-md border border-gray-200">{t('editor.gridSize')}: {gridSize}x{gridSize}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4 py-4 px-5 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="m-0 text-gray-800 text-base font-semibold whitespace-nowrap">{t('editor.actions')}</h3>
              <div className="flex flex-wrap gap-2.5">
                <button type="button" onClick={handlePreview} className="py-3 px-4 rounded-lg border-none cursor-pointer text-base font-semibold text-white bg-gradient-to-br from-[#84fab0] to-[#8fd3f4] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">👁️ {t('editor.preview')}</button>
                <button type="button" onClick={handleSave} className="py-3 px-4 rounded-lg border-none cursor-pointer text-base font-semibold text-white bg-gradient-to-br from-[#667eea] to-[#764ba2] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">💾 {t('editor.save')}</button>
                <button type="button" onClick={handleExport} className="py-3 px-4 rounded-lg border-none cursor-pointer text-base font-semibold text-white bg-gradient-to-br from-[#f093fb] to-[#f5576c] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">📥 {t('editor.exportJson')}</button>
                <button type="button" onClick={handleImportToEdit} className="py-3 px-4 rounded-lg border-none cursor-pointer text-base font-semibold text-white bg-gradient-to-br from-[#4facfe] to-[#00f2fe] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">📂 {t('editor.importToEdit')}</button>
                <button type="button" onClick={handleClear} className="py-3 px-4 rounded-lg border-none cursor-pointer text-base font-semibold text-white bg-red-400 hover:bg-red-500 hover:-translate-y-0.5 transition-all duration-300">🗑️ {t('editor.clear')}</button>
              </div>
            </div>
            <div className="flex-1 flex justify-center items-start p-5 bg-gray-50 rounded-lg overflow-auto">
            {previewMode && previewData ? (
              <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="m-0 text-gray-800">{t('editor.previewMode')}</h2>
                  <button type="button" onClick={handleExitPreview} className="py-2 px-4 rounded-md bg-red-400 text-white border-none cursor-pointer text-sm font-medium hover:bg-red-500 hover:-translate-y-0.5 transition-all duration-300">
                    {t('editor.exitPreview')}
                  </button>
                </div>
                <div className="mb-4 p-2.5 bg-white rounded-md border border-gray-200">
                  <p className="my-1 text-gray-600">{t('editor.farthestCount')}: {previewData.farthestPoints.length}</p>
                  <p className="my-1 text-gray-600">{t('editor.maxDistance')}: {Math.max(...Object.values(previewData.allCellDistances).filter(d => d !== Infinity))}</p>
                </div>
                <div 
                  className="preview-grid"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    gridTemplateRows: `repeat(${gridSize}, 1fr)`
                  }}
                >
                  {Array.from({ length: gridSize * gridSize }).map((_, index) => {
                    const x = index % gridSize
                    const y = Math.floor(index / gridSize)
                    const isStart = previewData.startPoints.some(sp => sp.x === x && sp.y === y)
                    const isObstacle = previewData.obstacles.some(obs => obs.x === x && obs.y === y)
                    const obstacle = previewData.obstacles.find(obs => obs.x === x && obs.y === y)
                    const isDoorBlock = previewData.doorBlocks && previewData.doorBlocks.some(db => db.x === x && db.y === y)
                    const isFarthest = previewData.farthestPoints.some(fp => fp.x === x && fp.y === y)
                    const distance = previewData.allCellDistances[`${x}-${y}`]

                    let cellClass = 'preview-cell'
                    if (isStart) cellClass += ' start'
                    else if (isObstacle) {
                      cellClass += ` obstacle obstacle-${obstacle.type}`
                    } else if (isDoorBlock) {
                      cellClass += ` door-block ${getDoorDirectionClass(x, y, previewData.obstacles)}`
                    }
                    else if (isFarthest) cellClass += ' farthest'
                    else if (distance !== Infinity) cellClass += ' reachable'

                    return (
                      <div key={`${x}-${y}`} className={cellClass}>
                        {isStart && <img src={`${import.meta.env.BASE_URL}exit_sign.png`} alt="Exit" className="editor-exit-sign" />}
                        {isFarthest && '⭐'}
                        {!isStart && !isObstacle && !isDoorBlock && !isFarthest && distance !== Infinity && distance.toFixed(0)}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div 
                className="editor-grid"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  gridTemplateRows: `repeat(${gridSize}, 1fr)`
                }}
              >
                {Array.from({ length: gridSize * gridSize }).map((_, index) => {
                  const x = index % gridSize
                  const y = Math.floor(index / gridSize)
                  const cellInfo = getCellInfo(x, y)

                  let cellClass = 'editor-cell'
                  if (cellInfo.type === 'exit') cellClass += ' exit'
                  else if (cellInfo.type === 'obstacle') {
                    cellClass += ` obstacle obstacle-${cellInfo.subtype}`
                  } else if (cellInfo.type === 'door-block') {
                    cellClass += ` door-block ${getDoorDirectionClass(x, y)}`
                  }

                  return (
                    <div
                      key={`${x}-${y}`}
                      className={cellClass}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCellMouseDown(x, y)
                      }}
                      onMouseEnter={() => handleCellMouseEnter(x, y)}
                      title={`(${x}, ${y})`}
                    >
                      {cellInfo.type === 'exit' ? (
                        <img src={`${import.meta.env.BASE_URL}exit_sign.png`} alt="Exit" className="editor-exit-sign" />
                      ) : (
                        cellInfo.content
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* 浮動底部工具列 */}
      {!previewMode && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-2xl shadow-xl py-4 px-6 border-2 border-[#667eea]/30">
          <div className="flex flex-wrap items-center gap-5">
            <h3 className="m-0 text-lg text-gray-800 font-semibold">{t('editor.tools')}</h3>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className={`py-2.5 px-4 rounded-lg border-2 text-base font-medium cursor-pointer transition-all duration-300 ${cellType === 'exit' ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-[#764ba2]' : 'bg-white border-gray-200 hover:border-[#667eea] hover:-translate-y-0.5'}`} onClick={() => setCellType('exit')}>🚪 {t('editor.toolExit')}</button>
              <button type="button" className={`py-2.5 px-4 rounded-lg border-2 text-base font-medium cursor-pointer transition-all duration-300 ${cellType === 'obstacle' ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-[#764ba2]' : 'bg-white border-gray-200 hover:border-[#667eea] hover:-translate-y-0.5'}`} onClick={() => setCellType('obstacle')}>🧱 {t('editor.toolObstacle')}</button>
              <button type="button" className={`py-2.5 px-4 rounded-lg border-2 text-base font-medium cursor-pointer transition-all duration-300 ${cellType === 'door-block' ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-[#764ba2]' : 'bg-white border-gray-200 hover:border-[#667eea] hover:-translate-y-0.5'}`} onClick={() => setCellType('door-block')}>🚪 {t('editor.toolDoorBlock')}</button>
              <button type="button" className={`py-2.5 px-4 rounded-lg border-2 text-base font-medium cursor-pointer transition-all duration-300 ${cellType === 'empty' ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-[#764ba2]' : 'bg-white border-gray-200 hover:border-[#667eea] hover:-translate-y-0.5'}`} onClick={() => setCellType('empty')}>🧽 {t('editor.toolEraser')}</button>
            </div>
            {cellType === 'obstacle' && (
              <div className="flex items-center gap-2.5 pl-4 border-l-2 border-gray-200">
                <span className="text-gray-600 font-medium text-sm">{t('editor.obstacleType')}:</span>
                <div className="flex gap-2">
                  <button type="button" className={`py-2 px-3.5 rounded-md text-sm border-2 cursor-pointer transition-all ${obstacleType === 'wall' ? 'bg-[#667eea] text-white border-[#667eea]' : 'bg-white border-gray-200 text-gray-700 hover:border-[#667eea]'}`} onClick={() => setObstacleType('wall')}>{t('editor.obstacleWall')}</button>
                  <button type="button" className={`py-2 px-3.5 rounded-md text-sm border-2 cursor-pointer transition-all ${obstacleType === 'air' ? 'bg-[#667eea] text-white border-[#667eea]' : 'bg-white border-gray-200 text-gray-700 hover:border-[#667eea]'}`} onClick={() => setObstacleType('air')}>{t('editor.obstacleAir')}</button>
                  <button type="button" className={`py-2 px-3.5 rounded-md text-sm border-2 cursor-pointer transition-all ${obstacleType === 'pathway' ? 'bg-[#667eea] text-white border-[#667eea]' : 'bg-white border-gray-200 text-gray-700 hover:border-[#667eea]'}`} onClick={() => setObstacleType('pathway')}>{t('editor.obstaclePathway')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LevelEditor

