// ===================================================================
// STATISTICS - Mood breakdown and analytics
// ===================================================================

import { MOODS } from './moods'

// ===================================================================
// CONFIGURATION
// ===================================================================

export const DEFAULT_DAYS = 30

const DAY_IN_MS = 24 * 60 * 60 * 1000

// ===================================================================
// PUBLIC API - Statistics functions
// ===================================================================

// get playlists from recent days
export function recentPlaylists(playlists, days = DEFAULT_DAYS, now = new Date()) {
  if (!Array.isArray(playlists)) return []

  const end = now.getTime()
  const start = end - days * DAY_IN_MS

  return playlists.filter(playlist => {
    const moment = new Date(playlist.created_at).getTime()

    if (!Number.isFinite(moment)) return false

    // skip dates in the future (probably bad data)
    return moment >= start && moment <= end
  })
}

// show how many playlists per mood
export function moodBreakdown(playlists, days = DEFAULT_DAYS, now = new Date()) {
  const recent = recentPlaylists(playlists, days, now)

  const counts = new Map()

  for (const playlist of recent) {
    // only count real moods, not Favorites or Custom
    const mood = MOODS.find(item => item.id === playlist.mood_id)

    if (!mood) continue

    counts.set(mood.id, (counts.get(mood.id) || 0) + 1)
  }

  let total = 0
  for (const count of counts.values()) total += count

  const rows = []

  for (const mood of MOODS) {
    const count = counts.get(mood.id)

    if (!count) continue

    rows.push({
      mood: mood,
      count: count,
      // rounded percentage (may not add to exactly 100)
      share: Math.round((count / total) * 100)
    })
  }

  // most popular first
  rows.sort((left, right) => right.count - left.count)

  return rows
}

// count total playlists in the breakdown
export function totalSaved(breakdown) {
  return breakdown.reduce((sum, row) => sum + row.count, 0)
}

// get the mood with the most playlists
export function topMood(breakdown) {
  if (!breakdown.length) return null

  return breakdown[0].mood
}
