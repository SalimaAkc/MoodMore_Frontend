// The player store, which is where shuffle and repeat actually live.
// The rule these tests are guarding is that shuffle changes the order we
// play in and never the list the page is showing.

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../src/stores/player.js'

// Four tracks is enough to tell a jumbled order from a straight one
function makeTracks() {
  return [
    { videoId: 'a', title: 'A' },
    { videoId: 'b', title: 'B' },
    { videoId: 'c', title: 'C' },
    { videoId: 'd', title: 'D' }
  ]
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('playing a list', () => {
  it('starts on the track that was clicked', () => {
    const player = usePlayerStore()

    player.play(makeTracks(), 2)

    expect(player.currentTrack.videoId).toBe('c')
    expect(player.isPlaying).toBe(true)
  })

  it('walks forwards and backwards through the list', () => {
    const player = usePlayerStore()

    player.play(makeTracks(), 0)
    player.next()

    expect(player.currentTrack.videoId).toBe('b')

    player.previous()

    expect(player.currentTrack.videoId).toBe('a')
  })

  it('stops at the ends when repeat is off', () => {
    const player = usePlayerStore()

    player.play(makeTracks(), 0)

    expect(player.hasPrevious).toBe(false)

    player.previous()
    expect(player.currentTrack.videoId).toBe('a')

    player.play(makeTracks(), 3)

    expect(player.hasNext).toBe(false)

    player.next()
    expect(player.currentTrack.videoId).toBe('d')
  })

  it('forgets everything when the player is closed', () => {
    const player = usePlayerStore()

    player.play(makeTracks(), 1)
    player.stop()

    expect(player.currentTrack).toBe(null)
    expect(player.isPlaying).toBe(false)
    expect(player.hasNext).toBe(false)
  })
})

describe('repeat', () => {
  it('steps through off, all, one and back to off', () => {
    const player = usePlayerStore()

    expect(player.repeat).toBe('off')

    player.cycleRepeat()
    expect(player.repeat).toBe('all')

    player.cycleRepeat()
    expect(player.repeat).toBe('one')

    player.cycleRepeat()
    expect(player.repeat).toBe('off')
  })

  it('comes back around to the start with repeat all', () => {
    const player = usePlayerStore()

    player.play(makeTracks(), 3)
    player.cycleRepeat() // all

    expect(player.hasNext).toBe(true)

    player.next()
    expect(player.currentTrack.videoId).toBe('a')
  })

  it('goes from the start to the end with repeat all', () => {
    const player = usePlayerStore()

    player.play(makeTracks(), 0)
    player.cycleRepeat() // all

    player.previous()
    expect(player.currentTrack.videoId).toBe('d')
  })
})

describe('shuffle', () => {
  it('keeps the list the page shows in its own order', () => {
    const player = usePlayerStore()
    const tracks = makeTracks()

    player.play(tracks, 0)
    player.toggleShuffle()

    expect(player.queue.map(track => track.videoId)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('keeps playing the same track when it is switched on', () => {
    const player = usePlayerStore()

    player.play(makeTracks(), 2)
    player.toggleShuffle()

    expect(player.currentTrack.videoId).toBe('c')
  })

  it('still plays every track exactly once', () => {
    const player = usePlayerStore()

    player.play(makeTracks(), 0)
    player.toggleShuffle()

    const played = [player.currentTrack.videoId]

    while (player.hasNext) {
      player.next()
      played.push(player.currentTrack.videoId)
    }

    expect(played.slice().sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('goes back to the real order, standing on the same track', () => {
    const player = usePlayerStore()

    player.play(makeTracks(), 0)
    player.toggleShuffle()
    player.next()

    const nowPlaying = player.currentTrack.videoId

    player.toggleShuffle() // back off

    expect(player.currentTrack.videoId).toBe(nowPlaying)
    expect(player.order).toEqual([0, 1, 2, 3])
  })

  it('does not fall over when there is nothing playing', () => {
    const player = usePlayerStore()

    player.toggleShuffle()

    expect(player.shuffle).toBe(true)
    expect(player.currentTrack).toBe(null)
  })
})
