<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFromApi } from '@/lib/api'
import { findMood } from '@/lib/moods'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { usePlaylistsStore } from '@/stores/playlists'
import { useLanguageStore } from '@/stores/language'
import TrackList from '@/components/TrackList.vue'

// ===================================================================
// STORE SETUP
// ===================================================================

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const player = usePlayerStore()
const playlists = usePlaylistsStore()
const lang = useLanguageStore()

// ===================================================================
// MOOD & STATE
// ===================================================================

const mood = findMood(route.params.name)

const tracks = ref([])
const loading = ref(true)
const errorMessage = ref('')

const nextPageToken = ref(null)
const usedQuery = ref('')
const loadingMore = ref(false)

const saving = ref(false)
const saved = ref(false)
const saveError = ref('')

// ===================================================================
// LIFECYCLE
// ===================================================================

onMounted(async () => {
  if (!mood) {
    router.push('/')
    return
  }

  try {
    const data = await getFromApi('/api/playlist/' + mood.name)

    tracks.value = data.tracks
    nextPageToken.value = data.nextPageToken
    usedQuery.value = data.query
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
})

// ===================================================================
// TRACK LOADING
// ===================================================================

async function loadMore() {
  loadingMore.value = true
  saveError.value = ''

  try {
    const data = await getFromApi('/api/playlist/' + mood.name, {
      query: usedQuery.value,
      pageToken: nextPageToken.value
    })

    tracks.value = tracks.value.concat(data.tracks)
    nextPageToken.value = data.nextPageToken
  } catch (error) {
    saveError.value = error.message
  } finally {
    loadingMore.value = false
  }
}

// ===================================================================
// SAVE PLAYLIST
// ===================================================================

async function saveToCollection() {
  if (!auth.user) {
    router.push('/login')
    return
  }

  saving.value = true
  saveError.value = ''

  const playlistName = lang.t('mood.playlistName', {
    mood: lang.t('moodName.' + mood.id)
  })

  const result = await supabase.from('playlists').insert({
    user_id: auth.user.id,
    mood_id: mood.id,
    name: playlistName,
    songs: tracks.value
  })

  if (result.error) {
    saveError.value = lang.t('mood.saveError')
  } else {
    saved.value = true
    playlists.reset()
  }

  saving.value = false
}
</script>

<template>
  <div v-if="mood" class="page">
    <header class="header" :style="{ background: mood.background }">
      <span class="emoji">{{ mood.emoji }}</span>

      <div>
        <p class="label">{{ lang.t('mood.label') }}</p>
        <h1>{{ lang.t('moodName.' + mood.id) }}</h1>
        <p class="count">{{ loading ? lang.t('common.loading') : lang.t('common.tracks', { count: tracks.length }) }}</p>

        <div class="buttons">
          <button class="btn" :disabled="loading || !tracks.length" @click="player.play(tracks, 0)">
            ▶ {{ lang.t('common.playAll') }}
          </button>
          <button
            class="btn-outline"
            :disabled="loading || saving || saved || !tracks.length"
            @click="saveToCollection"
          >
            {{ saved ? '✓ ' + lang.t('mood.saved') : saving ? lang.t('common.saving') : '♥ ' + lang.t('mood.saveToCollection') }}
          </button>
        </div>
      </div>
    </header>

    <div class="content">
      <p v-if="saveError" class="error-box">{{ saveError }}</p>

      <p v-if="loading" class="empty-message">{{ lang.t('mood.loadingTracks') }}</p>
      <p v-else-if="errorMessage" class="error-box">{{ errorMessage }}</p>
      <p v-else-if="!tracks.length" class="empty-message">{{ lang.t('mood.noTracks') }}</p>

      <template v-else>
        <TrackList :tracks="tracks" />

        <div v-if="nextPageToken" class="more">
          <button class="btn-outline" :disabled="loadingMore" @click="loadMore">
            {{ loadingMore ? lang.t('common.loading') : lang.t('mood.loadMore') }}
          </button>
        </div>
      </template>
    </div>
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
  font-size: 5rem;
  width: 160px;
  height: 160px;
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
  font-size: 3rem;
  font-weight: 800;
  margin: 4px 0;
  color: var(--on-mood);
}

.count {
  color: var(--on-mood-soft);
  font-size: 0.9rem;
}

/* This button sits on the light mood gradient, so it keeps dark text
   even in dark mode */
.header .btn-outline {
  color: var(--on-mood);
  border-color: var(--mood-input-border);
}

.header .btn-outline:hover:not(:disabled) {
  background: var(--mood-panel);
  border-color: var(--on-mood-faint);
}

.buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.content {
  padding: 24px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.more {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

@media (max-width: 700px) {
  .header {
    padding: 32px 20px;
    gap: 20px;
  }
  .emoji {
    width: 110px;
    height: 110px;
    font-size: 3.4rem;
  }
  .header h1 {
    font-size: 2rem;
  }
  .content {
    padding: 20px;
  }
}
</style>
