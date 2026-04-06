<template>
  <div class="container container-md">
    <!-- Header -->
    <div class="page-header">
      <div>
        <RouterLink to="/" class="back-link">← Назад</RouterLink>
        <h1>Статистика опроса</h1>
        <p v-if="stats && survey" class="text-secondary">
          Всего ответов: <strong>{{ stats.respondents }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <button @click="refreshStats" class="btn btn-secondary">🔄 Обновить</button>
        <button @click="loadAllAnswers" class="btn btn-secondary">📋 Все ответы</button>
        <button @click="exportToCSV" class="btn btn-secondary">📥 Экспорт CSV</button>
        <RouterLink :to="`/survey/${surveyId}`" class="btn btn-secondary">✏️ Редактировать</RouterLink>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center mt-4">
      <div class="spinner"></div>
      <p class="text-secondary mt-2">Загрузка статистики...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <!-- Stats -->
    <div v-else-if="stats && stats.data && stats.data.length > 0">
      <!-- Survey Info Card -->
      <div class="info-card">
        <div class="info-item">
          <span class="label">Название:</span>
          <span class="value">{{ survey.title }}</span>
        </div>
        <div class="info-item">
          <span class="label">Статус:</span>
          <span class="value" :class="survey.is_active ? 'success' : 'danger'">
            {{ survey.is_active ? '🟢 Активный' : '🔴 Неактивный' }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">Создан:</span>
          <span class="value">{{ formatDate(survey.created_at) }}</span>
        </div>
      </div>

      <!-- Questions Stats -->
      <div class="stats-grid">
        <div v-for="stat in stats.data" :key="stat.id" class="stat-card">
          <!-- Question Header -->
          <div class="stat-header">
            <h3>{{ stat.text }}</h3>
            <span class="stat-type">{{ getQuestionTypeName(stat.type) }}</span>
          </div>

          <div class="stat-body">
            <!-- Radio / Checkbox -->
            <div v-if="['radio', 'checkbox'].includes(stat.type)">
              <div class="stat-meta">
                <span>Всего ответов: <strong>{{ stat.total }}</strong></span>
              </div>
              <BarChart :question="stat" />
            </div>

            <!-- Scale -->
            <div v-else-if="stat.type === 'scale'">
              <div class="stat-meta">
                <span v-if="stat.average">
                  Средний балл: <strong>{{ stat.average }}</strong>
                </span>
                <span v-if="stat.nps" class="nps-score">NPS: {{ stat.nps }}</span>
              </div>

              <ScaleChart :question="stat" />

              <!-- NPS Breakdown -->
              <div v-if="stat.nps_breakdown" class="nps-breakdown">
                <div class="nps-item promoters">
                  <span class="label">Промоутеры (9-10)</span>
                  <span class="count">{{ stat.nps_breakdown.promoters.count }}</span>
                  <span class="percent">{{ stat.nps_breakdown.promoters.percent }}%</span>
                </div>
                <div class="nps-item neutrals">
                  <span class="label">Нейтралы (7-8)</span>
                  <span class="count">{{ stat.nps_breakdown.neutrals.count }}</span>
                  <span class="percent">{{ stat.nps_breakdown.neutrals.percent }}%</span>
                </div>
                <div class="nps-item detractors">
                  <span class="label">Критики (0-6)</span>
                  <span class="count">{{ stat.nps_breakdown.detractors.count }}</span>
                  <span class="percent">{{ stat.nps_breakdown.detractors.percent }}%</span>
                </div>
              </div>
            </div>

            <!-- Text -->
            <div v-else-if="stat.type === 'text'" class="text-responses">
              <p class="text-secondary">Текстовые ответы не отображаются</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Data -->
    <div v-else-if="loading === false" class="empty-state">
      <div class="empty-icon">📊</div>
      <h2>Нет данных</h2>
      <p class="text-secondary" v-if="stats && stats.respondents === 0">
        Ответов на этот опрос еще не поступило
      </p>
      <p class="text-secondary" v-else-if="stats && stats.respondents > 0">
        Ошибка при загрузке статистики. Попробуйте обновить страницу.
      </p>
      <p class="text-secondary" v-else>
        Не удалось загрузить данные
      </p>
    </div>

    <!-- All Answers Modal -->
    <div v-if="showAllAnswersModal" class="modal-overlay" @click.self="showAllAnswersModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Все ответы</h2>
          <button @click="showAllAnswersModal = false" class="modal-close">✕</button>
        </div>
        
        <div v-if="!allAnswers" class="modal-body text-center">
          <div class="spinner"></div>
          <p class="text-secondary mt-2">Загрузка ответов...</p>
        </div>

        <div v-else class="modal-body answers-list">
          <div v-for="questionData in allAnswers.data" :key="questionData.question_id" class="question-answers">
            <h3>{{ questionData.question_text }}</h3>
            <p class="text-secondary">{{ getQuestionTypeName(questionData.question_type) }} • {{ questionData.answers.length }} ответов</p>
            
            <div class="answers-items">
              <div v-for="answer in questionData.answers" :key="answer.id" class="answer-item">
                <div class="answer-meta">
                  <span class="session-id">{{ answer.session_id.substring(0, 8) }}...</span>
                  <span class="answer-time">{{ formatDate(answer.answered_at) }}</span>
                </div>
                <div class="answer-text">
                  {{ answer.option_text || answer.answer_text || '-' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { surveyApi } from '../api/client'
import { useNotifications } from '../composables/useNotifications'
import BarChart from '../components/charts/BarChart.vue'
import ScaleChart from '../components/charts/ScaleChart.vue'

const route = useRoute()
const { error: showError } = useNotifications()
const surveyId = route.params.id

const survey = ref(null)
const stats = ref(null)
const allAnswers = ref(null)
const loading = ref(true)
const error = ref(null)
const showAllAnswersModal = ref(false)

const fetchData = async () => {
  try {
    loading.value = true
    error.value = null
    const [surveyData, statsData] = await Promise.all([
      surveyApi.getSurvey(surveyId),
      surveyApi.getStats(surveyId),
    ])
    survey.value = surveyData
    
    // Переструктурируем данные статистики
    stats.value = {
      respondents: statsData.respondents,
      data: statsData.questions, // Переименуем questions в data для совместимости с шаблоном
      questions: statsData.questions, // Оставим и как questions
    }
    
    console.log('Stats loaded:', stats.value)
  } catch (err) {
    error.value = 'Ошибка загрузки данных'
    showError('Ошибка загрузки статистики')
    console.error(err)
  } finally {
    loading.value = false
  }
}

const loadAllAnswers = async () => {
  try {
    allAnswers.value = null
    showAllAnswersModal.value = true
    allAnswers.value = await surveyApi.getAllAnswers(surveyId)
  } catch (err) {
    showError('Не удалось загрузить ответы')
    showAllAnswersModal.value = false
    console.error(err)
  }
}

const refreshStats = () => {
  fetchData()
}

const getQuestionTypeName = (type) => {
  const names = {
    radio: '🔘 Один ответ',
    checkbox: '☑️ Несколько ответов',
    scale: '📊 Шкала (0-10)',
    text: '✏️ Текст',
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

const exportToCSV = async () => {
  if (!stats.value || !stats.value.data) {
    showError('Нет данных для экспорта')
    return
  }

  try {
    // Load all answers for detailed export
    const allAnswersData = await surveyApi.getAllAnswers(surveyId)

    // UTF-8 BOM for Excel compatibility
    let csv = '\uFEFF'

    // Header with survey info
    csv += `Опрос,${survey.value.title}\n`
    csv += `Дата экспорта,${new Date().toLocaleString('ru-RU')}\n`
    csv += `Всего ответов,${stats.value.respondents}\n\n`

    // Stats for each question
    stats.value.data.forEach((stat) => {
      csv += `\n"${stat.text}","Тип: ${getQuestionTypeName(stat.type)}"\n`
      csv += `Всего ответов,${stat.total || 0}\n`

      if (['radio', 'checkbox'].includes(stat.type)) {
        csv += `\nВариант,Кол-во,Процент\n`
        if (stat.options && stat.options.length > 0) {
          stat.options.forEach((opt) => {
            const count = opt.count || 0
            const percent = ((count / (stat.total || 1)) * 100).toFixed(1)
            csv += `"${opt.text.replace(/"/g, '""')}",${count},${percent}%\n`
          })
        }
      } else if (stat.type === 'scale') {
        csv += `Средний балл,${stat.average || '-'}\n`
        if (stat.nps !== undefined) {
          csv += `NPS,${stat.nps}\n`
        }
        if (stat.nps_breakdown) {
          csv += `\nКатегория,Кол-во,Процент\n`
          csv += `Промоутеры (9-10),${stat.nps_breakdown.promoters.count},${stat.nps_breakdown.promoters.percent}%\n`
          csv += `Нейтралы (7-8),${stat.nps_breakdown.neutrals.count},${stat.nps_breakdown.neutrals.percent}%\n`
          csv += `Критики (0-6),${stat.nps_breakdown.detractors.count},${stat.nps_breakdown.detractors.percent}%\n`
        }
        if (stat.buckets && stat.buckets.length > 0) {
          csv += `\nБалл,Кол-во\n`
          stat.buckets.forEach((b) => {
            csv += `${b.score},${b.count}\n`
          })
        }
      }
    })

    // Detailed answers section
    csv += `\n\n=== ДЕТАЛЬНЫЕ ОТВЕТЫ ===\n\n`
    
    if (allAnswersData && allAnswersData.data && allAnswersData.data.length > 0) {
      allAnswersData.data.forEach((questionData) => {
        csv += `\n"${questionData.question_text} (${getQuestionTypeName(questionData.question_type)})"\n`
        csv += `Номер ответа,Время ответа,Ответ\n`
        
        questionData.answers.forEach((answer, idx) => {
          const answerTime = formatDate(answer.answered_at)
          const answerText = (answer.option_text || answer.answer_text || '-').replace(/"/g, '""')
          csv += `${idx + 1},"${answerTime}","${answerText}"\n`
        })
      })
    }

    // Download with proper encoding
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${survey.value.title.replace(/[^\w\s]/g, '')}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    showError('Ошибка при экспорте данных')
    console.error(err)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.page-header > div:first-child {
  flex: 1;
  min-width: 300px;
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

.page-header h1 {
  margin: 0.5rem 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.info-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
}

.value {
  font-size: 1rem;
  color: var(--color-text-primary);

  &.success {
    color: var(--color-success);
  }

  &.danger {
    color: var(--color-danger);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: all var(--transition-normal);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-md);
  }
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);

  h3 {
    margin: 0;
    flex: 1;
  }
}

.stat-type {
  padding: 0.25rem 0.75rem;
  background-color: rgba(82, 183, 136, 0.1);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stat-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  flex-wrap: wrap;

  strong {
    color: var(--color-primary);
  }
}

.nps-score {
  padding: 0.25rem 0.75rem;
  background-color: rgba(82, 183, 136, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  font-weight: 600;
}

.nps-breakdown {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.nps-item {
  padding: 1rem;
  border-radius: var(--radius-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &.promoters {
    background-color: rgba(82, 183, 136, 0.1);
    border: 1px solid var(--color-success);
  }

  &.neutrals {
    background-color: rgba(247, 127, 0, 0.1);
    border: 1px solid var(--color-warning);
  }

  &.detractors {
    background-color: rgba(214, 40, 40, 0.1);
    border: 1px solid var(--color-danger);
  }

  .label {
    font-size: 0.75rem;
  }

  .count {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .percent {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;

    button,
    a {
      flex: 1;
    }
  }

  .info-card {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .nps-breakdown {
    grid-template-columns: 1fr;
  }
}

/* ========== Modal ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);

  h2 {
    margin: 0;
  }
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-text);
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.question-answers {
  padding: 1.5rem;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }
}

.answers-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.answer-item {
  padding: 0.75rem 1rem;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.answer-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-bottom: 0.5rem;
}

.session-id {
  font-family: monospace;
}

.answer-time {
  color: var(--color-text-secondary);
}

.answer-text {
  font-size: 0.9rem;
  color: var(--color-text);
  word-break: break-word;
}
</style>
