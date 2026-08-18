// ===================================================================
// LANGUAGE STORE - Multilingual support
// ===================================================================

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { TRANSLATIONS } from '@/lib/translations'

// ===================================================================
// CONFIGURATION
// ===================================================================

const STORAGE_KEY = 'moodandmore-language'
const DEFAULT_LANGUAGE = 'en'

// ===================================================================
// HELPERS
// ===================================================================

// load language preference
function loadSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved && TRANSLATIONS[saved]) {
      return saved
    }
  } catch (error) {
    // private mode blocks storage
  }

  return DEFAULT_LANGUAGE
}

// ===================================================================
// STORE SETUP
// ===================================================================

export const useLanguageStore = defineStore('language', () => {
  const current = ref(loadSaved())

  // set page language
  document.documentElement.setAttribute('lang', current.value)

  // ===================================================================
  // PUBLIC API - Translation function
  // ===================================================================

  // translate text with variable replacement
  function t(key, values) {
    const table = TRANSLATIONS[current.value] || TRANSLATIONS[DEFAULT_LANGUAGE]

    let text = table[key]

    if (text === undefined) {
      text = TRANSLATIONS[DEFAULT_LANGUAGE][key]
    }

    if (text === undefined) {
      return key
    }

    // replace {placeholders} with actual values
    if (values) {
      for (const name in values) {
        text = text.replace('{' + name + '}', values[name])
      }
    }

    return text
  }

  watch(current, (value) => {
    document.documentElement.setAttribute('lang', value)

    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch (error) {
      // Private mode can block storage
    }
  })

  return { current, t }
})
