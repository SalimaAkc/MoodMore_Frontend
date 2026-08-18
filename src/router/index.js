// ===================================================================
// ROUTER - PAGE NAVIGATION
// ===================================================================

import { createWebHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ===================================================================
// PAGE IMPORTS
// ===================================================================

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

// ===================================================================
// ROUTE DEFINITIONS
// ===================================================================

const routes = [
  // public pages (no login required)
  { path: '/', component: HomeView },
  { path: '/mood/:name', component: MoodView },
  { path: '/search', component: SearchView },

  // auth pages (no login needed)
  { path: '/login', component: LoginView },
  { path: '/signup', component: SignupView },
  { path: '/forgot-password', component: ForgotPasswordView },
  { path: '/reset-password', component: ResetPasswordView },

  // settings (browser storage only)
  { path: '/settings', component: SettingsView },

  // protected pages (login required)
  { path: '/profile', component: ProfileView, meta: { needsLogin: true } },
  { path: '/collection', component: CollectionView, meta: { needsLogin: true } },
  { path: '/playlist/:id', component: PlaylistView, meta: { needsLogin: true } },

  // catch-all
  { path: '/:notFound(.*)', redirect: '/' }
]

// ===================================================================
// ROUTER CONFIGURATION
// ===================================================================

const router = createRouter({
  history: createWebHistory(),
  routes: routes,

  scrollBehavior() {
    return { top: 0 }
  }
})

// ===================================================================
// ROUTE GUARDS
// ===================================================================

// check login before navigating
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.needsLogin && !auth.user) {
    return {
      path: '/login',
      query: { next: to.fullPath }
    }
  }

  return true
})

export default router
