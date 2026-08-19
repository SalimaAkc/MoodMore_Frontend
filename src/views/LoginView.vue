<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLanguageStore } from '@/stores/language'
import PasswordInput from '@/components/PasswordInput.vue'

// ===================================================================
// STORE SETUP
// ===================================================================

const auth = useAuthStore()
const lang = useLanguageStore()
const router = useRouter()
const route = useRoute()

// ===================================================================
// STATE
// ===================================================================

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

function isSafeAddress(address) {
  if (typeof address !== 'string') return false
  if (!address.startsWith('/')) return false

  if (address.startsWith('//')) return false

  return true
}

// ===================================================================
// AUTHENTICATION
// ===================================================================

async function login() {
  errorMessage.value = ''
  loading.value = true

  try {
    await auth.signIn(email.value, password.value)

    const next = route.query.next

    if (isSafeAddress(next)) {
      router.push(next)
    } else {
      router.push('/')
    }
  } catch (error) {
    errorMessage.value = lang.t('login.wrong')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- =================================================================
       PAGE - Login form container
       ================================================================= -->
  <div class="page">
    <form class="card" @submit.prevent="login">
      <!-- HEADER -->
      <h1>{{ lang.t('login.title') }}</h1>
      <p class="subtitle">{{ lang.t('login.subtitle') }}</p>

      <!-- ERRORS -->
      <p v-if="errorMessage" class="error-box">{{ errorMessage }}</p>

      <!-- FORM FIELDS -->
      <label>
        {{ lang.t('common.email') }}
        <input v-model="email" type="email" required autocomplete="email" />
      </label>

      <label>
        {{ lang.t('common.password') }}
        <PasswordInput v-model="password" required autocomplete="current-password" />
      </label>

      <!-- SUBMIT BUTTON -->
      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? lang.t('login.busy') : lang.t('login.button') }}
      </button>

      <!-- LINKS -->
      <p class="bottom">
        <RouterLink to="/forgot-password">{{ lang.t('login.forgot') }}</RouterLink>
      </p>

      <p class="bottom">
        {{ lang.t('login.noAccount') }}
        <RouterLink to="/signup">{{ lang.t('nav.signup') }}</RouterLink>
      </p>
    </form>
  </div>
</template>

<style scoped>
/* ===================================================================
   PAGE - Layout and centering
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
   FORM ELEMENTS - Labels and inputs
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
   LINKS - Bottom helper links
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
