<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { useAuthStore } from '@/stores/auth'
import { useLanguageStore } from '@/stores/language'
import { MOODS } from '@/lib/moods'

// ===================================================================
// STORE SETUP
// ===================================================================

const auth = useAuthStore()
const lang = useLanguageStore()

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

function greeting() {
  const hour = new Date().getHours()

  if (hour < 12) return lang.t('home.morning')
  if (hour < 18) return lang.t('home.afternoon')

  return lang.t('home.evening')
}

function firstName() {
  const fullName = auth.displayName()
  return fullName.split(' ')[0]
}
</script>

<template>
  <div class="page">
    <!-- =================================================================
         ANIMATED MUSIC NOTES - Left side decorations
         ================================================================= -->
    <div class="music-notes-left">
      <span class="note" style="animation-delay: 0s">♪</span>
      <span class="note" style="animation-delay: 2s">♫</span>
      <span class="note" style="animation-delay: 4s">♪</span>
      <span class="note" style="animation-delay: 6s">♫</span>
      <span class="note" style="animation-delay: 8s">♪</span>
      <span class="note" style="animation-delay: 10s">♫</span>
      <span class="note" style="animation-delay: 12s">♪</span>
      <span class="note" style="animation-delay: 14s">♫</span>
    </div>

    <!-- =================================================================
         ANIMATED MUSIC NOTES - Right side decorations
         ================================================================= -->
    <div class="music-notes-right">
      <span class="note" style="animation-delay: 1s">♫</span>
      <span class="note" style="animation-delay: 3s">♪</span>
      <span class="note" style="animation-delay: 5s">♫</span>
      <span class="note" style="animation-delay: 7s">♪</span>
      <span class="note" style="animation-delay: 9s">♫</span>
      <span class="note" style="animation-delay: 11s">♪</span>
      <span class="note" style="animation-delay: 13s">♫</span>
      <span class="note" style="animation-delay: 15s">♪</span>
    </div>

    <!-- =================================================================
         HEADER - Introduction and greeting
         ================================================================= -->
    <header class="intro">
      <p v-if="auth.user" class="hello">{{ greeting() }}, {{ firstName() }} 👋</p>
      <h1>{{ lang.t('home.title') }}</h1>
      <p class="subtitle">{{ lang.t('home.subtitle') }}</p>
    </header>

    <!-- =================================================================
         MOODS GRID - Clickable mood cards
         ================================================================= -->
    <div class="grid">
      <RouterLink
        v-for="mood in MOODS"
        :key="mood.id"
        :to="`/mood/${mood.name}`"
        class="card"
        :style="{ background: mood.background }"
      >
        <span class="emoji">{{ mood.emoji }}</span>
        <span class="name" :style="{ color: mood.color }">{{ lang.t('moodName.' + mood.id) }}</span>
        <span class="description">{{ lang.t('moodDesc.' + mood.id) }}</span>
      </RouterLink>
    </div>

    <!-- =================================================================
         SIGNUP PROMPT - Call to action for logged out users
         ================================================================= -->
    <div v-if="!auth.user" class="signup-box">
      <p>{{ lang.t('home.signupBox') }}</p>
      <RouterLink to="/signup" class="btn">{{ lang.t('home.signupButton') }}</RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* ===================================================================
   PAGE - Layout
   =================================================================== */

.page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 60px 24px;
  position: relative;
  overflow: hidden;
}

/* ===================================================================
   ANIMATED MUSIC NOTES - Floating decorations
   =================================================================== */

.music-notes-left,
.music-notes-right {
  position: fixed;
  top: 0;
  width: 120px;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
}

.music-notes-left {
  left: 0;
}

.music-notes-right {
  right: 0;
}

.note {
  position: absolute;
  font-size: 2rem;
  opacity: 0.15;
  animation: float-up 20s infinite ease-in;
  display: block;
  width: 120px;
  text-align: center;
}

.music-notes-left .note {
  left: 0;
}

.music-notes-right .note {
  right: 0;
}

@keyframes float-up {
  0% {
    bottom: -60px;
    opacity: 0.15;
  }
  50% {
    opacity: 0.25;
  }
  100% {
    bottom: 100vh;
    opacity: 0.05;
  }
}

/* ===================================================================
   INTRO - Header with greeting
   =================================================================== */

.intro {
  text-align: center;
  margin-bottom: 48px;
  position: relative;
  z-index: 1;
}

.hello {
  color: var(--ink-soft);
  margin-bottom: 12px;
}

.intro h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  margin-bottom: 12px;
}

.subtitle {
  color: var(--ink-soft);
}

/* ===================================================================
   GRID & CARDS - Mood selection cards
   =================================================================== */

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  position: relative;
  z-index: 1;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px 24px;
  border-radius: 16px;
  text-decoration: none;
  color: var(--on-mood);
  border: 1px solid var(--mood-border);
}

.card:hover {
  transform: translateY(-4px);
}

.emoji {
  font-size: 2.4rem;
}

.name {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 700;
}

.description {
  color: var(--on-mood-soft);
  font-size: 0.88rem;
}

/* ===================================================================
   SIGNUP BOX - Call to action
   =================================================================== */

.signup-box {
  margin-top: 48px;
  padding: 28px;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.signup-box p {
  color: var(--ink-soft);
}

.signup-box .btn {
  text-decoration: none;
  display: inline-block;
}
</style>
