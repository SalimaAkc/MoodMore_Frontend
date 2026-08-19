<!-- ===================================================================
     USER PROFILE - View other users' public playlists
     =================================================================== -->

<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useLanguageStore } from '@/stores/language'
import { usePlayerStore } from '@/stores/player'
import { findMoodById } from '@/lib/moods'
import { postToApi, deleteFromApi } from '@/lib/api'

// ===================================================================
// STORE SETUP
// ===================================================================

const route = useRoute()
const auth = useAuthStore()
const lang = useLanguageStore()
const player = usePlayerStore()

// ===================================================================
// STATE
// ===================================================================

const userId = route.params.id
const profile = ref(null)
const playlists = ref([])
const followers = ref(0)
const following = ref(0)
const loading = ref(true)
const isFollowing = ref(false)

const errorMessage = ref('')
const toggleFollowLoading = ref(false)

// ===================================================================
// COMPUTED
// ===================================================================

const publicPlaylists = computed(() => {
  return playlists.value.filter(p => !!p.is_public)
})

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

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
  return profile.value?.full_name || 'User'
}

function avatarUrl() {
  return profile.value?.avatar_url || ''
}

// ===================================================================
// FOLLOW/UNFOLLOW
// ===================================================================

async function toggleFollow() {
  if (!auth.user) return

  toggleFollowLoading.value = true

  try {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    if (!token) {
      errorMessage.value = 'You are not logged in'
      return
    }

    if (isFollowing.value) {
      await deleteFromApi(`/api/follow/${userId}`, token)
    } else {
      await postToApi(`/api/follow/${userId}`, token)
    }

    isFollowing.value = !isFollowing.value

    if (isFollowing.value) {
      followers.value += 1
    } else {
      followers.value -= 1
    }
  } catch (error) {
    errorMessage.value = 'Could not update follow status'
  } finally {
    toggleFollowLoading.value = false
  }
}

// ===================================================================
// LIFECYCLE
// ===================================================================

onMounted(async () => {
  try {
    const profileResult = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (profileResult.error || !profileResult.data) {
      errorMessage.value = lang.t('user.notFound')
      loading.value = false
      return
    }

    profile.value = profileResult.data

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

    playlists.value = playlistResult.data || []
    followers.value = followerResult.count || 0
    following.value = followingResult.count || 0

    if (auth.user) {
      const followResult = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', auth.user.id)
        .eq('followee_id', userId)
        .maybeSingle()

      isFollowing.value = !!followResult.data
    }
  } catch (error) {
    errorMessage.value = lang.t('user.loadError')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <!-- ===================================================================
       PAGE - User profile
       =================================================================== -->
  <div class="page">
    <p v-if="loading" class="empty-message">{{ lang.t('common.loading') }}</p>

    <p v-else-if="errorMessage" class="error-box">{{ errorMessage }}</p>

    <template v-else>
      <!-- PROFILE HEADER -->
      <header class="header">
        <div v-if="avatarUrl()" class="avatar">
          <img :src="avatarUrl()" :alt="displayName()" />
        </div>
        <div v-else class="avatar avatar-blank">{{ displayName().charAt(0).toUpperCase() }}</div>

        <div class="profile-info">
          <h1>{{ displayName() }}</h1>

          <div class="stats">
            <span><strong>{{ playlists.length }}</strong> {{ lang.t('profile.playlists') }}</span>
            <span><strong>{{ followers }}</strong> {{ lang.t('profile.followers') }}</span>
            <span><strong>{{ following }}</strong> {{ lang.t('profile.following') }}</span>
          </div>

          <button
            v-if="auth.user && auth.user.id !== userId"
            :class="{ following: isFollowing }"
            class="btn-follow"
            :disabled="toggleFollowLoading"
            @click="toggleFollow"
          >
            {{ toggleFollowLoading ? '…' : isFollowing ? lang.t('users.unfollow') : lang.t('users.follow') }}
          </button>
        </div>
      </header>

      <!-- PUBLIC PLAYLISTS -->
      <section class="playlists-section">
        <h2>{{ lang.t('user.publicPlaylists') }}</h2>

        <p v-if="!publicPlaylists.length" class="empty-message">
          {{ lang.t('user.noPublicPlaylists') }}
        </p>

        <div v-else class="playlists-grid">
          <div
            v-for="playlist in publicPlaylists"
            :key="playlist.id"
            class="playlist-card"
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
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
/* ===================================================================
   PAGE - Layout
   =================================================================== */

.page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* ===================================================================
   HEADER - Profile info
   =================================================================== */

.header {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 48px;
  flex-wrap: wrap;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  object-fit: cover;
  border: 1px solid var(--rule);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-blank {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card);
  font-size: 3rem;
  font-weight: 700;
}

.profile-info h1 {
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 16px;
}

.stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  color: var(--ink-soft);
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.stats strong {
  color: var(--ink);
  font-weight: 700;
}

/* ===================================================================
   FOLLOW BUTTON
   =================================================================== */

.btn-follow {
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--orange);
  color: var(--on-accent);
  border: 1px solid var(--orange);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-follow:hover:not(:disabled) {
  background: var(--orange-dark);
  border-color: var(--orange-dark);
}

.btn-follow.following {
  background: transparent;
  color: var(--ink);
  border-color: var(--rule);
}

.btn-follow.following:hover:not(:disabled) {
  background: var(--card-2);
  border-color: var(--ink-soft);
}

.btn-follow:disabled {
  opacity: 0.6;
  cursor: default;
}

/* ===================================================================
   PLAYLISTS SECTION
   =================================================================== */

.playlists-section {
  margin-bottom: 44px;
}

.playlists-section h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 24px;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.playlist-card {
  border-radius: 16px;
  overflow: hidden;
}

.card-link {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  text-decoration: none;
  color: var(--ink);
}

.emoji {
  font-size: 2rem;
}

.name {
  font-weight: 700;
  font-size: 1.05rem;
}

.meta {
  font-size: 0.8rem;
  color: var(--ink-soft);
}

@media (max-width: 560px) {
  .header {
    gap: 20px;
  }

  .avatar {
    width: 80px;
    height: 80px;
  }

  .profile-info h1 {
    font-size: 1.8rem;
  }
}
</style>
