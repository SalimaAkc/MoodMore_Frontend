// ===================================================================
// FAVORITES STORE - Manage liked songs
// ===================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { FAVORITES_MOOD } from '@/lib/moods'
import { useLanguageStore } from '@/stores/language'

export const useFavoritesStore = defineStore('favorites', () => {
  // ===================================================================
  // STATE
  // ===================================================================

  const lang = useLanguageStore()

  const playlist = ref(null)
  const tracks = ref([])
  const errorMessage = ref('')

  // ===================================================================
  // COMPUTED
  // ===================================================================

  // fast lookup for favorites
  const favoriteIds = computed(() => {
    const ids = new Set()

    tracks.value.forEach((track) => {
      ids.add(track.videoId)
    })

    return ids
  })

  // check if a track is liked
  function isFavorite(videoId) {
    return favoriteIds.value.has(videoId)
  }

  // load favorites when user logs in
  async function load(userId) {
    const result = await supabase
      .from('playlists')
      .select('id, songs')
      .eq('user_id', userId)
      .eq('mood_id', FAVORITES_MOOD.id)
      .maybeSingle()

    if (result.error) {
      errorMessage.value = lang.t('favourites.loadError')
      return
    }

    playlist.value = result.data

    if (result.data && result.data.songs) {
      tracks.value = result.data.songs
    } else {
      tracks.value = []
    }
  }

  // do saves one at a time (prevent overwrites)
  let saveQueue = Promise.resolve()

  function toggle(track, userId) {
    saveQueue = saveQueue.then(() => save(track, userId))
    return saveQueue
  }

  // add or remove a track from favorites
  async function save(track, userId) {
    const wasFavorite = isFavorite(track.videoId)
    const oldTracks = tracks.value

    // update UI right away for speed
    if (wasFavorite) {
      tracks.value = tracks.value.filter(item => item.videoId !== track.videoId)
    } else {
      tracks.value = tracks.value.concat([track])
    }

    errorMessage.value = ''

    let error = null

    if (playlist.value) {
      // update existing favorites playlist
      const result = await supabase
        .from('playlists')
        .update({ songs: tracks.value })
        .eq('id', playlist.value.id)

      error = result.error
    } else {
      // create favorites playlist for the first time
      const result = await supabase
        .from('playlists')
        .insert({
          user_id: userId,
          mood_id: FAVORITES_MOOD.id,
          name: 'My Favorites',
          songs: tracks.value
        })
        .select('id, songs')
        .single()

      error = result.error

      if (!error) {
        playlist.value = result.data
      }
    }

    // undo if save failed
    if (error) {
      tracks.value = oldTracks
      errorMessage.value = lang.t('favourites.saveError')
    }
  }

  // clear when user logs out
  function reset() {
    playlist.value = null
    tracks.value = []
    errorMessage.value = ''
  }

  return {
    playlist,
    tracks,
    errorMessage,
    isFavorite,
    load,
    toggle,
    reset
  }
})
