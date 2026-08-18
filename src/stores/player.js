
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'moodandmore-player'
export const REPEAT_MODES = ['off', 'all', 'one']

// load shuffle and repeat settings from browser storage
function loadSaved() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY)
    return JSON.parse(rawData) || {}
  } catch (error) {
    return {}
  }
}

// make array of numbers 0 to length-1
function countUpTo(length) {
  const numbers = []

  for (let i = 0; i < length; i++) {
    numbers.push(i)
  }

  return numbers
}

// shuffle array (Fisher-Yates: swap each element with random earlier one)
function shuffled(numbers) {
  const copy = numbers.slice()

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const held = copy[i]

    copy[i] = copy[j]
    copy[j] = held
  }

  return copy
}

export const usePlayerStore = defineStore('player', () => {
  const saved = loadSaved()

  const queue = ref([]) // all the tracks
  const order = ref([]) // which positions to play (changes with shuffle)
  const position = ref(-1) // where we are in the order (-1 = stopped)

  const isPlaying = ref(false)
  const shuffle = ref(saved.shuffle === true)

  // accept saved repeat mode if it's valid
  const repeat = ref(REPEAT_MODES.includes(saved.repeat) ? saved.repeat : 'off')

  // save shuffle and repeat settings
  function saveChoices() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        shuffle: shuffle.value,
        repeat: repeat.value
      }))
    } catch (error) {
      // private mode blocks storage but we still work
    }
  }

  // get current track or null
  const currentTrack = computed(() => {
    const spot = order.value[position.value]

    if (spot === undefined) return null

    return queue.value[spot] || null
  })

  // is there a next track (or wrap around with repeat all)
  const hasNext = computed(() => {
    if (!queue.value.length) return false
    if (repeat.value === 'all') return true

    return position.value < order.value.length - 1
  })

  // is there a previous track
  const hasPrevious = computed(() => {
    if (!queue.value.length) return false
    if (repeat.value === 'all') return true

    return position.value > 0
  })

  // start playing tracks
  function play(tracks, startAt = 0) {
    queue.value = tracks

    if (shuffle.value) {
      // play clicked track first, then shuffle the rest
      const rest = countUpTo(tracks.length).filter(spot => spot !== startAt)

      order.value = [startAt].concat(shuffled(rest))
      position.value = 0
    } else {
      order.value = countUpTo(tracks.length)
      position.value = startAt
    }

    isPlaying.value = true
  }

  // skip to next track
  function next() {
    if (!queue.value.length) return

    if (position.value < order.value.length - 1) {
      position.value = position.value + 1
      return
    }

    if (repeat.value === 'all') {
      // reshuffle for round 2
      if (shuffle.value) {
        order.value = shuffled(countUpTo(queue.value.length))
      }

      position.value = 0
    }
  }

  // go back to previous track
  function previous() {
    if (!queue.value.length) return

    if (position.value > 0) {
      position.value = position.value - 1
      return
    }

    if (repeat.value === 'all') {
      position.value = order.value.length - 1
    }
  }

  // toggle shuffle on/off (keep current song playing)
  function toggleShuffle() {
    const playingSpot = order.value[position.value]

    shuffle.value = !shuffle.value
    saveChoices()

    if (!queue.value.length) return

    const all = countUpTo(queue.value.length)

    if (playingSpot === undefined) {
      order.value = shuffle.value ? shuffled(all) : all
      return
    }

    if (shuffle.value) {
      // keep current, shuffle the rest
      const rest = all.filter(spot => spot !== playingSpot)

      order.value = [playingSpot].concat(shuffled(rest))
      position.value = 0
    } else {
      // switch to normal order
      order.value = all
      position.value = playingSpot
    }
  }

  // cycle through repeat modes
  function cycleRepeat() {
    const spot = REPEAT_MODES.indexOf(repeat.value)

    repeat.value = REPEAT_MODES[(spot + 1) % REPEAT_MODES.length]
    saveChoices()
  }

  // stop playing
  function stop() {
    queue.value = []
    order.value = []
    position.value = -1
    isPlaying.value = false
  }

  return {
    queue,
    order,
    position,
    isPlaying,
    shuffle,
    repeat,
    currentTrack,
    hasPrevious,
    hasNext,
    play,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
    stop
  }
})
