// user preferences (saved locally, not in account)

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'moodandmore-settings'

// load settings from browser
function loadSaved() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY)
    return JSON.parse(rawData) || {}
  } catch (error) {
    return {}
  }
}

// set theme on html element (CSS reads this)
function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const saved = loadSaved()

  // check for false specifically (not undefined)
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

  // apply dark mode right away if it was saved
  applyTheme(darkMode.value)

  // save settings to browser
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
