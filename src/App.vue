<script setup>
// The frame around every page, navbar on top and player at the bottom

import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { useFavoritesStore } from '@/stores/favorites'
import { useProfileStore } from '@/stores/profile'
import { usePlaylistsStore } from '@/stores/playlists'
import { useLanguageStore } from '@/stores/language'
import BottomPlayer from '@/components/BottomPlayer.vue'

const auth = useAuthStore()
const player = usePlayerStore()
const favorites = useFavoritesStore()
const profileStore = useProfileStore()
const playlists = usePlaylistsStore()
const lang = useLanguageStore()
const router = useRouter()

const searchText = ref('')

// Load the favourites and the profile on login, forget them on logout.
// The playlist list is not loaded here, the + button on a track fetches it
// the first time somebody opens the menu.
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

// The name to show, from the profile table if we have it
function displayName() {
  if (profileStore.profile && profileStore.profile.full_name) {
    return profileStore.profile.full_name
  }

  return auth.displayName()
}

// The profile picture, or an empty string when there is none
function avatarUrl() {
  if (profileStore.profile && profileStore.profile.avatar_url) {
    return profileStore.profile.avatar_url
  }

  return ''
}

// Put the search in the address so the /search page can read it
function doSearch() {
  const text = searchText.value.trim()
  if (!text) return

  router.push({
    path: '/search',
    query: { q: text }
  })
}

// Log out and go back to the home page
async function logout() {
  await auth.signOut()
  router.push('/')
}
</script>

<template>
  <nav class="navbar">
    <RouterLink to="/" class="logo">
      <span class="logo-mark">M&amp;M</span>
      <span class="logo-tagline">Mood &amp; More</span>
    </RouterLink>

    <form class="search" @submit.prevent="doSearch">
      <input v-model="searchText" type="search" :placeholder="lang.t('nav.searchPlaceholder')" maxlength="100" />
    </form>

    <div class="links">
      <RouterLink to="/settings" class="link" :title="lang.t('nav.settings')">⚙</RouterLink>

      <!-- Logged in -->
      <template v-if="auth.user">
        <RouterLink to="/collection" class="link">{{ lang.t('nav.collection') }}</RouterLink>

        <RouterLink to="/profile" class="user" :title="lang.t('nav.profile')">
          <img v-if="avatarUrl()" :src="avatarUrl()" alt="" class="avatar" />
          <span class="username">{{ displayName() }}</span>
        </RouterLink>

        <button class="link logout" @click="logout">{{ lang.t('nav.logout') }}</button>
      </template>

      <!-- Logged out -->
      <template v-else>
        <RouterLink to="/login" class="link">{{ lang.t('nav.login') }}</RouterLink>
        <RouterLink to="/signup" class="link signup">{{ lang.t('nav.signup') }}</RouterLink>
      </template>
    </div>
  </nav>

  <!-- Extra space at the bottom so the player never covers the last track -->
  <main :style="{ paddingBottom: player.currentTrack ? '90px' : '0' }">
    <RouterView />
  </main>

  <BottomPlayer />
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 64px;
  padding: 0 32px;
  background: var(--paper);
  border-bottom: 1px solid var(--rule);
  position: sticky; /* stays on screen while scrolling */
  top: 0;
  z-index: 100;
}

/* The mark and the tagline stack, so the two read as one lockup */
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

/* Small and wide, so it sits under the mark without competing with it */
.logo-tagline {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

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

.links {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto; /* pushes this group to the right */
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

/* The picture and name together link to the settings page */
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
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--rule);
}

.username {
  color: var(--ink);
  font-size: 0.9rem;
  font-weight: 600;
}

.logout {
  color: var(--red);
}

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
