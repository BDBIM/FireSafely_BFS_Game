import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Game from './pages/Game'
import LevelEditor from './pages/LevelEditor'
import PresetLevels from './pages/PresetLevels'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/presetLevels" element={<PresetLevels />} />
      <Route path="/game" element={<Game />} />
      <Route path="/editor" element={<LevelEditor />} />
    </Routes>
  )
}

export default App

