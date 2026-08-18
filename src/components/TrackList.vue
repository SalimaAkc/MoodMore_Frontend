<script setup>
// Shows a list of tracks, used by the mood, search and playlist pages

import { ref, nextTick } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { usePlaylistsStore } from '@/stores/playlists'
import { useLanguageStore } from '@/stores/language'

// The tracks come from the page that uses this component
const props = defineProps({
  tracks: {
    type: Array,
    required: true
  },
  // In editing mode the rows do not play and get a remove button
  editing: {
    type: Boolean,
    default: false
  }
})

// We tell the page instead of removing here, so it can still be cancelled
const emit = defineEmits(['remove'])

const player = usePlayerStore()
const auth = useAuthStore()
const favorites = useFavoritesStore()
const playlists = usePlaylistsStore()
const lang = useLanguageStore()

// How wide the menu is and roughly how tall, used to keep it on screen
const MENU_WIDTH = 250
const MENU_HEIGHT = 300

// Null when the menu is closed, otherwise the track and where to draw it
const menu = ref(null)
const newName = ref('')
const makingNew = ref(false)
const busy = ref(false)
const notice = ref('')
const nameInput = ref(null)


async function startNewPlaylist() {
  makingNew.value = true

  await nextTick()

  if (nameInput.value) {
    nameInput.value.focus()
  }
}

// Start the list at the track that was clicked
function playFrom(position) {
  player.play(props.tracks, position)
}

// Check if this track is the one playing, used to colour the row
function isPlaying(track) {
  if (!track.videoId) return false
  if (!player.currentTrack) return false

  return player.currentTrack.videoId === track.videoId
}

// Add or remove this track from the favourites
function toggleFavorite(track) {
  favorites.toggle(track, auth.user.id)
}

function closeMenu() {
  menu.value = null
  makingNew.value = false
  newName.value = ''
}


function openMenu(event, track) {
  if (!auth.user) return

  const button = event.currentTarget.getBoundingClientRect()

  
  const left = Math.max(8, button.right - MENU_WIDTH)

  // Below the button normally, above it when there is no room left
  let top = button.bottom + 6

  if (top + MENU_HEIGHT > window.innerHeight) {
    top = Math.max(8, button.top - MENU_HEIGHT - 6)
  }

  notice.value = ''
  makingNew.value = false
  newName.value = ''
  menu.value = { track: track, top: top, left: left }

  // Only the first time, after that the store already has the list
  if (!playlists.loaded) {
    playlists.load(auth.user.id)
  }
}

// Say what happened, using the name of the playlist it went to
function reportResult(result, name) {
  if (result === 'added') {
    notice.value = lang.t('track.added', { name: name })
  } else if (result === 'duplicate') {
    notice.value = lang.t('track.duplicate', { name: name })
  } else {
    notice.value = lang.t('track.addError')
  }
}

// Put the track in a playlist that already exists
async function addTo(playlist) {
  busy.value = true

  const result = await playlists.addTrack(playlist.id, menu.value.track)

  busy.value = false
  reportResult(result, playlist.name)
  closeMenu()
}

// Make a new playlist holding just this track
async function createAndAdd() {
  const name = newName.value.trim()

  if (!name) return

  busy.value = true

  const result = await playlists.createWithTrack(name, menu.value.track, auth.user.id)

  busy.value = false
  reportResult(result, name)
  closeMenu()
}
</script>

<template>
  <div class="list">
    <div
      v-for="(track, position) in tracks"
      :key="track.videoId"
      class="row"
      :class="{ active: isPlaying(track) && !editing, editing }"
      @click="editing || playFrom(position)"
    >
      <span class="number">{{ position + 1 }}</span>

      <img :src="track.thumbnail" :alt="track.title" class="thumb" loading="lazy" />

      <div class="info">
        <span class="title">{{ track.title }}</span>
        <span class="artist">{{ track.artist }}</span>
      </div>

      <span class="duration">{{ track.duration }}</span>

      <div class="actions">
        <!-- Editing mode shows a remove button instead of the heart -->
        <button
          v-if="editing"
          class="icon remove"
          :title="lang.t('track.remove')"
          :aria-label="lang.t('track.remove')"
          @click.stop="emit('remove', track)"
        >
          ✕
        </button>

        
        <template v-else-if="auth.user">
          <button
            class="icon heart"
            :class="{ on: favorites.isFavorite(track.videoId) }"
            :title="favorites.isFavorite(track.videoId) ? lang.t('track.removeFavourite') : lang.t('track.addFavourite')"
            :aria-label="favorites.isFavorite(track.videoId) ? lang.t('track.removeFavourite') : lang.t('track.addFavourite')"
            :aria-pressed="favorites.isFavorite(track.videoId)"
            @click.stop="toggleFavorite(track)"
          >
            {{ favorites.isFavorite(track.videoId) ? '♥' : '♡' }}
          </button>

          <button
            class="icon add"
            :title="lang.t('track.addTo')"
            :aria-label="lang.t('track.addTo')"
            aria-haspopup="menu"
            @click.stop="openMenu($event, track)"
          >
            +
          </button>
        </template>
      </div>
    </div>
  </div>

  <p v-if="notice" class="notice">{{ notice }}</p>
  <p v-if="favorites.errorMessage" class="error-box">{{ favorites.errorMessage }}</p>

  
  <div v-if="menu" class="backdrop" @click="closeMenu"></div>

  <div
    v-if="menu"
    class="menu"
    role="menu"
    :style="{ top: menu.top + 'px', left: menu.left + 'px', width: MENU_WIDTH + 'px' }"
    @keydown.escape="closeMenu"
  >
    <p class="menu-title">{{ lang.t('track.addTo') }}</p>

    <p v-if="playlists.loading" class="menu-empty">{{ lang.t('common.loading') }}</p>

    <template v-else>
      <div class="menu-list">
        <button
          v-for="playlist in playlists.list"
          :key="playlist.id"
          class="menu-item"
          role="menuitem"
          :disabled="busy"
          @click="addTo(playlist)"
        >
          {{ playlist.name }}
        </button>

        <p v-if="!playlists.list.length" class="menu-empty">
          {{ lang.t('track.noPlaylists') }}
        </p>
      </div>


      <form v-if="makingNew" class="menu-new" @submit.prevent="createAndAdd">
        <input
          ref="nameInput"
          v-model="newName"
          type="text"
          maxlength="60"
          :placeholder="lang.t('track.playlistName')"
        />
        <button class="btn" type="submit" :disabled="busy || !newName.trim()">
          {{ busy ? lang.t('common.saving') : lang.t('track.create') }}
        </button>
      </form>

      <button v-else class="menu-item new" role="menuitem" @click="startNewPlaylist">
        + {{ lang.t('track.newPlaylist') }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
}

/* Columns: number, thumbnail, title, duration, buttons */
.row {
  display: grid;
  grid-template-columns: 32px 48px 1fr auto auto;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.row:hover {
  background: var(--card-2);
}

/* The track that is playing gets an orange tint */
.row.active {
  background: var(--tint-orange);
}

.row.active .title {
  color: var(--orange);
}

.number {
  color: var(--ink-soft);
  font-size: 0.9rem;
  text-align: center;
}

.thumb {
  width: 48px;
  height: 36px;
  object-fit: cover;
  border-radius: 4px;
  background: var(--card-2);
}

.info {
  display: flex;
  flex-direction: column;
  min-width: 0; 
}

/* Cut off long text with ... instead of wrapping */
.title,
.artist {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title {
  font-size: 0.92rem;
  font-weight: 500;
}

.artist {
  font-size: 0.82rem;
  color: var(--ink-soft);
}

.duration {
  color: var(--ink-soft);
  font-size: 0.85rem;
}


.actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon {
  background: none;
  border: none;
  color: var(--ink-soft);
  font-size: 1.15rem;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 50%;
}

.heart:hover,
.add:hover {
  color: var(--orange);
  background: var(--tint-orange);
}

/* Already a favourite */
.heart.on {
  color: var(--orange);
}

.add {
  font-size: 1.25rem;
}

/* While editing, rows are not clickable to play */
.row.editing {
  cursor: default;
}

.remove:hover {
  color: var(--red);
  background: var(--tint-red);
}

.notice {
  color: var(--green);
  font-size: 0.88rem;
  font-weight: 600;
  padding: 12px 12px 0;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
}

.menu {
  position: fixed;
  z-index: 301;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
  box-shadow: var(--lift);
  padding: 8px;
}

.menu-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
  padding: 6px 8px 8px;
}


.menu-list {
  max-height: 190px;
  overflow-y: auto;
}

.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-radius: var(--radius);
  padding: 9px 10px;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-item:hover:not(:disabled) {
  background: var(--card-2);
}

.menu-item.new {
  border-top: 1px solid var(--rule);
  border-radius: 0;
  margin-top: 4px;
  padding-top: 12px;
  color: var(--orange);
  font-weight: 600;
}

.menu-empty {
  color: var(--ink-soft);
  font-size: 0.85rem;
  padding: 6px 10px 10px;
}

.menu-new {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--rule);
  margin-top: 4px;
  padding: 10px 4px 4px;
}

.menu-new input {
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 9px 10px;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.menu-new input:focus {
  border-color: var(--orange);
}

@media (max-width: 600px) {
  .row {
    grid-template-columns: 24px 44px 1fr auto;
    gap: 10px;
  }
  .duration {
    display: none;
  }
}
</style>
