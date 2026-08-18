<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLanguageStore } from '@/stores/language'

// ===================================================================
// STORE SETUP
// ===================================================================

const auth = useAuthStore()
const lang = useLanguageStore()
const router = useRouter()

// ===================================================================
// STATE
// ===================================================================

const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

// ===================================================================
// AUTHENTICATION
// ===================================================================

async function signup() {
  errorMessage.value = ''
  loading.value = true

  try {
    await auth.signUp(email.value, password.value, name.value)
    router.push('/')
  } catch (error) {
    errorMessage.value = error.message || lang.t('signup.failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- =================================================================
       PAGE - Signup form container
       ================================================================= -->
  <div class="page">
    <form class="card" @submit.prevent="signup">
      <!-- HEADER -->
      <h1>{{ lang.t('signup.title') }}</h1>
      <p class="subtitle">{{ lang.t('signup.subtitle') }}</p>

      <!-- ERRORS -->
      <p v-if="errorMessage" class="error-box">{{ errorMessage }}</p>

      <!-- FORM FIELDS -->
      <label>
        {{ lang.t('common.name') }}
        <input v-model="name" type="text" required autocomplete="name" />
      </label>

      <label>
        {{ lang.t('common.email') }}
        <input v-model="email" type="email" required autocomplete="email" />
      </label>

      <label>
        {{ lang.t('common.password') }}
        <input v-model="password" type="password" required minlength="6" autocomplete="new-password" />
      </label>

      <!-- SUBMIT BUTTON -->
      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? lang.t('signup.busy') : lang.t('signup.button') }}
      </button>

      <!-- LINKS -->
      <p class="bottom">
        {{ lang.t('signup.haveAccount') }}
        <RouterLink to="/login">{{ lang.t('nav.login') }}</RouterLink>
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
