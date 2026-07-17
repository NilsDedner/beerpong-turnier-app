import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // Standardmäßig landet man auf dem Display.
    { path: '/', redirect: '/display' },
    { path: '/display', name: 'display', component: () => import('@/views/DisplayView.vue') },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/display' },
  ],
})

export default router
