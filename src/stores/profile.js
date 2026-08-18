// ===================================================================
// PROFILE STORE - User profile management
// ===================================================================

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useLanguageStore } from '@/stores/language'

// ===================================================================
// CONFIGURATION
// ===================================================================

const COLUMNS = 'id, email, full_name, avatar_url, created_at'

export const useProfileStore = defineStore('profile', () => {
  // ===================================================================
  // STATE
  // ===================================================================

  const lang = useLanguageStore()

  const profile = ref(null)
  const loading = ref(false)
  const errorMessage = ref('')

  // ===================================================================
  // PUBLIC API
  // ===================================================================

  // load user profile
  async function load(userId) {
    loading.value = true
    errorMessage.value = ''

    const result = await supabase
      .from('profiles')
      .select(COLUMNS)
      .eq('id', userId)
      .maybeSingle()

    if (result.error) {
      errorMessage.value = lang.t('profile.loadError')
    } else {
      profile.value = result.data
    }

    loading.value = false
  }

  // save name and picture
  async function save(userId, fullName, avatarUrl) {
    errorMessage.value = ''

    const result = await supabase
      .from('profiles')
      .update({ full_name: fullName, avatar_url: avatarUrl })
      .eq('id', userId)
      .select(COLUMNS)
      .single()

    if (result.error) {
      errorMessage.value = lang.t('profile.saveError')
      return false
    }

    profile.value = result.data
    return true
  }

  // upload a picture (stored in user folder)
  async function uploadAvatar(file, userId) {
    errorMessage.value = ''

    const parts = file.name.split('.')
    const extension = parts[parts.length - 1].toLowerCase()
    const filePath = userId + '/avatar.' + extension

    const uploadResult = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadResult.error) {
      errorMessage.value = lang.t('profile.uploadError')
      return null
    }

    const urlResult = supabase.storage.from('avatars').getPublicUrl(filePath)

    // add timestamp so browser loads new image (not cached old one)
    return urlResult.data.publicUrl + '?t=' + Date.now()
  }

  // clear when user logs out
  function reset() {
    profile.value = null
    errorMessage.value = ''
  }

  return {
    profile,
    loading,
    errorMessage,
    load,
    save,
    uploadAvatar,
    reset
  }
})
