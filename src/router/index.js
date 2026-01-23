import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import MetersView from '@/views/MetersView.vue'
import MeterDetailView from '@/views/MeterDetailView.vue'
import SettingsView from '@/views/SettingsView.vue'
import OAuthCallback from '@/components/OAuthCallback.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard' }
    },
    {
      path: '/meters',
      name: 'meters',
      component: MetersView,
      meta: { title: 'Zähler' }
    },
    {
      path: '/meters/:id',
      name: 'meter-detail',
      component: MeterDetailView,
      meta: { title: 'Zählerdetails' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { title: 'Einstellungen' }
    },
    {
      path: '/auth/callback',
      name: 'oauth-callback',
      component: OAuthCallback,
      meta: { title: 'Completing Sign-in' }
    },
    {
      path: '/launch',
      name: 'launch',
      component: () => import('@/views/LaunchView.vue'),
      meta: { title: 'Launching...' }
    }
  ]
})

// Update document title
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - StatHaus` : 'StatHaus'
})

export default router