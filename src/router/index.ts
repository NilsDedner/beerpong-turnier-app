import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue') },
    { path: '/display', name: 'display', component: () => import('@/views/DisplayView.vue') },
  ],
})

export default router
