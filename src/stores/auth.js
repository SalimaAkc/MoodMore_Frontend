// keep track of who's logged in

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { deleteFromApi } from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  // watch for login/logout (works even in other tabs)
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      user.value = session.user
    } else {
      user.value = null
    }
  })

  // load user when app starts
  async function loadUser() {
    const result = await supabase.auth.getSession()

    if (result.data.session) {
      user.value = result.data.session.user
    } else {
      user.value = null
    }
  }

  // make a new account
  async function signUp(email, password, name) {
    const result = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { full_name: name }
      }
    })

    if (result.error) {
      throw result.error
    }
  }

  // log in
  async function signIn(email, password) {
    const result = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (result.error) {
      throw result.error
    }
  }

  // log out
  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
  }

  // check the password is right (for before doing dangerous stuff)
  async function reauthenticate(password) {
    if (!user.value) return false

    const result = await supabase.auth.signInWithPassword({
      email: user.value.email,
      password: password
    })

    return !result.error
  }

  // send a password reset email
  async function sendPasswordReset(email) {
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    })

    if (result.error) {
      throw result.error
    }
  }

  // change password
  async function updatePassword(newPassword) {
    const result = await supabase.auth.updateUser({ password: newPassword })

    if (result.error) {
      throw result.error
    }
  }

  // change email (user has to confirm from new email)
  async function updateEmail(newEmail) {
    const result = await supabase.auth.updateUser({ email: newEmail })

    if (result.error) {
      throw result.error
    }
  }

  // delete account (backend checks password)
  async function deleteAccount(password) {
    const sessionResult = await supabase.auth.getSession()

    if (!sessionResult.data.session) {
      throw new Error('You are not logged in.')
    }

    await deleteFromApi('/api/account', sessionResult.data.session.access_token, {
      password: password
    })

    await supabase.auth.signOut()
    user.value = null
  }

  // get the name to show in navbar
  function displayName() {
    if (!user.value) return ''

    const metadata = user.value.user_metadata

    if (metadata && metadata.full_name) {
      return metadata.full_name
    }

    return user.value.email
  }

  return {
    user,
    loadUser,
    signUp,
    signIn,
    signOut,
    reauthenticate,
    sendPasswordReset,
    updatePassword,
    updateEmail,
    deleteAccount,
    displayName
  }
})
