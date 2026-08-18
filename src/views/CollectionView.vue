<script setup>
// Shows all the playlists the user saved

import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { usePlaylistsStore } from '@/stores/playlists'
import { findMoodById, FAVORITES_MOOD } from '@/lib/moods'
import { useLanguageStore } from '@/stores/language'

const auth = useAuthStore()
const favorites = useFavoritesStore()
const playlists = usePlaylistsStore()
const lang = useLanguageStore()

// The rows on this page. Named apart from the playlists store above, which
// only holds the short list the + button on a track uses.
const savedPlaylists = ref([])
const loading = ref(true)
const deletingId = ref(null)

// loadError replaces the list, deleteError shows above it
const loadError = ref('')
const deleteError = ref('')

// Turn the database date into something readable
function formatDate(text) {
  const date = new Date(text)

  // The chosen language decides how the date is written
  return date.toLocaleDateString(lang.current, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(async () => {
  // The songs are inside the playlist row, so one request gets everything
  const result = await supabase
    .from('playlists')
    .select('id, name, mood_id, created_at, songs')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })

  if (result.error) {
    loadError.value = lang.t('collection.loadError')
  } else {
    savedPlaylists.value = result.data
  }

  loading.value = false
})

// How many tracks a playlist has
function songCount(playlist) {
  if (!playlist.songs) return 0
  return playlist.songs.length
}

// Delete a playlist, asking first because it cannot be undone
async function remove(playlist) {
  const question = lang.t('collection.confirmDelete', { name: playlist.name })
  if (!window.confirm(question)) return

  deletingId.value = playlist.id
  deleteError.value = ''

  // The songs live inside this row, so they are deleted with it
  const result = await supabase.from('playlists').delete().eq('id', playlist.id)

  if (result.error) {
    deleteError.value = lang.t('collection.deleteError')
  } else {
    savedPlaylists.value = savedPlaylists.value.filter(item => item.id !== playlist.id)

    // That row is gone, so the favourites store must forget it
    if (playlist.mood_id === FAVORITES_MOOD.id) {
      favorites.reset()
    }

    // The menu behind the + on a track still lists it, so make it load again
    playlists.reset()
  }

  deletingId.value = null
}
</script>

<template>
  <div class="page">
    <h1>{{ lang.t('collection.title') }}</h1>

    <p v-if="deleteError" class="error-box">{{ deleteError }}</p>

    <p v-if="loading" class="empty-message">{{ lang.t('common.loading') }}</p>

    <p v-else-if="loadError" class="error-box">{{ loadError }}</p>

    <div v-else-if="!savedPlaylists.length" class="empty-message">
      <p>{{ lang.t('collection.empty') }}</p>
      <RouterLink to="/" class="btn">{{ lang.t('collection.pickMood') }}</RouterLink>
    </div>

    <div v-else class="grid">
      <div
        v-for="playlist in savedPlaylists"
        :key="playlist.id"
        class="card"
        :style="{ background: findMoodById(playlist.mood_id).background }"
      >
        <RouterLink :to="`/playlist/${playlist.id}`" class="card-link">
          <span class="emoji">{{ findMoodById(playlist.mood_id).emoji }}</span>
          <span class="name">{{ playlist.name }}</span>
          <span class="meta">{{ lang.t('common.tracks', { count: songCount(playlist) }) }} · {{ formatDate(playlist.created_at) }}</span>
        </RouterLink>

        <button
          class="delete"
          :title="lang.t('collection.deletePlaylist')"
          :disabled="deletingId === playlist.id"
          @click="remove(playlist)"
        >
          {{ deletingId === playlist.id ? '…' : '🗑' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 24px;
}

h1 {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.card {
  position: relative;
  border-radius: 16px;
  border: 1px solid var(--mood-border);
}

.card-link {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 28px 22px;
  text-decoration: none;
  color: var(--on-mood);
}

.emoji {
  font-size: 2.4rem;
}

.name {
  font-family: 'Instrument Serif', Georgia, serif;
  font-weight: 700;
  font-size: 1.1rem;
}

.meta {
  color: var(--on-mood-soft);
  font-size: 0.82rem;
}

.delete {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--mood-panel-strong);
  border: 1px solid var(--mood-border);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 0.9rem;
}

.delete:hover:not(:disabled) {
  background: var(--danger-tint);
  border-color: var(--red);
}

.empty-message .btn {
  display: inline-block;
  margin-top: 16px;
  text-decoration: none;
}
</style>
