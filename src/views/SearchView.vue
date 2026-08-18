<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getFromApi } from '@/lib/api'
import { usePlayerStore } from '@/stores/player'
import { useLanguageStore } from '@/stores/language'
import TrackList from '@/components/TrackList.vue'

// ===================================================================
// STORE SETUP
// ===================================================================

const route = useRoute()
const player = usePlayerStore()
const lang = useLanguageStore()

// ===================================================================
// STATE
// ===================================================================

const tracks = ref([])
const loading = ref(false)
const errorMessage = ref('')
const searchWords = ref('')

const nextPageToken = ref(null)
const loadingMore = ref(false)
const moreError = ref('')

// ===================================================================
// SEARCH
// ===================================================================

async function search(words) {
  searchWords.value = words
  nextPageToken.value = null
  moreError.value = ''

  if (!words) {
    tracks.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const data = await getFromApi('/api/search', { q: words })

    tracks.value = data.tracks
    nextPageToken.value = data.nextPageToken
  } catch (error) {
    errorMessage.value = error.message
    tracks.value = []
  } finally {
    loading.value = false
  }
}

// ===================================================================
// PAGINATION
// ===================================================================

async function loadMore() {
  loadingMore.value = true
  moreError.value = ''

  try {
    const data = await getFromApi('/api/search', {
      q: searchWords.value,
      pageToken: nextPageToken.value
    })

    tracks.value = tracks.value.concat(data.tracks)
    nextPageToken.value = data.nextPageToken
  } catch (error) {
    moreError.value = error.message
  } finally {
    loadingMore.value = false
  }
}

// ===================================================================
// WATCHERS
// ===================================================================

watch(() => route.query.q, (newWords) => {
  search(newWords || '')
}, { immediate: true })
</script>

<template>
  <div class="page">
    <header>
      <h1 v-if="searchWords">{{ lang.t('search.resultsFor', { query: searchWords }) }}</h1>
      <h1 v-else>{{ lang.t('search.title') }}</h1>

      <button v-if="tracks.length" class="btn" @click="player.play(tracks, 0)">▶ {{ lang.t('common.playAll') }}</button>
    </header>

    <p v-if="moreError" class="error-box">{{ moreError }}</p>

    <p v-if="loading" class="empty-message">{{ lang.t('search.searching') }}</p>
    <p v-else-if="errorMessage" class="error-box">{{ errorMessage }}</p>
    <p v-else-if="!searchWords" class="empty-message">{{ lang.t('search.typeSomething') }}</p>
    <p v-else-if="!tracks.length" class="empty-message">{{ lang.t('search.nothingFound', { query: searchWords }) }}</p>

    <template v-else>
      <TrackList :tracks="tracks" />

      <div v-if="nextPageToken" class="more">
        <button class="btn-outline" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? lang.t('common.loading') : lang.t('mood.loadMore') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 24px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

h1 {
  font-size: 1.8rem;
  font-weight: 800;
}

.more {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
</style>
