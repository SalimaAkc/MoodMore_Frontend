// start the Vue app

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())

// check if user is logged in first, so router waits
const auth = useAuthStore()

auth.loadUser().finally(() => {
  app.use(router)
  app.mount('#app')
})
