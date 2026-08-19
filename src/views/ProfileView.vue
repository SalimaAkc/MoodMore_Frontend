<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useLanguageStore } from '@/stores/language'
import { findMoodById } from '@/lib/moods'
import { moodBreakdown, totalSaved, topMood, DEFAULT_DAYS } from '@/lib/stats'

// ===================================================================
// STORE SETUP
// ===================================================================

const auth = useAuthStore()
const profile = useProfileStore()
const lang = useLanguageStore()

// ===================================================================
// STATE
// ===================================================================

const savedPlaylists = ref([])
const followers = ref(0)
const following = ref(0)
const loading = ref(true)

const loadError = ref('')
const privacyError = ref('')

const changingId = ref(null)

// ===================================================================
// COMPUTED STATS
// ===================================================================

const breakdown = computed(() => moodBreakdown(savedPlaylists.value, DEFAULT_DAYS))
const monthTotal = computed(() => totalSaved(breakdown.value))
const monthTop = computed(() => topMood(breakdown.value))

const biggestCount = computed(() => {
  if (!breakdown.value.length) return 0
  return breakdown.value[0].count
})

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

function barWidth(row) {
  if (!biggestCount.value) return '0%'
  return Math.round((row.count / biggestCount.value) * 100) + '%'
}

function songCount(playlist) {
  if (!playlist.songs) return 0
  return playlist.songs.length
}

function formatDate(text) {
  return new Date(text).toLocaleDateString(lang.current, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function displayName() {
  if (profile.profile && profile.profile.full_name) {
    return profile.profile.full_name
  }

  return auth.displayName()
}

function avatarUrl() {
  if (profile.profile && profile.profile.avatar_url) {
    return profile.profile.avatar_url
  }

  return ''
}

// ===================================================================
// LIFECYCLE
// ===================================================================

onMounted(async () => {
  const userId = auth.user.id

  const [playlistResult, followerResult, followingResult] = await Promise.all([
    supabase
      .from('playlists')
      .select('id, name, mood_id, created_at, songs, is_public')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('followee_id', userId),

    supabase
      .from('follows')
      .select('followee_id', { count: 'exact', head: true })
      .eq('follower_id', userId)
  ])

  if (playlistResult.error) {
    loadError.value = lang.t('profile.loadError')
  } else {
    savedPlaylists.value = playlistResult.data.map(playlist => ({
      ...playlist,
      is_public: !!playlist.is_public
    }))
  }

  // A missing count is shown as nothing rather than as a wrong number
  followers.value = followerResult.count || 0
  following.value = followingResult.count || 0

  loading.value = false
})

// ===================================================================
// ACTIONS
// ===================================================================

async function togglePublic(playlist) {
  changingId.value = playlist.id
  privacyError.value = ''

  const wanted = !playlist.is_public

  const result = await supabase
    .from('playlists')
    .update({ is_public: wanted })
    .eq('id', playlist.id)

  if (result.error) {
    privacyError.value = lang.t('profile.privacyError')
  } else {
    playlist.is_public = wanted
  }

  changingId.value = null
}
</script>

<template>
  <div class="page">
    <!-- Who you are -->
    <header class="header">
      <img v-if="avatarUrl()" :src="avatarUrl()" alt="" class="avatar" />
      <span v-else class="avatar avatar-blank">{{ '🙂' }}</span>

      <div class="who">
        <h1>{{ displayName() }}</h1>

        <div class="counts">
          <span><strong>{{ savedPlaylists.length }}</strong> {{ lang.t('profile.playlists') }}</span>
          <span><strong>{{ followers }}</strong> {{ lang.t('profile.followers') }}</span>
          <span><strong>{{ following }}</strong> {{ lang.t('profile.following') }}</span>
        </div>

        <RouterLink to="/settings" class="edit">{{ lang.t('nav.editProfile') }}</RouterLink>
      </div>
    </header>

    <p v-if="loading" class="empty-message">{{ lang.t('common.loading') }}</p>

    <p v-else-if="loadError" class="error-box">{{ loadError }}</p>

    <template v-else>
      <!-- How the month went -->
      <section class="panel">
        <h2>{{ lang.t('profile.month') }}</h2>
        <p class="note">{{ lang.t('profile.monthNote') }}</p>

        <p v-if="!breakdown.length" class="empty-message">{{ lang.t('profile.monthEmpty') }}</p>

        <template v-else>
          <p class="top-mood">
            {{ monthTop.emoji }}
            {{ lang.t('profile.topMood', { mood: monthTop.name }) }}
            <span class="total">{{ lang.t('common.tracks', { count: monthTotal }) }}</span>
          </p>

          <ul class="chart">
            <li v-for="row in breakdown" :key="row.mood.id" class="chart-row">
              <span class="chart-label">{{ row.mood.emoji }} {{ row.mood.name }}</span>

              <span class="chart-track">
                <span
                  class="chart-bar"
                  :style="{ width: barWidth(row), background: row.mood.color }"
                ></span>
              </span>

              <span class="chart-value">{{ row.share }}%</span>
            </li>
          </ul>
        </template>
      </section>

      <!-- What you saved -->
      <section class="panel">
        <h2>{{ lang.t('profile.playlists') }}</h2>
        <p class="note">{{ lang.t('profile.privacyNote') }}</p>

        <p v-if="privacyError" class="error-box">{{ privacyError }}</p>

        <p v-if="!savedPlaylists.length" class="empty-message">{{ lang.t('profile.empty') }}</p>

        <div v-else class="grid">
          <div
            v-for="playlist in savedPlaylists"
            :key="playlist.id"
            class="card"
            :class="{ 'is-private': !playlist.is_public }"
            :style="{ background: findMoodById(playlist.mood_id).background }"
          >
            <RouterLink :to="`/playlist/${playlist.id}`" class="card-link">
              <span class="emoji">{{ findMoodById(playlist.mood_id).emoji }}</span>
              <span class="name">{{ playlist.name }}</span>
              <span class="meta">
                {{ lang.t('common.tracks', { count: songCount(playlist) }) }} ·
                {{ formatDate(playlist.created_at) }}
              </span>
            </RouterLink>

            <button
              class="privacy"
              :class="{ on: playlist.is_public }"
              :disabled="changingId === playlist.id"
              :title="playlist.is_public ? lang.t('profile.makePrivate') : lang.t('profile.makePublic')"
              @click="togglePublic(playlist)"
            >
              <template v-if="changingId === playlist.id">…</template>
              <template v-else-if="playlist.is_public">🌐 {{ lang.t('profile.public') }}</template>
              <template v-else>🔒 {{ lang.t('profile.private') }}</template>
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px 60px;
}

/* Who you are */
.header {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--rule);
}

.avatar-blank {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card);
  font-size: 3rem;
}

.who h1 {
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1.1;
}

.counts {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 10px;
  color: var(--ink-soft);
  font-size: 0.9rem;
}

.counts strong {
  color: var(--ink);
  font-weight: 700;
}

.edit {
  display: inline-block;
  margin-top: 12px;
  color: var(--orange);
  font-size: 0.9rem;
  font-weight: 600;
}

/* Panels */
.panel {
  margin-bottom: 44px;
}

.panel h2 {
  font-size: 1.4rem;
  font-weight: 700;
}

.note {
  color: var(--ink-soft);
  font-size: 0.85rem;
  margin: 4px 0 18px;
  max-width: 60ch;
}

/* The month chart */
.top-mood {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.total {
  color: var(--ink-soft);
  font-size: 0.85rem;
  font-weight: 400;
  margin-left: 8px;
}

.chart {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-row {
  display: grid;
  grid-template-columns: 150px 1fr 44px;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
}

.chart-track {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 999px;
  height: 14px;
  overflow: hidden;
}

.chart-bar {
  display: block;
  height: 100%;
  border-radius: 999px;
  /* Not animated on load, it would look like the number is still changing */
}

.chart-value {
  text-align: right;
  color: var(--ink-soft);
}

/* The playlists */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

/* A private playlist is dimmed, so what is published reads at a glance */
.card.is-private {
  opacity: 0.72;
}

.card-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 20px 20px 52px;
  color: var(--ink);
}

.emoji {
  font-size: 2.2rem;
  margin-bottom: 4px;
}

.name {
  font-weight: 700;
  font-size: 1.05rem;
  line-height: 1.2;
}

.meta {
  font-size: 0.8rem;
  color: var(--ink-soft);
  line-height: 1.2;
}

.privacy {
  position: absolute;
  left: 20px;
  bottom: 16px;
  border: 1px solid var(--rule);
  background: var(--paper);
  color: var(--ink);
  border-radius: 999px;
  padding: 4px 12px;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.privacy.on {
  border-color: var(--orange);
  color: var(--orange);
}

.privacy:disabled {
  cursor: default;
  opacity: 0.6;
}

@media (max-width: 560px) {
  .chart-row {
    grid-template-columns: 110px 1fr 40px;
    font-size: 0.82rem;
  }

  .who h1 {
    font-size: 1.8rem;
  }
}
</style>
