<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { useFavoritesStore } from '@/stores/favorites'
import { useProfileStore } from '@/stores/profile'
import { usePlaylistsStore } from '@/stores/playlists'
import { useLanguageStore } from '@/stores/language'
import BottomPlayer from '@/components/BottomPlayer.vue'

// ===================================================================
// STORE SETUP
// ===================================================================

const auth = useAuthStore()
const player = usePlayerStore()
const favorites = useFavoritesStore()
const profileStore = useProfileStore()
const playlists = usePlaylistsStore()
const lang = useLanguageStore()
const router = useRouter()

// ===================================================================
// STATE
// ===================================================================

const searchText = ref('')

// ===================================================================
// WATCHERS
// ===================================================================

watch(() => auth.user, (user) => {
  if (user) {
    favorites.load(user.id)
    profileStore.load(user.id)
  } else {
    favorites.reset()
    profileStore.reset()
    playlists.reset()
  }
}, { immediate: true })

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

function displayName() {
  if (profileStore.profile && profileStore.profile.full_name) {
    return profileStore.profile.full_name
  }

  return auth.displayName()
}

function avatarUrl() {
  if (profileStore.profile && profileStore.profile.avatar_url) {
    return profileStore.profile.avatar_url
  }

  return ''
}

function doSearch() {
  const text = searchText.value.trim()
  if (!text) return

  router.push({
    path: '/search',
    query: { q: text }
  })
}

async function logout() {
  await auth.signOut()
  router.push('/')
}
</script>

<template>
  <!-- =================================================================
       NAVBAR - Top navigation bar
       ================================================================= -->
  <nav class="navbar">
    <RouterLink to="/" class="logo">
      <span class="logo-mark">M&amp;M</span>
      <span class="logo-tagline">Mood &amp; More</span>
    </RouterLink>

    <form class="search" @submit.prevent="doSearch">
      <input v-model="searchText" type="search" :placeholder="lang.t('nav.searchPlaceholder')" maxlength="100" />
    </form>

    <div class="links">
      <RouterLink to="/users" class="link" :title="lang.t('users.title')">👤</RouterLink>
      <RouterLink to="/settings" class="link" :title="lang.t('nav.settings')">⚙</RouterLink>

      <template v-if="auth.user">
        <RouterLink to="/collection" class="link">{{ lang.t('nav.collection') }}</RouterLink>

        <RouterLink to="/profile" class="user" :title="lang.t('nav.profile')">
          <img v-if="avatarUrl()" :src="avatarUrl()" alt="" class="avatar" />
          <span class="username">{{ displayName() }}</span>
        </RouterLink>

        <button class="link logout" @click="logout">{{ lang.t('nav.logout') }}</button>
      </template>

      <template v-else>
        <RouterLink to="/login" class="link">{{ lang.t('nav.login') }}</RouterLink>
        <RouterLink to="/signup" class="link signup">{{ lang.t('nav.signup') }}</RouterLink>
      </template>
    </div>
  </nav>

  <!-- =================================================================
       PAGE CONTENT - Router view with player spacing
       ================================================================= -->
  <main :style="{ paddingBottom: player.currentTrack ? '90px' : '0' }">
    <RouterView />
  </main>

  <!-- =================================================================
       PLAYER - Music player bar
       ================================================================= -->
  <BottomPlayer />
</template>

<style scoped>
/* ===================================================================
   NAVBAR - Layout and spacing
   =================================================================== */

.navbar {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 64px;
  padding: 0 32px;
  background: var(--paper);
  border-bottom: 1px solid var(--rule);
  position: sticky;
  top: 0;
  z-index: 100;
}

/* ===================================================================
   LOGO - Branding area
   =================================================================== */

.logo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
}

.logo-mark {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 1.6rem;
  font-weight: 400;
  font-style: italic;
  letter-spacing: -0.01em;
  color: var(--orange);
}

.logo-tagline {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

/* ===================================================================
   SEARCH - Search input field
   =================================================================== */

.search {
  flex: 1;
  max-width: 380px;
}

.search input {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 8px 16px;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.search input:focus {
  border-color: var(--orange);
}

/* ===================================================================
   LINKS - Navigation items
   =================================================================== */

.links {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.link {
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: var(--radius);
  background: none;
  border: none;
}

.link:hover {
  color: var(--ink);
  background: var(--card-2);
}

.logout {
  color: var(--red);
}

/* ===================================================================
   USER - Profile button
   =================================================================== */

.user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: var(--radius);
  text-decoration: none;
}

.user:hover {
  background: var(--card-2);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  border: 1px solid var(--rule);
  background: var(--card-2);
}

.username {
  color: var(--ink);
  font-size: 0.9rem;
  font-weight: 600;
}

/* ===================================================================
   SIGNUP BUTTON - Primary action button
   =================================================================== */

.signup {
  background: var(--orange);
  color: var(--on-accent);
  border-radius: var(--radius);
  font-weight: 600;
}

.signup:hover {
  background: var(--orange-dark);
  color: var(--on-accent);
}

/* ===================================================================
   MOBILE RESPONSIVE
   =================================================================== */

@media (max-width: 700px) {
  .navbar {
    padding: 0 16px;
    gap: 10px;
  }
  .username {
    display: none;
  }
}
</style>
