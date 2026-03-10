const STORAGE_KEY = 'classic_leaderboard_v1'
const MAX_ENTRIES = 20

/**
 * @typedef {{ name: string, score: number, date: string }} LeaderboardEntry
 * @returns {LeaderboardEntry[]}
 */
export function getLeaderboard() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const list = saved ? JSON.parse(saved) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/**
 * Add entry and keep top MAX_ENTRIES by score (desc). Returns updated list.
 * @param {string} name
 * @param {number} score
 * @returns {LeaderboardEntry[]}
 */
export function addEntry(name, score) {
  const list = getLeaderboard()
  const trimmedName = String(name || '').trim().slice(0, 30) || '—'
  const entry = { name: trimmedName, score, date: new Date().toISOString() }
  const merged = [...list, entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // ignore
  }
  return merged
}

/**
 * True if this score would make top 20 (board has < 20 entries or score is higher than 20th).
 * @param {number} score
 * @returns {boolean}
 */
export function isTop20(score) {
  const list = getLeaderboard()
  if (list.length < MAX_ENTRIES) return true
  return score > (list[list.length - 1]?.score ?? -1)
}
