// 從 data/presetLevels 資料夾載入所有 .json 關卡
// 使用 Vite import.meta.glob 在建置時打包所有 JSON
const modules = import.meta.glob('./presetLevels/*.json', { eager: true })

export const presetLevels = Object.keys(modules)
  .sort()
  .map((path) => {
    const level = modules[path].default
    if (!level || !level.name || level.gridSize == null || !Array.isArray(level.startPoints) || !Array.isArray(level.obstacles)) {
      console.warn('Invalid level format:', path, level)
      return null
    }
    return {
      ...level,
      doorBlocks: level.doorBlocks || []
    }
  })
  .filter(Boolean)
