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
          <RouterLink :to="`/survey/${survey.id}/edit`" class="btn btn-secondary btn-sm">
            ✏️ Редактировать
          </RouterLink>
          <button @click="openDeleteConfirm(survey.id)" class="btn btn-danger btn-sm">
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

    <!-- Confirm Dialog -->
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { surveyApi } from '../api/client'
import { useNotifications } from '../composables/useNotifications'
import { useUserId } from '../composables/useUserId'
import { formatLocalDate } from '../composables/useTimezone'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const { success, error: showError } = useNotifications()
const userId = ref(null)
const surveys = ref([])
const loading = ref(true)
const error = ref(null)
const confirmDialog = ref(null)

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

const openDeleteConfirm = async (id) => {
  const confirmed = await confirmDialog.value.open({
    title: 'Удалить опрос?',
    message: 'Это действие нельзя отменить. Опрос и все ответы будут удалены окончательно.',
    confirmText: 'Удалить',
    cancelText: 'Отмена',
  })

  if (confirmed) {
    await deleteSurvey(id)
  }
}

const deleteSurvey = async (id) => {
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
  return formatLocalDate(date, false)
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
  background: linear-gradient(135deg, var(--color-text-primary), var(--color-text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header > div {
  flex: 1;
}

.page-header p {
  margin: 0;
  font-size: 0.95rem;
}

.page-header .btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white !important;
  box-shadow: 0 4px 12px rgba(82, 183, 136, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  font-weight: 600;

  &:hover {
    box-shadow: 0 6px 16px rgba(82, 183, 136, 0.4);
    transform: translateY(-2px);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  border: 2px dashed rgba(82, 183, 136, 0.2);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(82, 183, 136, 0.02), rgba(82, 183, 136, 0.01));
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.empty-state h2 {
  margin-bottom: 0.5rem;
}

.surveys-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.survey-card {
  background: linear-gradient(135deg, rgba(82, 183, 136, 0.02) 0%, rgba(82, 183, 136, 0.01) 100%);
  border: 1px solid rgba(82, 183, 136, 0.1);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(82, 183, 136, 0.3),
      transparent
    );
  }

  &:hover {
    border-color: rgba(82, 183, 136, 0.25);
    background: linear-gradient(135deg, rgba(82, 183, 136, 0.05) 0%, rgba(82, 183, 136, 0.02) 100%);
    box-shadow: 0 0 30px rgba(82, 183, 136, 0.15), var(--shadow-md);
    transform: translateY(-6px);
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
  font-size: 1.1rem;
  color: var(--color-text-primary);
}

.survey-status {
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  background: linear-gradient(135deg, rgba(82, 183, 136, 0.15), rgba(82, 183, 136, 0.05));
  border: 1px solid rgba(82, 183, 136, 0.2);
  color: #52b788;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.inactive {
    background: linear-gradient(135deg, rgba(214, 40, 40, 0.15), rgba(214, 40, 40, 0.05));
    border-color: rgba(214, 40, 40, 0.2);
    color: #d62828;
  }
}

.survey-description {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.survey-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0;
  border-top: 1px solid rgba(82, 183, 136, 0.08);
  border-bottom: 1px solid rgba(82, 183, 136, 0.08);
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  align-items: center;
}

.label {
  color: var(--color-text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-size: 0.75rem;
}

.info-item span:last-child {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.survey-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.survey-actions .btn {
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 2rem;
  }

  .page-header .btn {
    width: 100%;
  }

  .surveys-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .survey-actions {
    grid-template-columns: 1fr;
  }

  .survey-actions .btn {
    width: 100%;
  }
}
</style>

