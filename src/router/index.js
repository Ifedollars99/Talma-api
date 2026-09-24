import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../components/HomePage.vue')
  },
  {
    path: '/signup',
    component: () => import('../views/SignUpPage.vue')
  },
  {
    path: '/signin',
    component: () => import('../views/SignInPage.vue')
  },
  {
    path: '/mycamp',
    component: () => import('../views/MycampPage.vue')
  },
  {
    path: '/myprofile',
    component: () => import('../views/MyprofilePage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
