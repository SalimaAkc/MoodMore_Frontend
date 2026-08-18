<script setup>
// The player bar at the bottom, plays a hidden YouTube video

import { ref, watch, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useSettingsStore } from '@/stores/settings'
import { useLanguageStore } from '@/stores/language'

const player = usePlayerStore()
const settings = useSettingsStore()
const lang = useLanguageStore()

// Not refs, Vue does not need to watch these
let youtubePlayer = null
let isReady = false
let timer = null

const currentTime = ref('0:00')
const progress = ref(0) // between 0 and 1, used for the bar width

// How far the arrow keys jump on the progress bar
const SEEK_STEP = 5

// Turn a number of seconds into a time like 4:13
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const formattedSeconds = seconds < 10 ? '0' + seconds : seconds
  return `${minutes}:${formattedSeconds}`
}

// Ask the player every half second how far it is
function startTimer() {
  stopTimer()

  timer = setInterval(() => {
    if (!isReady) return

    const now = youtubePlayer.getCurrentTime()
    const total = youtubePlayer.getDuration()

    if (total > 0) {
      currentTime.value = formatTime(now)
      progress.value = now / total
    }
  }, 500)
}

// Stop asking
function stopTimer() {
  if (timer) {
    clearInterval(timer)
  }

  timer = null
}

// Runs when the player finished loading
function onPlayerReady() {
  isReady = true

  // A track can already be chosen before the player was ready
  if (player.currentTrack) {
    youtubePlayer.loadVideoById(player.currentTrack.videoId)
    startTimer()
  }
}


function replayCurrent() {
  youtubePlayer.seekTo(0, true)
  youtubePlayer.playVideo()
}


function onTrackEnded() {
  const onlyOne = player.queue.length === 1

  if (player.repeat === 'one' || (player.repeat === 'all' && onlyOne)) {
    replayCurrent()
    return
  }

  if (player.repeat === 'all') {
    player.next()
    return
  }

  if (settings.autoplay && player.hasNext) {
    player.next()
    return
  }

  player.isPlaying = false
}

// Runs when the video starts, pauses or ends
function onPlayerStateChange(event) {
  const state = window.YT.PlayerState

  if (event.data === state.ENDED) {
    onTrackEnded()
  } else if (event.data === state.PLAYING) {
    player.isPlaying = true
  } else if (event.data === state.PAUSED) {
    player.isPlaying = false
  }
}

// Create the YouTube player inside our hidden div
function createPlayer() {
  youtubePlayer = new window.YT.Player('youtube-player', {
    playerVars: {
      autoplay: 1,
      controls: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  })
}

onMounted(() => {
  // Use the YouTube script if it is already loaded
  if (window.YT && window.YT.Player) {
    createPlayer()
    return
  }

  // Otherwise load it, YouTube calls this function when it is ready
  window.onYouTubeIframeAPIReady = createPlayer

  const script = document.createElement('script')
  script.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(script)
})

onUnmounted(() => {
  stopTimer()

  if (youtubePlayer) {
    youtubePlayer.destroy()
  }
})

// Runs every time a different track is chosen
watch(() => player.currentTrack, (track) => {
  if (!isReady) return

  // The user closed the player, so stop the video too
  if (!track) {
    youtubePlayer.stopVideo()
    stopTimer()
    currentTime.value = '0:00'
    progress.value = 0
    return
  }

  youtubePlayer.loadVideoById(track.videoId)
  startTimer()
})

// Play or pause with the middle button
function togglePlay() {
  if (!isReady) return

  if (player.isPlaying) {
    youtubePlayer.pauseVideo()
  } else {
    youtubePlayer.playVideo()
  }
}

// Jump to the spot the user clicked on the progress bar
function seek(event) {
  if (!isReady) return

  const bar = event.currentTarget.getBoundingClientRect()
  const clickedFraction = (event.clientX - bar.left) / bar.width
  const newTime = clickedFraction * youtubePlayer.getDuration()

  youtubePlayer.seekTo(newTime, true)
}

// The same bar with the arrow keys, for people who do not use a mouse
function seekBy(seconds) {
  if (!isReady) return

  const total = youtubePlayer.getDuration()
  if (!total) return

  const wanted = youtubePlayer.getCurrentTime() + seconds

  // Math.min and Math.max keep it inside the track
  youtubePlayer.seekTo(Math.max(0, Math.min(total, wanted)), true)
}

// What the screen reader reads out for the repeat button
function repeatLabel() {
  if (player.repeat === 'one') return lang.t('player.repeatOne')
  if (player.repeat === 'all') return lang.t('player.repeatAll')

  return lang.t('player.repeatOff')
}
</script>

<template>

  <div class="video-hider">
    <div id="youtube-player"></div>
  </div>

  <div v-if="player.currentTrack" class="player">

    <div
      class="progress"
      role="slider"
      tabindex="0"
      :aria-label="lang.t('player.seek')"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(progress * 100)"
      :aria-valuetext="currentTime"
      @click="seek"
      @keydown.left.prevent="seekBy(-SEEK_STEP)"
      @keydown.right.prevent="seekBy(SEEK_STEP)"
    >
      <div class="progress-filled" :style="{ width: progress * 100 + '%' }"></div>
    </div>

    <div class="controls">
      <img :src="player.currentTrack.thumbnail" alt="" class="thumb" />

      <div class="info">
        <span class="title">{{ player.currentTrack.title }}</span>
        <span class="artist">{{ player.currentTrack.artist }}</span>
      </div>

      <div class="buttons">
        <button
          class="mode"
          :class="{ on: player.shuffle }"
          :title="player.shuffle ? lang.t('player.shuffleOn') : lang.t('player.shuffleOff')"
          :aria-label="player.shuffle ? lang.t('player.shuffleOn') : lang.t('player.shuffleOff')"
          :aria-pressed="player.shuffle"
          @click="player.toggleShuffle()"
        >
          🔀
        </button>

        <button
          :disabled="!player.hasPrevious"
          :title="lang.t('player.previous')"
          :aria-label="lang.t('player.previous')"
          @click="player.previous()"
        >
          ⏮
        </button>

        <button
          class="play"
          :title="player.isPlaying ? lang.t('player.pause') : lang.t('player.play')"
          :aria-label="player.isPlaying ? lang.t('player.pause') : lang.t('player.play')"
          @click="togglePlay"
        >
          {{ player.isPlaying ? '⏸' : '▶' }}
        </button>

        <button
          :disabled="!player.hasNext"
          :title="lang.t('player.next')"
          :aria-label="lang.t('player.next')"
          @click="player.next()"
        >
          ⏭
        </button>

        
        <button
          class="mode"
          :class="{ on: player.repeat !== 'off' }"
          :title="repeatLabel()"
          :aria-label="repeatLabel()"
          @click="player.cycleRepeat()"
        >
          🔁<span v-if="player.repeat === 'one'" class="badge">1</span>
        </button>
      </div>

      <span class="time">{{ currentTime }} / {{ player.currentTrack.duration }}</span>

      <button
        class="close"
        :title="lang.t('player.close')"
        :aria-label="lang.t('player.close')"
        @click="player.stop()"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<style scoped>
.video-hider {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 1px;
  height: 1px;
  overflow: hidden; 
  opacity: 0;
  pointer-events: none;
}

.player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--paper);
  border-top: 1px solid var(--rule);
  z-index: 200;
}

.progress {
  height: 4px;
  background: var(--rule);
  cursor: pointer;
}

.progress:focus-visible {
  outline: 2px solid var(--orange);
  outline-offset: 2px;
}

.progress-filled {
  height: 100%;
  background: var(--orange);
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
}

.thumb {
  width: 48px;
  height: 36px;
  object-fit: cover;
  border-radius: 4px;
}

.info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.title,
.artist {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title {
  font-size: 0.9rem;
  font-weight: 600;
}

.artist {
  font-size: 0.8rem;
  color: var(--ink-soft);
}

.buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.buttons button {
  background: none;
  border: none;
  color: var(--ink);
  font-size: 1.1rem;
  padding: 6px 10px;
  border-radius: 50%;
}

.buttons button:hover:not(:disabled) {
  background: var(--card-2);
}

.buttons .play {
  background: var(--orange);
  color: var(--on-accent);
  font-size: 1rem;
}


.mode {
  position: relative;
  font-size: 0.95rem;
  opacity: 0.4;
}

.mode.on {
  opacity: 1;
}

.badge {
  position: absolute;
  right: 2px;
  bottom: 2px;
  background: var(--orange);
  color: var(--on-accent);
  border-radius: 50%;
  width: 13px;
  height: 13px;
  font-size: 0.6rem;
  font-weight: 700;
  line-height: 13px;
  text-align: center;
}

.time {
  color: var(--ink-soft);
  font-size: 0.8rem;
  white-space: nowrap;
}

.close {
  background: none;
  border: none;
  color: var(--ink-soft);
  font-size: 1rem;
}

.close:hover {
  color: var(--ink);
}

@media (max-width: 700px) {
  .controls {
    padding: 10px 12px;
    gap: 10px;
  }
  .time {
    display: none;
  }
  
  .thumb {
    display: none;
  }
  .buttons {
    gap: 0;
  }
  .buttons button {
    padding: 6px;
  }
}
</style>
