<template>
  <div class="container container-md">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Мои опросы</h1>
        <p class="text-secondary">Управляйте и отслеживайте ваши опросы</p>
      </div>
      <RouterLink to="/create" class="btn btn-primary btn-lg">
        <span>➕</span> Создать опрос
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center mt-4">
      <div class="spinner"></div>
      <p class="text-secondary mt-2">Загрузка опросов...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="surveys.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h2>Нет опросов</h2>
      <p class="text-secondary">Вы еще не создали ни одного опроса.</p>
      <RouterLink to="/create" class="btn btn-primary">
        Создать первый опрос
      </RouterLink>
    </div>

    <!-- Surveys Grid -->
    <div v-else class="surveys-grid">
      <div v-for="survey in surveys" :key="survey.id" class="survey-card">
        <div class="card-header">
          <h3>{{ survey.title }}</h3>
          <div class="survey-status" :class="survey.is_active ? 'active' : 'inactive'">
            {{ survey.is_active ? '🟢 Активный' : '🔴 Неактивный' }}
          </div>
        </div>

        <p class="survey-description" v-if="survey.description">
          {{ truncateText(survey.description, 100) }}
        </p>

        <div class="survey-info">
          <div class="info-item">
            <span class="label">Создан:</span>
            <span>{{ formatDate(survey.created_at) }}</span>
          </div>
          <div class="info-item" v-if="survey.ends_at">
            <span class="label">Заканчивается:</span>
            <span>{{ formatDate(survey.ends_at) }}</span>
          </div>
        </div>

        <div class="survey-actions">
          <RouterLink :to="`/survey/${survey.id}/stats`" class="btn btn-secondary btn-sm">
            📊 Статистика
          </RouterLink>
          <RouterLink :to="`/survey/${survey.id}`" class="btn btn-secondary btn-sm">
            ✏️ Редактировать
          </RouterLink>
          <button @click="deleteSurvey(survey.id)" class="btn btn-danger btn-sm">
            🗑️ Удалить
          </button>
          <button
            @click="copyShareLink(survey.id)"
            class="btn btn-secondary btn-sm"
            title="Копировать ссылку для общего доступа"
          >
            🔗 Ссылка
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { surveyApi } from '../api/client'
import { useNotifications } from '../composables/useNotifications'
import { useUserId } from '../composables/useUserId'

const { success, error: showError } = useNotifications()
const userId = ref(null)
const surveys = ref([])
const loading = ref(true)
const error = ref(null)

const fetchSurveys = async () => {
  try {
    loading.value = true
    error.value = null
    const creatorId = useUserId()
    userId.value = creatorId
    // Fetch only surveys created by the current user
    surveys.value = await surveyApi.getMysSurveys(creatorId)
  } catch (err) {
    error.value = 'Не удалось загрузить опросы. Попробуйте позже.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const deleteSurvey = async (id) => {
  if (!confirm('Вы уверены? Это действие нельзя отменить.')) return

  try {
    await surveyApi.deleteSurvey(id)
    surveys.value = surveys.value.filter((s) => s.id !== id)
    success('Опрос успешно удален')
  } catch (err) {
    showError('Ошибка при удалении опроса')
    console.error(err)
  }
}

const copyShareLink = (id) => {
  const link = `${window.location.origin}/take/${id}`
  navigator.clipboard.writeText(link).then(() => {
    success('Ссылка скопирована в буфер обмена!')
  }).catch(() => {
    showError('Не удалось скопировать ссылку')
  })
}

const truncateText = (text, length) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

onMounted(() => {
  fetchSurveys()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.page-header h1 {
  margin-bottom: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.surveys-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.survey-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all var(--transition-normal);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-md);
    transform: translateY(-4px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.card-header h3 {
  margin: 0;
  flex: 1;
}

.survey-status {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  background-color: rgba(82, 183, 136, 0.1);
  color: var(--color-success);

  &.inactive {
    background-color: rgba(214, 40, 40, 0.1);
    color: var(--color-danger);
  }
}

.survey-description {
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.survey-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.label {
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.survey-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.survey-actions .btn {
  flex: 1;
  min-width: 100px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header .btn {
    width: 100%;
  }

  .surveys-grid {
    grid-template-columns: 1fr;
  }

  .survey-actions {
    flex-direction: column;
  }

  .survey-actions .btn {
    width: 100%;
  }
}
</style>

