<!-- ===================================================================
     PASSWORD INPUT - Password field with a show/hide eye button
     =================================================================== -->

<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref } from 'vue'
import { useLanguageStore } from '@/stores/language'

// ===================================================================
// STORE SETUP
// ===================================================================

const lang = useLanguageStore()

// ===================================================================
// PROPS - Everything the parent can pass in
// ===================================================================

const password = defineModel({ type: String, default: '' })

defineProps({
  autocomplete: { type: String, default: 'current-password' },
  required: { type: Boolean, default: false },
  minlength: { type: [String, Number], default: null }
})

// ===================================================================
// STATE
// ===================================================================

// false = dots, true = readable text
const visible = ref(false)

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

function toggle() {
  visible.value = !visible.value
}

function buttonLabel() {
  return visible.value
    ? lang.t('common.hidePassword')
    : lang.t('common.showPassword')
}
</script>

<template>
  <div class="password-input">
    <input
      v-model="password"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :required="required"
      :minlength="minlength"
    />

    <!-- the eye button sits on top of the right side of the input -->
    <button
      type="button"
      class="eye"
      :title="buttonLabel()"
      :aria-label="buttonLabel()"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
           stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round">
        <!-- the eye shape -->
        <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.6" />

        <!-- a line through the eye when the password is visible -->
        <line v-if="visible" x1="4" y1="20" x2="20" y2="4" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* ===================================================================
   WRAPPER - Holds the input and the eye button
   =================================================================== */

.password-input {
  position: relative;
  display: flex;
}

/* ===================================================================
   INPUT - Same look as the other fields, with room for the button
   =================================================================== */

input {
  width: 100%;
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 12px;
  padding-right: 44px;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
}

input:focus {
  border-color: var(--orange);
}

/* ===================================================================
   EYE BUTTON - Show or hide the password
   =================================================================== */

.eye {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  color: var(--ink-soft);
  padding: 0;
  opacity: 0.55;
  transition: opacity 0.15s;
}

.eye:hover {
  opacity: 1;
}

.eye:focus-visible {
  outline: 2px solid var(--orange);
  outline-offset: -2px;
}
</style>
