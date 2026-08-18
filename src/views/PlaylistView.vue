<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { useFavoritesStore } from '@/stores/favorites'
import { usePlaylistsStore } from '@/stores/playlists'
import { findMoodById, FAVORITES_MOOD } from '@/lib/moods'
import { useLanguageStore } from '@/stores/language'
import TrackList from '@/components/TrackList.vue'

// ===================================================================
// STORE SETUP
// ===================================================================

const route = useRoute()
const auth = useAuthStore()
const player = usePlayerStore()
const favorites = useFavoritesStore()
const playlists = usePlaylistsStore()
const lang = useLanguageStore()

// ===================================================================
// STATE
// ===================================================================

const playlist = ref(null)
const tracks = ref([])
const loading = ref(true)
const errorMessage = ref('')

const isEditing = ref(false)
const editName = ref('')
const editTracks = ref([])
const saving = ref(false)
const saveError = ref('')

// ===================================================================
// EDITING
// ===================================================================

function startEditing() {
  editName.value = playlist.value.name
  editTracks.value = tracks.value.slice()
  saveError.value = ''
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

function removeTrack(track) {
  editTracks.value = editTracks.value.filter(item => item.videoId !== track.videoId)
}

// ===================================================================
// SAVE & LOAD
// ===================================================================

async function saveChanges() {
  const newName = editName.value.trim()

  if (!newName) {
    saveError.value = lang.t('playlist.needName')
    return
  }

  saving.value = true
  saveError.value = ''

  const result = await supabase
    .from('playlists')
    .update({ name: newName, songs: editTracks.value })
    .eq('id', playlist.value.id)

  if (result.error) {
    saveError.value = lang.t('playlist.saveError')
    saving.value = false
    return
  }

  playlist.value = Object.assign({}, playlist.value, { name: newName })
  tracks.value = editTracks.value
  isEditing.value = false
  saving.value = false

  playlists.reset()

  if (playlist.value.mood_id === FAVORITES_MOOD.id) {
    favorites.load(auth.user.id)
  }
}

// ===================================================================
// LIFECYCLE
// ===================================================================

onMounted(async () => {
  const result = await supabase
    .from('playlists')
    .select('id, name, mood_id, songs')
    .eq('id', route.params.id)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (result.error) {
    errorMessage.value = lang.t('playlist.loadError')
  } else if (!result.data) {
    errorMessage.value = lang.t('playlist.notFound')
  } else {
    playlist.value = result.data
    tracks.value = result.data.songs || []
  }

  loading.value = false
})
</script>

<template>
  <div class="page">
    <p v-if="loading" class="empty-message">{{ lang.t('common.loading') }}</p>

    <template v-else-if="errorMessage">
      <p class="error-box">{{ errorMessage }}</p>
      <p class="back">
        <RouterLink to="/collection">← {{ lang.t('playlist.back') }}</RouterLink>
      </p>
    </template>

    <template v-else>
      <header class="header" :style="{ background: findMoodById(playlist.mood_id).background }">
        <span class="emoji">{{ findMoodById(playlist.mood_id).emoji }}</span>

        <div class="header-text">
          <p class="label">{{ isEditing ? lang.t('playlist.editing') : lang.t('playlist.label') }}</p>

          <input v-if="isEditing" v-model="editName" class="name-input" maxlength="60" />
          <h1 v-else>{{ playlist.name }}</h1>

          <p class="count">{{ lang.t('common.tracks', { count: isEditing ? editTracks.length : tracks.length }) }}</p>

          <div class="buttons">
            <template v-if="isEditing">
              <button class="btn" :disabled="saving" @click="saveChanges">
                {{ saving ? lang.t('common.saving') : lang.t('playlist.saveChanges') }}
              </button>
              <button class="btn-outline" :disabled="saving" @click="cancelEditing">{{ lang.t('common.cancel') }}</button>
            </template>

            <template v-else>
              <button class="btn" :disabled="!tracks.length" @click="player.play(tracks, 0)">
                ▶ {{ lang.t('common.playAll') }}
              </button>
              <button class="btn-outline" @click="startEditing">✎ {{ lang.t('playlist.edit') }}</button>
            </template>
          </div>

          <p v-if="saveError" class="error-box save-error">{{ saveError }}</p>
        </div>
      </header>

      <div class="content">
        <template v-if="isEditing">
          <p v-if="!editTracks.length" class="empty-message">
            {{ lang.t('playlist.noneLeft') }}
          </p>
          <TrackList v-else :tracks="editTracks" editing @remove="removeTrack" />
        </template>

        <template v-else>
          <p v-if="!tracks.length" class="empty-message">{{ lang.t('playlist.empty') }}</p>
          <TrackList v-else :tracks="tracks" />
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 48px 32px;
  flex-wrap: wrap;
}

.emoji {
  font-size: 4.5rem;
  width: 150px;
  height: 150px;
  border-radius: 12px;
  background: var(--mood-panel);
  display: flex;
  align-items: center;
  justify-content: center;
}

.label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--on-mood-faint);
}

.header h1 {
  font-size: 2.6rem;
  font-weight: 800;
  margin: 4px 0;
  color: var(--on-mood);
}

/* These buttons sit on the light mood gradient, so they keep dark text
   even in dark mode */
.header .btn-outline {
  color: var(--on-mood);
  border-color: var(--mood-input-border);
}

.header .btn-outline:hover:not(:disabled) {
  background: var(--mood-panel);
  border-color: var(--on-mood-faint);
}

.count {
  color: var(--on-mood-soft);
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.header-text {
  min-width: 0; /* lets a long name shrink instead of stretching the header */
}

.buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.name-input {
  background: var(--mood-panel-strong);
  border: 1px solid var(--mood-input-border);
  border-radius: 10px;
  padding: 8px 14px;
  margin: 4px 0;
  width: 100%;
  max-width: 460px;
  color: var(--on-mood);
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 2rem;
  font-weight: 800;
  outline: none;
}

.name-input:focus {
  border-color: var(--orange);
}

.save-error {
  margin-top: 16px;
  max-width: 460px;
}

.content {
  padding: 24px 32px 48px;
}

.back {
  text-align: center;
  padding: 20px;
}

.back a {
  color: var(--orange);
}

@media (max-width: 700px) {
  .header {
    padding: 32px 20px;
    gap: 20px;
  }
  .emoji {
    width: 110px;
    height: 110px;
    font-size: 3.2rem;
  }
  .header h1 {
    font-size: 1.8rem;
  }
  .content {
    padding: 20px;
  }
}
</style>
