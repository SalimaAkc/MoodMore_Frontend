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
         ANIMATED MUSIC NOTES - Background decorations
         ================================================================= -->
    <div class="music-notes-bg">
      <span class="note note-1" style="animation-delay: 0s">♪</span>
      <span class="note note-2" style="animation-delay: 2s">♫</span>
      <span class="note note-3" style="animation-delay: 4s">♪</span>
      <span class="note note-4" style="animation-delay: 1s">♫</span>
      <span class="note note-5" style="animation-delay: 3s">♪</span>
      <span class="note note-6" style="animation-delay: 5s">♫</span>
      <span class="note note-7" style="animation-delay: 2.5s">♪</span>
      <span class="note note-8" style="animation-delay: 4.5s">♫</span>
      <span class="note note-9" style="animation-delay: 1.5s">♪</span>
      <span class="note note-10" style="animation-delay: 3.5s">♫</span>
      <span class="note note-11" style="animation-delay: 0.5s">♪</span>
      <span class="note note-12" style="animation-delay: 5.5s">♫</span>
      <span class="note note-13" style="animation-delay: 2.2s">♪</span>
      <span class="note note-14" style="animation-delay: 4.2s">♫</span>
      <span class="note note-15" style="animation-delay: 1.8s">♪</span>
      <span class="note note-16" style="animation-delay: 0.8s">♫</span>
      <span class="note note-17" style="animation-delay: 3.2s">♪</span>
      <span class="note note-18" style="animation-delay: 5.2s">♫</span>
      <span class="note note-19" style="animation-delay: 1.2s">♪</span>
      <span class="note note-20" style="animation-delay: 4.8s">♫</span>
      <span class="note note-21" style="animation-delay: 2.8s">♪</span>
      <span class="note note-22" style="animation-delay: 0.3s">♫</span>
      <span class="note note-23" style="animation-delay: 3.8s">♪</span>
      <span class="note note-24" style="animation-delay: 1.6s">♫</span>
      <span class="note note-25" style="animation-delay: 4.4s">♪</span>
      <span class="note note-26" style="animation-delay: 2.6s">♫</span>
      <span class="note note-27" style="animation-delay: 0.6s">♪</span>
      <span class="note note-28" style="animation-delay: 3.4s">♫</span>
      <span class="note note-29" style="animation-delay: 5.4s">♪</span>
      <span class="note note-30" style="animation-delay: 1.4s">♫</span>
      <span class="note note-31" style="animation-delay: 4.6s">♪</span>
      <span class="note note-32" style="animation-delay: 2.4s">♫</span>
      <span class="note note-33" style="animation-delay: 0.2s">♪</span>
      <span class="note note-34" style="animation-delay: 3.6s">♫</span>
      <span class="note note-35" style="animation-delay: 5.6s">♪</span>
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
   ANIMATED MUSIC NOTES - Floating background decorations
   =================================================================== */

.music-notes-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.note {
  position: absolute;
  font-size: 2.5rem;
  opacity: 0.12;
  display: block;
  font-weight: 300;
}

.note-1 { left: 5%; top: 10%; animation: float-diagonal-1 25s infinite ease-in-out; }
.note-2 { left: 15%; top: 20%; animation: float-diagonal-2 30s infinite ease-in-out; }
.note-3 { left: 25%; top: 5%; animation: float-up 28s infinite ease-in; }
.note-4 { left: 35%; top: 30%; animation: float-diagonal-1 26s infinite ease-in-out; }
.note-5 { left: 45%; top: 15%; animation: float-diagonal-3 32s infinite ease-in-out; }
.note-6 { left: 55%; top: 25%; animation: float-up 24s infinite ease-in; }
.note-7 { left: 65%; top: 8%; animation: float-diagonal-2 27s infinite ease-in-out; }
.note-8 { left: 75%; top: 20%; animation: float-diagonal-1 29s infinite ease-in-out; }
.note-9 { left: 85%; top: 10%; animation: float-up 26s infinite ease-in; }
.note-10 { left: 10%; top: 50%; animation: float-diagonal-3 28s infinite ease-in-out; }
.note-11 { left: 40%; top: 60%; animation: float-up 25s infinite ease-in; }
.note-12 { left: 70%; top: 45%; animation: float-diagonal-2 31s infinite ease-in-out; }
.note-13 { left: 20%; top: 70%; animation: float-diagonal-1 27s infinite ease-in-out; }
.note-14 { left: 60%; top: 55%; animation: float-up 29s infinite ease-in; }
.note-15 { left: 80%; top: 65%; animation: float-diagonal-3 26s infinite ease-in-out; }
.note-16 { left: 12%; top: 35%; animation: float-up 27s infinite ease-in; }
.note-17 { left: 28%; top: 50%; animation: float-diagonal-1 30s infinite ease-in-out; }
.note-18 { left: 38%; top: 8%; animation: float-diagonal-2 25s infinite ease-in-out; }
.note-19 { left: 52%; top: 40%; animation: float-up 31s infinite ease-in; }
.note-20 { left: 68%; top: 30%; animation: float-diagonal-3 28s infinite ease-in-out; }
.note-21 { left: 8%; top: 75%; animation: float-diagonal-1 26s infinite ease-in-out; }
.note-22 { left: 32%; top: 65%; animation: float-up 29s infinite ease-in; }
.note-23 { left: 48%; top: 75%; animation: float-diagonal-2 32s infinite ease-in-out; }
.note-24 { left: 62%; top: 12%; animation: float-up 24s infinite ease-in; }
.note-25 { left: 78%; top: 55%; animation: float-diagonal-3 27s infinite ease-in-out; }
.note-26 { left: 18%; top: 42%; animation: float-diagonal-1 30s infinite ease-in-out; }
.note-27 { left: 42%; top: 18%; animation: float-up 26s infinite ease-in; }
.note-28 { left: 58%; top: 68%; animation: float-diagonal-2 28s infinite ease-in-out; }
.note-29 { left: 88%; top: 35%; animation: float-up 31s infinite ease-in; }
.note-30 { left: 22%; top: 58%; animation: float-diagonal-3 25s infinite ease-in-out; }
.note-31 { left: 72%; top: 72%; animation: float-diagonal-1 29s infinite ease-in-out; }
.note-32 { left: 2%; top: 22%; animation: float-up 27s infinite ease-in; }
.note-33 { left: 52%; top: 5%; animation: float-diagonal-2 30s infinite ease-in-out; }
.note-34 { left: 92%; top: 48%; animation: float-up 26s infinite ease-in; }
.note-35 { left: 36%; top: 42%; animation: float-diagonal-3 28s infinite ease-in-out; }

@keyframes float-up {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0.12;
  }
  50% {
    opacity: 0.18;
  }
  100% {
    transform: translateY(-120vh) translateX(0);
    opacity: 0.05;
  }
}

@keyframes float-diagonal-1 {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0.12;
  }
  50% {
    opacity: 0.18;
  }
  100% {
    transform: translateY(-120vh) translateX(60px);
    opacity: 0.05;
  }
}

@keyframes float-diagonal-2 {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0.12;
  }
  50% {
    opacity: 0.18;
  }
  100% {
    transform: translateY(-120vh) translateX(-60px);
    opacity: 0.05;
  }
}

@keyframes float-diagonal-3 {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0.12;
  }
  25% {
    transform: translateY(30vh) translateX(40px);
    opacity: 0.18;
  }
  75% {
    transform: translateY(90vh) translateX(-40px);
    opacity: 0.15;
  }
  100% {
    transform: translateY(-120vh) translateX(0);
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
