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
  },
  {
    path: '/hubs/campus-news',
    name: 'CampusNews',
    component: () => import('../views/CampusNewsPage.vue')
  },
  {
    path: '/hubs/aspirant',
    name: 'AspirantHub',
    component: () => import('../views/AspirantPage.vue')
  },
  {
    path: '/hubs/siwes',
    name: 'SiwesHub',
    component: () => import('../views/SiwesPage.vue')
  },
  {
    path: '/hubs/academic',
    name: 'AcademicHub',
    component: () => import('../views/AcademicHubPage.vue')
  },
  {
    path: '/hubs/final-year',
    name: 'FinalYearHub',
    component: () => import('../views/FinalYearPage.vue')
  },
  {
    path: '/hubs/know-your-school',
    name: 'KnowYourSchool',
    component: () => import('../views/KnowYourSchoolPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
