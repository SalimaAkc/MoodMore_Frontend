// app pages and routes

import { createWebHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HomeView from '@/views/HomeView.vue'
import MoodView from '@/views/MoodView.vue'
import SearchView from '@/views/SearchView.vue'
import LoginView from '@/views/LoginView.vue'
import SignupView from '@/views/SignupView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/ResetPasswordView.vue'
import CollectionView from '@/views/CollectionView.vue'
import ProfileView from '@/views/ProfileView.vue'
import PlaylistView from '@/views/PlaylistView.vue'
import SettingsView from '@/views/SettingsView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/mood/:name', component: MoodView },
  { path: '/search', component: SearchView },
  { path: '/login', component: LoginView },
  { path: '/signup', component: SignupView },

  // no login needed for these (the link in email proves who you are)
  { path: '/forgot-password', component: ForgotPasswordView },
  { path: '/reset-password', component: ResetPasswordView },

  // settings are stored in this browser only
  { path: '/settings', component: SettingsView },

  // these pages need to be logged in
  { path: '/profile', component: ProfileView, meta: { needsLogin: true } },
  { path: '/collection', component: CollectionView, meta: { needsLogin: true } },
  { path: '/playlist/:id', component: PlaylistView, meta: { needsLogin: true } },

  // anything else goes home
  { path: '/:notFound(.*)', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes: routes,

  // scroll to top on new page
  scrollBehavior() {
    return { top: 0 }
  }
})

// check before changing pages
router.beforeEach((to) => {
  const auth = useAuthStore()

  // if page needs login, send to login first
  if (to.meta.needsLogin && !auth.user) {
    return {
      path: '/login',
      query: { next: to.fullPath }
    }
  }

  return true
})

export default router
