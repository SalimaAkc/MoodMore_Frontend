<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLanguageStore } from '@/stores/language'

// ===================================================================
// STORE SETUP
// ===================================================================

const auth = useAuthStore()
const lang = useLanguageStore()

// ===================================================================
// STATE
// ===================================================================

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const errorMessage = ref('')

// ===================================================================
// ACTIONS
// ===================================================================

async function sendLink() {
  errorMessage.value = ''
  loading.value = true

  try {
    await auth.sendPasswordReset(email.value.trim())
    sent.value = true
  } catch (error) {
    errorMessage.value = lang.t('forgot.error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- =================================================================
       PAGE - Password reset request
       ================================================================= -->
  <div class="page">
    <!-- SUCCESS SCREEN -->
    <div v-if="sent" class="card">
      <h1>{{ lang.t('forgot.sentTitle') }}</h1>
      <p class="subtitle">{{ lang.t('forgot.sentBody') }}</p>

      <p class="bottom">
        <RouterLink to="/login">{{ lang.t('forgot.backToLogin') }}</RouterLink>
      </p>
    </div>

    <!-- FORM SCREEN -->
    <form v-else class="card" @submit.prevent="sendLink">
      <h1>{{ lang.t('forgot.title') }}</h1>
      <p class="subtitle">{{ lang.t('forgot.subtitle') }}</p>

      <p v-if="errorMessage" class="error-box">{{ errorMessage }}</p>

      <label>
        {{ lang.t('common.email') }}
        <input v-model="email" type="email" required autocomplete="email" />
      </label>

      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? lang.t('forgot.busy') : lang.t('forgot.button') }}
      </button>

      <p class="bottom">
        <RouterLink to="/login">{{ lang.t('forgot.backToLogin') }}</RouterLink>
      </p>
    </form>
  </div>
</template>

<style scoped>
/* ===================================================================
   PAGE - Layout
   =================================================================== */

.page {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

/* ===================================================================
   CARD - Form container
   =================================================================== */

.card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 400px;
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 16px;
  padding: 36px 32px;
}

h1 {
  font-size: 1.6rem;
  font-weight: 700;
  text-align: center;
}

.subtitle {
  color: var(--ink-soft);
  font-size: 0.9rem;
  text-align: center;
  margin-top: -10px;
}

/* ===================================================================
   FORM ELEMENTS
   =================================================================== */

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-soft);
}

input {
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 12px;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
}

input:focus {
  border-color: var(--orange);
}

/* ===================================================================
   LINKS
   =================================================================== */

.bottom {
  text-align: center;
  color: var(--ink-soft);
  font-size: 0.9rem;
}

.bottom a {
  color: var(--orange);
  font-weight: 600;
}
</style>
