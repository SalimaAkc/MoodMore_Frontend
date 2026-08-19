<!-- ===================================================================
     USERS - Find and follow other users
     =================================================================== -->

<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLanguageStore } from '@/stores/language'
import { supabase } from '@/lib/supabase'
import { getFromApi, postToApi, deleteFromApi } from '@/lib/api'

// ===================================================================
// STORE SETUP
// ===================================================================

const auth = useAuthStore()
const lang = useLanguageStore()

// ===================================================================
// STATE
// ===================================================================

const searchQuery = ref('')
const users = ref([])
const loading = ref(false)
const errorMessage = ref('')
const followingIds = ref(new Set())

// ===================================================================
// SEARCH & FOLLOW
// ===================================================================

async function searchUsers() {
  // allow empty searches for testing

  loading.value = true
  errorMessage.value = ''

  try {
    const data = await getFromApi('/api/users', { q: searchQuery.value })
    users.value = data.users || []
  } catch (error) {
    errorMessage.value = error.message
    users.value = []
  } finally {
    loading.value = false
  }
}

async function toggleFollow(user, isCurrentlyFollowing) {
  if (!auth.user) return

  try {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    if (!token) {
      errorMessage.value = 'You are not logged in'
      return
    }

    if (isCurrentlyFollowing) {
      await deleteFromApi(`/api/follow/${user.id}`, token)
      followingIds.value.delete(user.id)
    } else {
      await postToApi(`/api/follow/${user.id}`, token)
      followingIds.value.add(user.id)
    }
  } catch (error) {
    errorMessage.value = error.message
  }
}

function isFollowing(userId) {
  return followingIds.value.has(userId)
}

// ===================================================================
// LIFECYCLE
// ===================================================================

onMounted(async () => {
  if (!auth.user) return

  try {
    // load current user's following list
    const result = await supabase
      .from('follows')
      .select('followee_id')
      .eq('follower_id', auth.user.id)

    if (result.data) {
      result.data.forEach(follow => {
        followingIds.value.add(follow.followee_id)
      })
    }
  } catch (error) {
    console.error('Could not load following list:', error)
  }
})
</script>

<template>
  <!-- ===================================================================
       PAGE - Find users
       =================================================================== -->
  <div class="page">
    <h1>{{ lang.t('users.title') }}</h1>
    <p class="subtitle">{{ lang.t('users.subtitle') }}</p>

    <!-- SEARCH BOX -->
    <div class="search-container">
      <div class="person-icon">👤</div>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="lang.t('users.searchPlaceholder')"
          maxlength="100"
          @keydown.enter="searchUsers"
        />
        <button class="btn" @click="searchUsers" :disabled="loading">
          {{ loading ? lang.t('common.loading') : lang.t('users.search') }}
        </button>
      </div>
    </div>

    <!-- ERRORS -->
    <p v-if="errorMessage" class="error-box">{{ errorMessage }}</p>

    <!-- LOADING -->
    <p v-if="loading" class="empty-message">{{ lang.t('common.loading') }}</p>

    <!-- NO RESULTS -->
    <p v-else-if="!searchQuery && !users.length" class="empty-message">
      {{ lang.t('users.typeToSearch') }}
    </p>

    <p v-else-if="users.length === 0" class="empty-message">
      {{ lang.t('users.noResults') }}
    </p>

    <!-- USER LIST -->
    <div v-else class="users-grid">
      <div v-for="user in users" :key="user.id" class="user-card">
        <RouterLink :to="`/user/${user.id}`" class="user-link">
          <div v-if="user.avatar_url" class="avatar">
            <img :src="user.avatar_url" :alt="user.full_name" />
          </div>
          <div v-else class="avatar avatar-blank">
            {{ user.full_name ? user.full_name.charAt(0).toUpperCase() : '?' }}
          </div>

          <div class="user-info">
            <p class="name">{{ user.full_name || 'Anonymous' }}</p>
            <p class="email">{{ user.email }}</p>
          </div>
        </RouterLink>

        <button
          v-if="auth.user && auth.user.id !== user.id"
          :class="{ following: isFollowing(user.id) }"
          class="btn-follow"
          @click="toggleFollow(user, isFollowing(user.id))"
        >
          {{ isFollowing(user.id) ? lang.t('users.unfollow') : lang.t('users.follow') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===================================================================
   PAGE - Layout
   =================================================================== */

.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 24px;
}

h1 {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 12px;
}

.subtitle {
  color: var(--ink-soft);
  margin-bottom: 32px;
}

/* ===================================================================
   SEARCH CONTAINER & BOX
   =================================================================== */

.search-container {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.person-icon {
  font-size: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: var(--card);
  border: 2px solid var(--orange);
  border-radius: 50%;
  flex-shrink: 0;
}

.search-box {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-box input {
  flex: 1;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 12px 16px;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
}

.search-box input:focus {
  border-color: var(--orange);
}

/* ===================================================================
   USER GRID & CARDS
   =================================================================== */

.users-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  transition: background 0.15s;
}

.user-card:hover {
  background: var(--card-2);
}

.user-link {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  text-decoration: none;
  min-width: 0;
}

/* ===================================================================
   AVATAR
   =================================================================== */

.avatar {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--rule);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.avatar-blank {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-2);
  font-weight: 600;
  color: var(--ink-soft);
}

/* ===================================================================
   USER INFO
   =================================================================== */

.user-info {
  min-width: 0;
  flex: 1;
}

.name {
  font-weight: 600;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email {
  font-size: 0.85rem;
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===================================================================
   FOLLOW BUTTON
   =================================================================== */

.btn-follow {
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--orange);
  color: var(--on-accent);
  border: 1px solid var(--orange);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-follow:hover {
  background: var(--orange-dark);
  border-color: var(--orange-dark);
}

.btn-follow.following {
  background: transparent;
  color: var(--ink);
  border-color: var(--rule);
}

.btn-follow.following:hover {
  background: var(--card-2);
  border-color: var(--ink-soft);
}

@media (max-width: 600px) {
  .search-container {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .person-icon {
    width: 100%;
    border-radius: var(--radius);
  }

  .search-box {
    flex-direction: column;
  }
}
</style>
