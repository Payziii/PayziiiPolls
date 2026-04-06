<template>
  <div class="container container-sm">
    <!-- Header -->
    <div class="page-header">
      <div>
        <RouterLink to="/" class="back-link">← Назад</RouterLink>
        <h1>Создать опрос</h1>
        <p class="text-secondary">Заполните информацию о новом опросе</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center">
      <div class="spinner"></div>
      <p class="text-secondary mt-2">Создание опроса...</p>
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
      </section>

      <!-- Questions -->
      <section class="form-section">
        <div class="section-header">
          <h3>Вопросы</h3>
          <button
            type="button"
            @click="addQuestion"
            class="btn btn-secondary btn-sm"
          >
            + Добавить вопрос
          </button>
        </div>

        <div v-if="form.questions.length === 0" class="empty-section">
          <p class="text-secondary">Добавьте хотя бы один вопрос</p>
        </div>

        <div v-for="(question, qIndex) in form.questions" :key="question.id" class="question-item">
          <div class="question-header">
            <span class="question-number">Вопрос {{ qIndex + 1 }}</span>
            <button
              type="button"
              @click="removeQuestion(qIndex)"
              class="btn btn-danger btn-sm"
            >
              ✕ Удалить
            </button>
          </div>

          <div class="form-group">
            <label>
              Текст вопроса <span class="required">*</span>
            </label>
            <input
              v-model="question.text"
              type="text"
              placeholder="Введите текст вопроса"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Тип вопроса</label>
              <select v-model="question.type">
                <option value="radio">Один ответ (radio)</option>
                <option value="checkbox">Несколько ответов (checkbox)</option>
                <option value="text">Текстовый ответ</option>
                <option value="scale">Шкала (0-10)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="question.is_required" type="checkbox" />
                Обязательный вопрос
              </label>
            </div>
          </div>

          <!-- Options for radio/checkbox -->
          <div v-if="['radio', 'checkbox'].includes(question.type)" class="options-section">
            <label class="options-label">Варианты ответов:</label>

            <div v-for="(option, oIndex) in question.options" :key="option.id" class="option-item">
              <input
                v-model="option.text"
                type="text"
                placeholder="Вариант ответа"
                required
              />
              <button
                type="button"
                @click="removeOption(qIndex, oIndex)"
                class="btn btn-danger btn-sm"
              >
                ✕
              </button>
            </div>

            <button
              type="button"
              @click="addOption(qIndex)"
              class="btn btn-secondary btn-sm"
            >
              + Добавить вариант
            </button>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <div class="form-actions">
        <RouterLink to="/" class="btn btn-secondary">Отмена</RouterLink>
        <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
          Создать опрос
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { surveyApi } from '../api/client'
import { v4 as uuidv4 } from 'uuid'

const router = useRouter()
const loading = ref(false)

const form = ref({
  title: '',
  description: '',
  starts_at: '',
  ends_at: '',
  max_responses: null,
  questions: [],
})

const addQuestion = () => {
  form.value.questions.push({
    id: uuidv4(),
    text: '',
    type: 'radio',
    is_required: false,
    options: [
      { id: uuidv4(), text: '' },
      { id: uuidv4(), text: '' },
    ],
  })
}

const removeQuestion = (index) => {
  form.value.questions.splice(index, 1)
}

const addOption = (questionIndex) => {
  form.value.questions[questionIndex].options.push({
    id: uuidv4(),
    text: '',
  })
}

const removeOption = (questionIndex, optionIndex) => {
  form.value.questions[questionIndex].options.splice(optionIndex, 1)
}

const submitForm = async () => {
  // Validation
  if (!form.value.title.trim()) {
    alert('Пожалуйста, заполните название опроса')
    return
  }

  if (form.value.questions.length === 0) {
    alert('Пожалуйста, добавьте хотя бы один вопрос')
    return
  }

  for (const question of form.value.questions) {
    if (!question.text.trim()) {
      alert('Пожалуйста, заполните текст всех вопросов')
      return
    }

    if (['radio', 'checkbox'].includes(question.type)) {
      const filledOptions = question.options.filter((o) => o.text.trim())
      if (filledOptions.length < 2) {
        alert('Каждый вопрос с выбором должен иметь минимум 2 варианта ответов')
        return
      }
    }
  }

  try {
    loading.value = true

    const surveyData = {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      starts_at: form.value.starts_at || null,
      ends_at: form.value.ends_at || null,
      max_responses: form.value.max_responses || null,
      questions: form.value.questions.map((q) => ({
        text: q.text.trim(),
        type: q.type,
        is_required: q.is_required,
        options: q.options
          .filter((o) => o.text.trim())
          .map((o) => ({
            text: o.text.trim(),
          })),
      })),
    }

    const result = await surveyApi.createSurvey(surveyData)
    alert('Опрос успешно создан!')
    router.push('/')
  } catch (err) {
    alert('Ошибка при создании опроса: ' + (err.response?.data?.error || err.message))
    console.error(err)
  } finally {
    loading.value = false
  }
}
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

.survey-form {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }

  h3 {
    margin-bottom: 1.5rem;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h3 {
    margin: 0;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.empty-section {
  text-align: center;
  padding: 2rem;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
}

.question-item {
  background-color: var(--color-bg-tertiary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.question-number {
  font-weight: 600;
  color: var(--color-primary);
}

.options-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.options-label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.option-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  input {
    flex: 1;
  }

  .btn {
    flex-shrink: 0;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-weight: normal;

  input[type='checkbox'] {
    width: auto;
    margin: 0;
    cursor: pointer;
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);

  @media (max-width: 600px) {
    flex-direction: column;

    .btn {
      width: 100%;
    }
  }
}
</style>
