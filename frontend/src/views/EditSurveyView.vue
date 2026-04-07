<template>
  <div class="container container-sm">
    <!-- Header -->
    <div class="page-header">
      <div>
        <RouterLink to="/" class="back-link">← Назад</RouterLink>
        <h1>Редактировать опрос</h1>
        <p class="text-secondary">Измените параметры опроса</p>
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

    <!-- Form -->
    <form v-else @submit.prevent="submitForm" class="survey-form card">
      <!-- Basic Info -->
      <section class="form-section">
        <h3>Основная информация</h3>

        <div class="form-group">
          <label for="title">
            Название опроса <span class="required">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            id="title"
            placeholder="Например: Удовлетворенность клиентов"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">Описание</label>
          <textarea
            v-model="form.description"
            id="description"
            placeholder="Напишите описание опроса (опционально)"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="starts_at">Когда начать</label>
            <input v-model="form.starts_at" type="datetime-local" id="starts_at" />
          </div>

          <div class="form-group">
            <label for="ends_at">Когда закончить</label>
            <input v-model="form.ends_at" type="datetime-local" id="ends_at" />
          </div>
        </div>

        <div class="form-group">
          <label for="max_responses">Максимум ответов (оставить пусто = без ограничений)</label>
          <input v-model.number="form.max_responses" type="number" id="max_responses" min="1" />
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input v-model="form.is_active" type="checkbox" />
            <span>Активный опрос (люди могут отвечать)</span>
          </label>
        </div>
      </section>

      <!-- Questions (Read-only) -->
      <section class="form-section">
        <h3>Вопросы ({{ survey.questions.length }})</h3>
        
        <div class="info-box info-secondary">
          <span>📝 Редактирование вопросов недоступно. Создайте новый опрос если нужны другие вопросы.</span>
        </div>

        <div v-for="(question, index) in survey.questions" :key="question.id" class="question-item readonly">
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
      </section>

      <!-- Actions -->
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="isSaving">
          <span v-if="isSaving" class="spinner"></span>
          <span v-else>💾 Сохранить изменения</span>
        </button>
        <RouterLink to="/" class="btn btn-secondary">
          Отмена
        </RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { surveyApi } from '../api/client'
import { useNotifications } from '../composables/useNotifications'
import { utcToLocal, localToUTC } from '../composables/useTimezone'

const route = useRoute()
const router = useRouter()
const { success, error: showError } = useNotifications()

const survey = ref(null)
const loading = ref(true)
const error = ref(null)
const isSaving = ref(false)

const form = reactive({
  title: '',
  description: '',
  starts_at: '',
  ends_at: '',
  max_responses: null,
  is_active: true,
})

const fetchSurvey = async () => {
  try {
    loading.value = true
    error.value = null
    survey.value = await surveyApi.getSurvey(route.params.id)
    
    // Populate form with current data
    form.title = survey.value.title
    form.description = survey.value.description || ''
    form.starts_at = survey.value.starts_at ? utcToLocal(survey.value.starts_at) : ''
    form.ends_at = survey.value.ends_at ? utcToLocal(survey.value.ends_at) : ''
    form.max_responses = survey.value.max_responses || null
    form.is_active = survey.value.is_active === 1
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

const submitForm = async () => {
  if (!form.title.trim()) {
    showError('Название опроса обязательно')
    return
  }

  try {
    isSaving.value = true
    await surveyApi.updateSurvey(route.params.id, {
      title: form.title.trim(),
      description: form.description || '',
      starts_at: localToUTC(form.starts_at),
      ends_at: localToUTC(form.ends_at),
      max_responses: form.max_responses || null,
      is_active: form.is_active ? 1 : 0,
    })
    success('Опрос успешно обновлен')
    await router.push('/')
  } catch (err) {
    showError('Ошибка при обновлении опроса')
    console.error(err)
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchSurvey()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, var(--color-text-primary), var(--color-text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header p {
  margin: 0;
  font-size: 0.95rem;
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  display: inline-block;
  transition: all var(--transition-fast);

  &:hover {
    transform: translateX(-4px);
  }
}

.survey-form {
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.6), rgba(26, 26, 26, 0.4));
  border: 1px solid rgba(82, 183, 136, 0.15);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 14px;
}

.form-section {
  margin-bottom: 2rem;

  &:not(:last-of-type) {
    padding-bottom: 2rem;
    border-bottom: 1px solid rgba(82, 183, 136, 0.1);
  }

  h3 {
    margin: 0 0 1.5rem 0;
    color: var(--color-text-primary);
    font-size: 1.1rem;
  }
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--color-text-primary);
    font-weight: 500;
    font-size: 0.95rem;
  }

  input[type='text'],
  input[type='number'],
  input[type='datetime-local'],
  textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(26, 26, 26, 0.5);
    border: 1px solid rgba(82, 183, 136, 0.2);
    border-radius: 8px;
    color: var(--color-text-primary);
    font-family: 'Montserrat', sans-serif;
    font-size: 0.95rem;
    transition: all var(--transition-fast);

    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(82, 183, 136, 0.1);
    }

    &::placeholder {
      color: var(--color-text-tertiary);
    }
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.checkbox-group {
  label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0;
    cursor: pointer;

    input {
      cursor: pointer;
      width: 20px;
      height: 20px;
    }

    span {
      margin: 0;
    }
  }
}

.required {
  color: #ff6b6b;
  font-weight: 600;
}

.info-box {
  padding: 1rem;
  background: rgba(82, 183, 136, 0.08);
  border-left: 3px solid var(--color-primary);
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.info-secondary {
  background: rgba(82, 183, 136, 0.08);
  border-left-color: var(--color-primary);
}

.question-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(82, 183, 136, 0.05);
  border: 1px solid rgba(82, 183, 136, 0.15);
  border-radius: 8px;
  margin-bottom: 1rem;

  &.readonly {
    opacity: 0.7;
  }
}

.question-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  border-radius: 50%;
  font-weight: 600;
}

.question-content {
  flex: 1;

  h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary);
    font-size: 0.95rem;
  }
}

.question-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.meta-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(82, 183, 136, 0.2);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  &.required {
    background: rgba(255, 107, 107, 0.2);
    color: #ff6b6b;
  }
}

.options-list {
  margin-top: 0.75rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.option-icon {
  color: var(--color-primary);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(82, 183, 136, 0.1);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
  font-size: 0.95rem;

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(82, 183, 136, 0.3);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.btn-secondary {
    background: rgba(82, 183, 136, 0.1);
    color: var(--color-primary);
    border: 1px solid rgba(82, 183, 136, 0.2);

    &:hover {
      background: rgba(82, 183, 136, 0.15);
      border-color: var(--color-primary);
    }
  }
}
</style>
