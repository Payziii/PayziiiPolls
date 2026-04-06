<template>
  <div class="container container-sm">
    <!-- Header -->
    <div class="page-header">
      <div>
        <RouterLink to="/" class="back-link">← Назад</RouterLink>
        <h1>Детали опроса</h1>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center mt-4">
      <div class="spinner"></div>
      <p class="text-secondary mt-2">Загрузка опроса...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <!-- Content -->
    <div v-else-if="survey" class="survey-detail">
      <div class="survey-header-card">
        <h2>{{ survey.title }}</h2>
        <p class="survey-description" v-if="survey.description">{{ survey.description }}</p>

        <div class="status-row">
          <span class="status-badge" :class="survey.is_active ? 'active' : 'inactive'">
            {{ survey.is_active ? '🟢 Активный' : '🔴 Неактивный' }}
          </span>
        </div>
      </div>

      <div class="survey-info-grid">
        <div class="info-box">
          <span class="info-label">Создан:</span>
          <span class="info-value">{{ formatDate(survey.created_at) }}</span>
        </div>
        <div v-if="survey.starts_at" class="info-box">
          <span class="info-label">Начало:</span>
          <span class="info-value">{{ formatDate(survey.starts_at) }}</span>
        </div>
        <div v-if="survey.ends_at" class="info-box">
          <span class="info-label">Конец:</span>
          <span class="info-value">{{ formatDate(survey.ends_at) }}</span>
        </div>
        <div v-if="survey.max_responses" class="info-box">
          <span class="info-label">Макс. ответов:</span>
          <span class="info-value">{{ survey.max_responses }}</span>
        </div>
      </div>

      <!-- Questions -->
      <div class="questions-section">
        <h3>Вопросы ({{ survey.questions.length }})</h3>

        <div v-for="(question, index) in survey.questions" :key="question.id" class="question-item">
          <div class="question-number">{{ index + 1 }}</div>
          <div class="question-content">
            <h4>{{ question.text }}</h4>
            <div class="question-meta">
              <span class="meta-badge">{{ getTypeName(question.type) }}</span>
              <span v-if="question.is_required" class="meta-badge required">Обязательный</span>
            </div>

            <!-- Options -->
            <div v-if="question.options && question.options.length > 0" class="options-list">
              <div v-for="option in question.options" :key="option.id" class="option-item">
                <span class="option-icon">○</span>
                <span>{{ option.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <RouterLink :to="`/survey/${survey.id}/stats`" class="btn btn-primary">
          📊 Посмотреть статистику
        </RouterLink>
        <button @click="copyShareLink" class="btn btn-secondary">
          🔗 Копировать ссылку
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { surveyApi } from '../api/client'

const route = useRoute()
const survey = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchSurvey = async () => {
  try {
    loading.value = true
    error.value = null
    survey.value = await surveyApi.getSurvey(route.params.id)
  } catch (err) {
    error.value = 'Опрос не найден'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const getTypeName = (type) => {
  const names = {
    radio: '🔘 Один ответ',
    checkbox: '☑️ Несколько ответов',
    text: '✏️ Текст',
    scale: '📊 Шкала',
  }
  return names[type] || type
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const copyShareLink = () => {
  const link = `${window.location.origin}/take/${survey.value.id}`
  navigator.clipboard.writeText(link).then(() => {
    alert('Ссылка скопирована в буфер обмена!')
  })
}

onMounted(() => {
  fetchSurvey()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--color-primary);
  font-weight: 500;

  &:hover {
    color: var(--color-primary-light);
  }
}

.survey-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.survey-header-card {
  background: linear-gradient(135deg, rgba(82, 183, 136, 0.1), rgba(82, 183, 136, 0.05));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  border-left: 4px solid var(--color-primary);
}

.survey-header-card h2 {
  margin-bottom: 0.5rem;
}

.survey-description {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.status-row {
  display: flex;
  gap: 1rem;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  background-color: rgba(82, 183, 136, 0.1);
  color: var(--color-success);

  &.inactive {
    background-color: rgba(214, 40, 40, 0.1);
    color: var(--color-danger);
  }
}

.survey-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.info-box {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  font-weight: 600;
  text-transform: uppercase;
}

.info-value {
  font-size: 0.95rem;
  color: var(--color-text-primary);
}

.questions-section {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.questions-section h3 {
  margin-bottom: 1.5rem;
}

.question-item {
  display: flex;
  gap: 1.25rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary);

  &:last-child {
    margin-bottom: 0;
  }
}

.question-number {
  min-width: 32px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.question-content {
  flex: 1;
}

.question-content h4 {
  margin: 0 0 0.5rem 0;
}

.question-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.meta-badge {
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  background-color: rgba(82, 183, 136, 0.2);
  color: var(--color-primary);

  &.required {
    background-color: rgba(214, 40, 40, 0.2);
    color: var(--color-danger);
  }
}

.options-list {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  .option-icon {
    color: var(--color-primary);
  }
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);

  @media (max-width: 600px) {
    flex-direction: column;

    .btn {
      width: 100%;
    }
  }
}
</style>
