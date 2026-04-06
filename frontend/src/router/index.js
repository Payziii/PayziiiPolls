import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Мои опросы' },
    },
    {
      path: '/create',
      name: 'create',
      component: () => import('../views/CreateSurveyView.vue'),
      meta: { title: 'Создать опрос' },
    },
    {
      path: '/survey/:id',
      name: 'survey-detail',
      component: () => import('../views/SurveyDetailView.vue'),
      meta: { title: 'Детали опроса' },
    },
    {
      path: '/survey/:id/stats',
      name: 'survey-stats',
      component: () => import('../views/SurveyStatsView.vue'),
      meta: { title: 'Статистика' },
    },
    {
      path: '/take/:id',
      name: 'take-survey',
      component: () => import('../views/TakeSurveyView.vue'),
      meta: { title: 'Пройти опрос' },
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'PayziiiPolls'} - Опросы`
  next()
})

export default router
