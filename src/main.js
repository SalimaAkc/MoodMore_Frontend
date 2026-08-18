// ===================================================================
// MAIN APP ENTRY POINT
// ===================================================================

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

// ===================================================================
// APP INITIALIZATION
// ===================================================================

const app = createApp(App)

// setup store management
app.use(createPinia())

// ===================================================================
// AUTHENTICATION CHECK
// ===================================================================

// load user before routing starts
const auth = useAuthStore()

auth.loadUser().finally(() => {
  // setup router after user is loaded
  app.use(router)
  app.mount('#app')
})
