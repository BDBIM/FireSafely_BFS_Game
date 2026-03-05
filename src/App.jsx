import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import GamePreset from './pages/GamePreset'
import GameRandom from './pages/GameRandom'
import GameClassic from './pages/GameClassic'
import LevelEditor from './pages/LevelEditor'
import PresetLevels from './pages/PresetLevels'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/presetLevels" element={<PresetLevels />} />
      <Route path="/game" element={<Navigate to="/game/random" replace />} />
      <Route path="/game/random" element={<GameRandom />} />
      <Route path="/game/preset" element={<GamePreset />} />
      <Route path="/game/classic" element={<GameClassic />} />
      <Route path="/editor" element={<LevelEditor />} />
    </Routes>
  )
}

export default App

