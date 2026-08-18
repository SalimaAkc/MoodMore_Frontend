<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, nextTick } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { usePlaylistsStore } from '@/stores/playlists'
import { useLanguageStore } from '@/stores/language'

// ===================================================================
// PROPS & EMITS
// ===================================================================

const props = defineProps({
  tracks: {
    type: Array,
    required: true
  },
  editing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['remove'])

// ===================================================================
// STORE SETUP
// ===================================================================

const player = usePlayerStore()
const auth = useAuthStore()
const favorites = useFavoritesStore()
const playlists = usePlaylistsStore()
const lang = useLanguageStore()

// ===================================================================
// STATE & CONFIGURATION
// ===================================================================

const MENU_WIDTH = 250
const MENU_HEIGHT = 300

const menu = ref(null)
const newName = ref('')
const newIsPublic = ref(false)
const makingNew = ref(false)
const busy = ref(false)
const notice = ref('')
const nameInput = ref(null)

// ===================================================================
// PLAYLIST MENU
// ===================================================================

async function startNewPlaylist() {
  makingNew.value = true
  newIsPublic.value = false

  await nextTick()

  if (nameInput.value) {
    nameInput.value.focus()
  }
}

function closeMenu() {
  menu.value = null
  makingNew.value = false
  newName.value = ''
  newIsPublic.value = false
}

function openMenu(event, track) {
  if (!auth.user) return

  const button = event.currentTarget.getBoundingClientRect()

  const left = Math.max(8, button.right - MENU_WIDTH)

  let top = button.bottom + 6

  if (top + MENU_HEIGHT > window.innerHeight) {
    top = Math.max(8, button.top - MENU_HEIGHT - 6)
  }

  notice.value = ''
  makingNew.value = false
  newName.value = ''
  menu.value = { track: track, top: top, left: left }

  if (!playlists.loaded) {
    playlists.load(auth.user.id)
  }
}

// ===================================================================
// PLAYLIST OPERATIONS
// ===================================================================

function reportResult(result, name) {
  if (result === 'added') {
    notice.value = lang.t('track.added', { name: name })
  } else if (result === 'duplicate') {
    notice.value = lang.t('track.duplicate', { name: name })
  } else {
    notice.value = lang.t('track.addError')
  }
}

async function addTo(playlist) {
  busy.value = true

  const result = await playlists.addTrack(playlist.id, menu.value.track)

  busy.value = false
  reportResult(result, playlist.name)
  closeMenu()
}

async function createAndAdd() {
  const name = newName.value.trim()

  if (!name) return

  busy.value = true

  const result = await playlists.createWithTrack(name, menu.value.track, auth.user.id, newIsPublic.value)

  busy.value = false
  reportResult(result, name)
  closeMenu()
}

// ===================================================================
// TRACK INTERACTIONS
// ===================================================================

function playFrom(position) {
  player.play(props.tracks, position)
}

function isPlaying(track) {
  if (!track.videoId) return false
  if (!player.currentTrack) return false

  return player.currentTrack.videoId === track.videoId
}

function toggleFavorite(track) {
  favorites.toggle(track, auth.user.id)
}
</script>

<template>
  <!-- =================================================================
       TRACK LIST - List of track rows
       ================================================================= -->
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

  <!-- =================================================================
       MESSAGES - Notice and error messages
       ================================================================= -->
  <p v-if="notice" class="notice">{{ notice }}</p>
  <p v-if="favorites.errorMessage" class="error-box">{{ favorites.errorMessage }}</p>

  <!-- =================================================================
       PLAYLIST MENU - Add to playlist dropdown
       ================================================================= -->
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

        <!-- Visibility toggle -->
        <div class="visibility-toggle">
          <label>
            <input v-model="newIsPublic" type="checkbox" />
            <span>{{ newIsPublic ? lang.t('profile.public') : lang.t('profile.private') }}</span>
          </label>
        </div>

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
/* ===================================================================
   LIST - Track list container
   =================================================================== */

.list {
  display: flex;
  flex-direction: column;
}

/* ===================================================================
   ROW - Track row styling
   =================================================================== */

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

.row.active {
  background: var(--tint-orange);
}

.row.active .title {
  color: var(--orange);
}

.row.editing {
  cursor: default;
}

/* ===================================================================
   TRACK INFO - Number, thumbnail, title, artist, duration
   =================================================================== */

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

/* ===================================================================
   ACTIONS - Heart and add buttons
   =================================================================== */

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

.heart.on {
  color: var(--orange);
}

.add {
  font-size: 1.25rem;
}

.remove:hover {
  color: var(--red);
  background: var(--tint-red);
}

/* ===================================================================
   MESSAGES - Notice and feedback
   =================================================================== */

.notice {
  color: var(--green);
  font-size: 0.88rem;
  font-weight: 600;
  padding: 12px 12px 0;
}

/* ===================================================================
   MENU - Playlist dropdown
   =================================================================== */

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

.visibility-toggle {
  padding: 0 4px;
}

.visibility-toggle label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--ink-soft);
}

.visibility-toggle input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: var(--orange);
}

.visibility-toggle span {
  flex: 1;
}

/* ===================================================================
   MOBILE RESPONSIVE
   =================================================================== */

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
