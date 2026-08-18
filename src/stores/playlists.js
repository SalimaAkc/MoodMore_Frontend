// ===================================================================
// PLAYLISTS STORE - User playlist management
// ===================================================================

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { CUSTOM_MOOD, FAVORITES_MOOD } from '@/lib/moods'

export const usePlaylistsStore = defineStore('playlists', () => {
  // ===================================================================
  // STATE
  // ===================================================================

  const list = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  // ===================================================================
  // PUBLIC API
  // ===================================================================

  // load user playlists
  async function load(userId) {
    loading.value = true

    const result = await supabase
      .from('playlists')
      .select('id, name, mood_id')
      .eq('user_id', userId)
      .neq('mood_id', FAVORITES_MOOD.id)
      .order('created_at', { ascending: false })

    loading.value = false

    if (result.error) {
      return false
    }

    list.value = result.data
    loaded.value = true
    return true
  }

  // add one song to a playlist
  // returns 'added', 'duplicate' or 'error'
  async function addTrack(playlistId, track) {
    // get the current songs first
    const readResult = await supabase
      .from('playlists')
      .select('songs')
      .eq('id', playlistId)
      .maybeSingle()

    if (readResult.error || !readResult.data) {
      return 'error'
    }

    const songs = readResult.data.songs || []

    // don't add the same song twice
    const alreadyThere = songs.some(song => song.videoId === track.videoId)

    if (alreadyThere) {
      return 'duplicate'
    }

    const writeResult = await supabase
      .from('playlists')
      .update({ songs: songs.concat([track]) })
      .eq('id', playlistId)

    if (writeResult.error) {
      return 'error'
    }

    return 'added'
  }

  // make a new playlist with one song
  async function createWithTrack(name, track, userId, isPublic = false) {
    const result = await supabase
      .from('playlists')
      .insert({
        user_id: userId,
        mood_id: CUSTOM_MOOD.id,
        name: name,
        songs: [track],
        is_public: isPublic
      })
      .select('id, name, mood_id')
      .single()

    if (result.error) {
      return 'error'
    }

    // add to list (newest first)
    list.value = [result.data].concat(list.value)
    return 'added'
  }

  // clear when user logs out
  function reset() {
    list.value = []
    loaded.value = false
  }

  return {
    list,
    loading,
    loaded,
    load,
    addTrack,
    createWithTrack,
    reset
  }
})
