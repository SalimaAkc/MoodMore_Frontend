<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useLanguageStore } from '@/stores/language'
import PasswordInput from '@/components/PasswordInput.vue'

// ===================================================================
// STORE SETUP
// ===================================================================

const auth = useAuthStore()
const lang = useLanguageStore()
const router = useRouter()

// ===================================================================
// STATE
// ===================================================================

const checking = ref(true)
const hasSession = ref(false)

const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const saving = ref(false)
const done = ref(false)

// ===================================================================
// LIFECYCLE
// ===================================================================

onMounted(async () => {
  const result = await supabase.auth.getSession()
  hasSession.value = Boolean(result.data.session)
  checking.value = false
})

watch(() => auth.user, (user) => {
  if (user) {
    hasSession.value = true
  }
})

// ===================================================================
// ACTIONS
// ===================================================================

async function savePassword() {
  errorMessage.value = ''

  if (newPassword.value.length < 6) {
    errorMessage.value = lang.t('settings.passwordTooShort')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = lang.t('settings.passwordsDiffer')
    return
  }

  saving.value = true

  try {
    await auth.updatePassword(newPassword.value)
    done.value = true

    setTimeout(() => router.push('/'), 1500)
  } catch (error) {
    errorMessage.value = error.message || lang.t('settings.passwordError')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- =================================================================
       PAGE - Password reset
       ================================================================= -->
  <div class="page">
    <!-- LOADING -->
    <div v-if="checking" class="card">
      <p class="empty-message">{{ lang.t('common.loading') }}</p>
    </div>

    <!-- EXPIRED OR INVALID LINK -->
    <div v-else-if="!hasSession" class="card">
      <h1>{{ lang.t('reset.expiredTitle') }}</h1>
      <p class="subtitle">{{ lang.t('reset.expiredBody') }}</p>

      <RouterLink to="/forgot-password" class="btn">{{ lang.t('reset.askAgain') }}</RouterLink>
    </div>

    <!-- SUCCESS -->
    <div v-else-if="done" class="card">
      <h1>{{ lang.t('reset.doneTitle') }}</h1>
      <p class="subtitle">{{ lang.t('reset.doneBody') }}</p>
    </div>

    <!-- PASSWORD RESET FORM -->
    <form v-else class="card" @submit.prevent="savePassword">
      <h1>{{ lang.t('reset.title') }}</h1>
      <p class="subtitle">{{ lang.t('reset.subtitle') }}</p>

      <p v-if="errorMessage" class="error-box">{{ errorMessage }}</p>

      <label>
        {{ lang.t('settings.newPassword') }}
        <PasswordInput v-model="newPassword" required minlength="6" autocomplete="new-password" />
      </label>

      <label>
        {{ lang.t('settings.repeatPassword') }}
        <PasswordInput v-model="confirmPassword" required minlength="6" autocomplete="new-password" />
      </label>

      <button class="btn" type="submit" :disabled="saving">
        {{ saving ? lang.t('common.saving') : lang.t('reset.button') }}
      </button>
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

.card .btn {
  text-align: center;
  text-decoration: none;
}
</style>
