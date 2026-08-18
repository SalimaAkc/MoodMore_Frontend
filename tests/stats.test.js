// The month overview on the profile page.
// The rules these tests are guarding: only playlists from inside the window
// count, Favourites and Custom are never treated as feelings, and the
// biggest mood comes first.

import { describe, it, expect } from 'vitest'
import { recentPlaylists, moodBreakdown, totalSaved, topMood } from '../src/lib/stats.js'

// A fixed "now" so the tests do not change meaning as time passes
const NOW = new Date('2026-08-18T12:00:00Z')

// Days before NOW, as the database would write it
function daysAgo(days) {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

// mood ids: 1 Happy, 2 Energetic, 3 Calm, 7 Favourites, 8 Custom
function saved(moodId, days) {
  return { mood_id: moodId, created_at: daysAgo(days) }
}

describe('picking the recent playlists', () => {
  it('keeps the ones inside the window', () => {
    const rows = recentPlaylists([saved(1, 1), saved(2, 29)], 30, NOW)

    expect(rows).toHaveLength(2)
  })

  it('drops the ones that are older than the window', () => {
    const rows = recentPlaylists([saved(1, 31), saved(2, 400)], 30, NOW)

    expect(rows).toHaveLength(0)
  })

  it('drops a date it cannot read instead of counting it as today', () => {
    const rows = recentPlaylists([{ mood_id: 1, created_at: 'not a date' }], 30, NOW)

    expect(rows).toHaveLength(0)
  })

  it('drops dates in the future, which mean a broken clock', () => {
    const ahead = new Date(NOW.getTime() + 24 * 60 * 60 * 1000).toISOString()
    const rows = recentPlaylists([{ mood_id: 1, created_at: ahead }], 30, NOW)

    expect(rows).toHaveLength(0)
  })

  it('coloring outside the list gives an empty answer, not a crash', () => {
    expect(recentPlaylists(null, 30, NOW)).toEqual([])
  })
})

describe('the mood breakdown', () => {
  it('counts one row per mood', () => {
    const rows = moodBreakdown([saved(1, 2), saved(1, 3), saved(3, 4)], 30, NOW)

    expect(rows).toHaveLength(2)
    expect(rows[0].mood.name).toBe('Happy')
    expect(rows[0].count).toBe(2)
  })

  it('puts the biggest mood first', () => {
    const rows = moodBreakdown([saved(3, 1), saved(1, 1), saved(1, 2)], 30, NOW)

    expect(rows[0].mood.name).toBe('Happy')
  })

  it('leaves Favourites and Custom out, they are not feelings', () => {
    const rows = moodBreakdown([saved(7, 1), saved(8, 1), saved(1, 1)], 30, NOW)

    expect(rows).toHaveLength(1)
    expect(rows[0].mood.name).toBe('Happy')
  })

  it('works out a share of the month', () => {
    const rows = moodBreakdown([saved(1, 1), saved(1, 2), saved(3, 3), saved(3, 4)], 30, NOW)

    expect(rows[0].share).toBe(50)
    expect(rows[1].share).toBe(50)
  })

  it('ignores playlists from before the window when working out the share', () => {
    const rows = moodBreakdown([saved(1, 1), saved(3, 90)], 30, NOW)

    expect(rows).toHaveLength(1)
    expect(rows[0].share).toBe(100)
  })

  it('gives an empty list for a month with nothing saved', () => {
    expect(moodBreakdown([], 30, NOW)).toEqual([])
  })
})

describe('reading the breakdown', () => {
  it('adds the counts up', () => {
    const rows = moodBreakdown([saved(1, 1), saved(1, 2), saved(3, 3)], 30, NOW)

    expect(totalSaved(rows)).toBe(3)
  })

  it('names the mood that won the month', () => {
    const rows = moodBreakdown([saved(3, 1), saved(3, 2), saved(1, 3)], 30, NOW)

    expect(topMood(rows).name).toBe('Calm')
  })

  it('names nothing when there is nothing to name', () => {
    expect(topMood([])).toBe(null)
  })
})
