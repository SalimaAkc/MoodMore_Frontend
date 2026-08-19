
import { MOODS } from './moods'

export const DEFAULT_DAYS = 30

const DAY_IN_MS = 24 * 60 * 60 * 1000


export function recentPlaylists(playlists, days = DEFAULT_DAYS, now = new Date()) {
  if (!Array.isArray(playlists)) return []

  const end = now.getTime()
  const start = end - days * DAY_IN_MS

  return playlists.filter(playlist => {
    const moment = new Date(playlist.created_at).getTime()

    if (!Number.isFinite(moment)) return false

    // Dates in the future are almost always a broken clock, not a real save
    return moment >= start && moment <= end
  })
}


export function moodBreakdown(playlists, days = DEFAULT_DAYS, now = new Date()) {
  const recent = recentPlaylists(playlists, days, now)

  const counts = new Map()

  for (const playlist of recent) {
    
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

      share: Math.round((count / total) * 100)
    })
  }

  // Biggest first. Moods with the same count keep the order of MOODS, so
  // the chart does not reshuffle itself between two equal moods.
  rows.sort((left, right) => right.count - left.count)

  return rows
}

// How many playlists the breakdown is built on
export function totalSaved(breakdown) {
  return breakdown.reduce((sum, row) => sum + row.count, 0)
}

// The mood somebody saved most, or nothing when the month is empty
export function topMood(breakdown) {
  if (!breakdown.length) return null

  return breakdown[0].mood
}
