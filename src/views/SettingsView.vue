<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useLanguageStore } from '@/stores/language'
import { LANGUAGES } from '@/lib/translations'

// ===================================================================
// STORE SETUP
// ===================================================================

const settings = useSettingsStore()
const auth = useAuthStore()
const profileStore = useProfileStore()
const lang = useLanguageStore()
const router = useRouter()

// ===================================================================
// STATE - PROFILE
// ===================================================================

const editName = ref('')
const avatarUrl = ref('')
const saving = ref(false)
const uploading = ref(false)
const savedMessage = ref('')

// ===================================================================
// STATE - PASSWORD
// ===================================================================

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const passwordMessage = ref('')
const changingPassword = ref(false)

// ===================================================================
// STATE - EMAIL
// ===================================================================

const emailPassword = ref('')
const newEmail = ref('')
const emailError = ref('')
const emailMessage = ref('')
const changingEmail = ref(false)

// ===================================================================
// STATE - DELETE ACCOUNT
// ===================================================================

const deletePassword = ref('')
const confirmingDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

// ===================================================================
// PROFILE MANAGEMENT
// ===================================================================

function fillForm() {
  if (!profileStore.profile) return

  editName.value = profileStore.profile.full_name || ''
  avatarUrl.value = profileStore.profile.avatar_url || ''
}

function initial() {
  const name = editName.value || auth.user.email
  return name.charAt(0).toUpperCase()
}

async function pickPicture(event) {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  savedMessage.value = ''

  const newUrl = await profileStore.uploadAvatar(file, auth.user.id)

  if (newUrl) {
    avatarUrl.value = newUrl
  }

  uploading.value = false
}

async function saveProfile() {
  saving.value = true
  savedMessage.value = ''

  const ok = await profileStore.save(auth.user.id, editName.value.trim(), avatarUrl.value)

  if (ok) {
    savedMessage.value = lang.t('settings.saved')
  }

  saving.value = false
}

// ===================================================================
// LIFECYCLE
// ===================================================================

onMounted(fillForm)
watch(() => profileStore.profile, fillForm)

// ===================================================================
// PASSWORD MANAGEMENT
// ===================================================================

async function changePassword() {
  passwordError.value = ''
  passwordMessage.value = ''

  if (!currentPassword.value) {
    passwordError.value = lang.t('settings.passwordNeeded')
    return
  }

  if (newPassword.value.length < 6) {
    passwordError.value = lang.t('settings.passwordTooShort')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = lang.t('settings.passwordsDiffer')
    return
  }

  changingPassword.value = true

  try {
    const confirmed = await auth.reauthenticate(currentPassword.value)

    if (!confirmed) {
      passwordError.value = lang.t('settings.wrongPassword')
      return
    }

    await auth.updatePassword(newPassword.value)

    passwordMessage.value = lang.t('settings.passwordChanged')
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (error) {
    passwordError.value = error.message || lang.t('settings.passwordError')
  } finally {
    changingPassword.value = false
  }
}

// ===================================================================
// EMAIL MANAGEMENT
// ===================================================================

async function changeEmail() {
  emailError.value = ''
  emailMessage.value = ''

  const address = newEmail.value.trim()

  if (!address) {
    emailError.value = lang.t('settings.emailNeeded')
    return
  }

  if (!emailPassword.value) {
    emailError.value = lang.t('settings.passwordNeeded')
    return
  }

  changingEmail.value = true

  try {
    const confirmed = await auth.reauthenticate(emailPassword.value)

    if (!confirmed) {
      emailError.value = lang.t('settings.wrongPassword')
      return
    }

    await auth.updateEmail(address)

    emailMessage.value = lang.t('settings.emailSent')
    newEmail.value = ''
    emailPassword.value = ''
  } catch (error) {
    emailError.value = error.message || lang.t('settings.emailError')
  } finally {
    changingEmail.value = false
  }
}

// ===================================================================
// ACCOUNT DELETION
// ===================================================================

function askToDelete() {
  confirmingDelete.value = true
  deletePassword.value = ''
  deleteError.value = ''
}

function cancelDelete() {
  confirmingDelete.value = false
  deletePassword.value = ''
  deleteError.value = ''
}

async function removeAccount() {
  if (!deletePassword.value) {
    deleteError.value = lang.t('settings.passwordNeeded')
    return
  }

  deleting.value = true
  deleteError.value = ''

  try {
    const confirmed = await auth.reauthenticate(deletePassword.value)

    if (!confirmed) {
      deleteError.value = lang.t('settings.wrongPassword')
      deleting.value = false
      return
    }

    await auth.deleteAccount(deletePassword.value)
    router.push('/')
  } catch (error) {
    deleteError.value = error.message || lang.t('settings.deleteError')
    deleting.value = false
  }
}

// ===================================================================
// LOGOUT
// ===================================================================

async function logout() {
  await auth.signOut()
  router.push('/')
}
</script>

<template>
  <div class="page">
    <h1>{{ lang.t('settings.title') }}</h1>

    <section v-if="auth.user" class="card">
      <h2>{{ lang.t('settings.profile') }}</h2>

      <div class="picture-row">
        <div class="avatar">
          <img v-if="avatarUrl" :src="avatarUrl" alt="" />
          <span v-else>{{ initial() }}</span>
        </div>

        <!-- The real file input is hidden, the label is what you click -->
        <label class="pick">
          {{ uploading ? lang.t('settings.uploading') : lang.t('settings.changePicture') }}
          <input type="file" accept="image/*" :disabled="uploading" @change="pickPicture" />
        </label>
      </div>

      <label class="field">
        {{ lang.t('common.name') }}
        <input v-model="editName" type="text" maxlength="60" />
      </label>

      <p v-if="profileStore.errorMessage" class="error-box">{{ profileStore.errorMessage }}</p>

      <div class="actions">
        <button class="btn" :disabled="saving || uploading" @click="saveProfile">
          {{ saving ? lang.t('common.saving') : lang.t('settings.saveProfile') }}
        </button>
        <span v-if="savedMessage" class="saved">{{ savedMessage }}</span>
      </div>
    </section>

    <section class="card">
      <h2>{{ lang.t('settings.appearance') }}</h2>

      <div class="setting">
        <div class="text">
          <h3>{{ lang.t('settings.darkMode') }}</h3>
          <p>{{ lang.t('settings.darkModeHint') }}</p>
        </div>

        <label class="switch">
          <input v-model="settings.darkMode" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting language-row">
        <div class="text">
          <h3>{{ lang.t('settings.language') }}</h3>
          <p>{{ lang.t('settings.languageHint') }}</p>
        </div>

        <select v-model="lang.current" class="language-select">
          <option v-for="item in LANGUAGES" :key="item.code" :value="item.code">
            {{ item.name }}
          </option>
        </select>
      </div>
    </section>

    <section class="card">
      <h2>{{ lang.t('settings.playback') }}</h2>

      <div class="setting">
        <div class="text">
          <h3>{{ lang.t('settings.autoplay') }}</h3>
          <p>{{ lang.t('settings.autoplayHint') }}</p>
        </div>

        <!-- The label around the checkbox makes the switch clickable -->
        <label class="switch">
          <input v-model="settings.autoplay" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>
    </section>

    <section v-if="auth.user" class="card">
      <h2>{{ lang.t('settings.account') }}</h2>

      <div class="setting">
        <div class="text">
          <h3>{{ lang.t('settings.signedInAs') }}</h3>
          <p>{{ auth.user.email }}</p>
        </div>

        <button class="btn-outline" @click="logout">{{ lang.t('nav.logout') }}</button>
      </div>

      <div class="subsection">
        <h3>{{ lang.t('settings.changePassword') }}</h3>
        <p class="hint">{{ lang.t('settings.reauthHint') }}</p>

        <label class="field">
          {{ lang.t('settings.currentPassword') }}
          <input v-model="currentPassword" type="password" autocomplete="current-password" />
        </label>

        <label class="field">
          {{ lang.t('settings.newPassword') }}
          <input v-model="newPassword" type="password" autocomplete="new-password" />
        </label>

        <label class="field">
          {{ lang.t('settings.repeatPassword') }}
          <input v-model="confirmPassword" type="password" autocomplete="new-password" />
        </label>

        <p v-if="passwordError" class="error-box">{{ passwordError }}</p>

        <div class="actions">
          <button class="btn-outline" :disabled="changingPassword" @click="changePassword">
            {{ changingPassword ? lang.t('settings.changingPassword') : lang.t('settings.changePassword') }}
          </button>
          <span v-if="passwordMessage" class="saved">{{ passwordMessage }}</span>
        </div>
      </div>

      <div class="subsection">
        <h3>{{ lang.t('settings.changeEmail') }}</h3>
        <p class="hint">{{ lang.t('settings.emailHint') }}</p>

        <label class="field">
          {{ lang.t('settings.newEmail') }}
          <input v-model="newEmail" type="email" autocomplete="email" />
        </label>

        <label class="field">
          {{ lang.t('settings.currentPassword') }}
          <input v-model="emailPassword" type="password" autocomplete="current-password" />
        </label>

        <p v-if="emailError" class="error-box">{{ emailError }}</p>

        <div class="actions">
          <button class="btn-outline" :disabled="changingEmail" @click="changeEmail">
            {{ changingEmail ? lang.t('settings.sending') : lang.t('settings.changeEmail') }}
          </button>
          <span v-if="emailMessage" class="saved">{{ emailMessage }}</span>
        </div>
      </div>
    </section>

    <section v-if="auth.user" class="card danger-card">
      <h2>{{ lang.t('settings.dangerZone') }}</h2>

      <div class="setting">
        <div class="text">
          <h3>{{ lang.t('settings.deleteAccount') }}</h3>
          <p>{{ lang.t('settings.deleteHint') }}</p>
        </div>

        <button
          v-if="!confirmingDelete"
          class="btn-outline danger"
          @click="askToDelete"
        >
          {{ lang.t('settings.deleteAccount') }}
        </button>
      </div>

      <!-- Only after the button is pressed, so the password field is not
           sitting there inviting anybody to fill it in -->
      <form v-if="confirmingDelete" class="confirm-delete" @submit.prevent="removeAccount">
        <p class="warning">{{ lang.t('settings.confirmDelete') }}</p>

        <label class="field">
          {{ lang.t('settings.currentPassword') }}
          <input v-model="deletePassword" type="password" autocomplete="current-password" />
        </label>

        <div class="actions">
          <button class="btn-outline danger" type="submit" :disabled="deleting">
            {{ deleting ? lang.t('settings.deleting') : lang.t('settings.confirmDeleteButton') }}
          </button>

          <button class="btn-outline" type="button" :disabled="deleting" @click="cancelDelete">
            {{ lang.t('common.cancel') }}
          </button>
        </div>
      </form>

      <p v-if="deleteError" class="error-box delete-error">{{ deleteError }}</p>
    </section>

    <p class="note">{{ lang.t('settings.note') }}</p>
  </div>
</template>

<style scoped>
.page {
  max-width: 700px;
  margin: 0 auto;
  padding: 40px 24px;
}

h1 {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 24px;
}

.card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
}

.card h2 {
  font-size: 1.05rem;
  color: var(--orange);
  margin-bottom: 18px;
}

.setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.text h3 {
  font-family: 'Work Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 3px;
}

.text p {
  color: var(--ink-soft);
  font-size: 0.88rem;
}

/* The language row sits under the dark mode switch */
.language-row {
  border-top: 1px solid var(--rule);
  margin-top: 20px;
  padding-top: 20px;
}

.language-select {
  background: var(--paper);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 9px 12px;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
}

.language-select:focus {
  outline: none;
  border-color: var(--orange);
}

/* Change password and change email, under the account details */
.subsection {
  border-top: 1px solid var(--rule);
  margin-top: 22px;
  padding-top: 22px;
}

.subsection h3 {
  font-family: 'Work Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.hint {
  color: var(--ink-soft);
  font-size: 0.85rem;
  margin-bottom: 14px;
}

.danger-card {
  border-color: var(--danger-border);
}

.danger-card h2 {
  color: var(--red);
}

.danger {
  color: var(--red);
  border-color: var(--danger-border);
  white-space: nowrap;
}

.delete-error {
  margin-top: 16px;
}

/* The panel that asks for the password before deleting */
.confirm-delete {
  border-top: 1px solid var(--danger-border);
  margin-top: 20px;
  padding-top: 20px;
}

.confirm-delete .warning {
  color: var(--ink);
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.note {
  color: var(--ink-soft);
  font-size: 0.85rem;
  text-align: center;
  margin-top: 28px;
}

/* The profile picture and the button next to it */
.picture-row {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--card-2);
  border: 1px solid var(--rule);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 1.8rem;
  color: var(--ink-soft);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* The file input itself is hidden, the label is the button */
.pick {
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 9px 18px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.pick:hover {
  background: var(--card-2);
}

.pick input {
  display: none;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-soft);
}

.field input {
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 11px;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
}

.field input:focus {
  border-color: var(--orange);
}

.actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.saved {
  color: var(--green);
  font-size: 0.88rem;
  font-weight: 600;
}

/* The checkbox is hidden and we draw our own switch next to it */
.switch {
  position: relative;
  width: 50px;
  height: 27px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background: var(--rule);
  border-radius: 27px;
  cursor: pointer;
  transition: background 0.2s;
}

/* The round knob */
.slider::before {
  content: '';
  position: absolute;
  width: 19px;
  height: 19px;
  left: 4px;
  bottom: 4px;
  background: var(--on-accent);
  border-radius: 50%;
  transition: transform 0.2s;
}

/* Means the slider right after a ticked checkbox */
input:checked + .slider {
  background: var(--orange);
}

input:checked + .slider::before {
  transform: translateX(23px);
}

/* Show a ring when reached with the Tab key */
input:focus-visible + .slider {
  outline: 2px solid var(--orange);
  outline-offset: 2px;
}
</style>
