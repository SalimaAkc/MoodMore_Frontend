// ===================================================================
// SETTINGS STORE - User preferences
// ===================================================================

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// ===================================================================
// CONFIGURATION
// ===================================================================

const STORAGE_KEY = 'moodandmore-settings'

// ===================================================================
// HELPERS
// ===================================================================

// load settings from storage
function loadSaved() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY)
    return JSON.parse(rawData) || {}
  } catch (error) {
    return {}
  }
}

// apply theme to page
function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

// ===================================================================
// STORE SETUP
// ===================================================================

export const useSettingsStore = defineStore('settings', () => {
  const saved = loadSaved()

  // ===================================================================
  // STATE
  // ===================================================================

  let startAutoplay = true
  if (saved.autoplay !== undefined) {
    startAutoplay = saved.autoplay
  }

  let startDark = false
  if (saved.darkMode !== undefined) {
    startDark = saved.darkMode
  }

  const autoplay = ref(startAutoplay)
  const darkMode = ref(startDark)

  applyTheme(darkMode.value)

  // ===================================================================
  // PERSISTENCE
  // ===================================================================

  // save settings
  function saveSettings() {
    try {
      const settings = {
        autoplay: autoplay.value,
        darkMode: darkMode.value
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      // private mode blocks storage but settings still work
    }
  }

  watch(autoplay, saveSettings)

  watch(darkMode, (value) => {
    applyTheme(value)
    saveSettings()
  })

  return { autoplay, darkMode }
})
