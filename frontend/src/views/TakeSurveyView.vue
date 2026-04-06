<template>
  <div class="container container-sm">
    <!-- Loading -->
    <div v-if="loading" class="text-center mt-4">
      <div class="spinner"></div>
      <p class="text-secondary mt-2">Загрузка опроса...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
      <RouterLink to="/" class="btn btn-secondary btn-sm mt-2">Вернуться домой</RouterLink>
    </div>

    <!-- Survey -->
    <div v-else-if="survey && !submitted">
      <!-- Header -->
      <div class="survey-header">
        <h1>{{ survey.title }}</h1>
        <p v-if="survey.description" class="survey-description">{{ survey.description }}</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="submitAnswers" class="survey-form">
        <!-- Questions -->
        <div v-for="(question, index) in survey.questions" :key="question.id" class="question-block">
          <div class="question-header">
            <h3>{{ index + 1 }}. {{ question.text }}</h3>
            <span v-if="question.is_required" class="required">*</span>
          </div>

          <!-- Radio -->
          <div v-if="question.type === 'radio'" class="options-list">
            <label v-for="option in question.options" :key="option.id" class="radio-option">
              <input
                v-model="answers[question.id]"
                type="radio"
                :name="`question-${question.id}`"
                :value="option.id"
              />
              <span>{{ option.text }}</span>
            </label>
          </div>

          <!-- Checkbox -->
          <div v-else-if="question.type === 'checkbox'" class="options-list">
            <label
              v-for="option in question.options"
              :key="option.id"
              class="checkbox-option"
            >
              <input
                v-model="answers[question.id]"
                type="checkbox"
                :value="option.id"
              />
              <span>{{ option.text }}</span>
            </label>
          </div>

          <!-- Text -->
          <div v-else-if="question.type === 'text'">
            <textarea
              v-model="answers[question.id]"
              placeholder="Введите ваш ответ..."
              rows="4"
            ></textarea>
          </div>

          <!-- Scale -->
          <div v-else-if="question.type === 'scale'" class="scale-container">
            <div class="scale-labels">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
            <input
              v-model.number="answers[question.id]"
              type="range"
              min="0"
              max="10"
              class="scale-slider"
            />
            <div class="scale-value">{{ answers[question.id] || 0 }}</div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="submitting">
            <span v-if="submitting" class="spinner"></span>
            <span v-else>Отправить</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Success Message -->
    <div v-else-if="submitted" class="success-message">
      <div class="success-icon">✅</div>
      <h2>Спасибо!</h2>
      <p class="text-secondary">Ваши ответы успешно отправлены</p>
      <RouterLink to="/" class="btn btn-primary">
        Вернуться домой
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { surveyApi } from '../api/client'
import { v4 as uuidv4 } from 'uuid'

const route = useRoute()
const survey = ref(null)
const loading = ref(true)
const error = ref(null)
const submitting = ref(false)
const submitted = ref(false)
const answers = reactive({})
const sessionId = ref(sessionStorage.getItem('sessionId') || uuidv4())

onMounted(async () => {
  // Store session ID
  sessionStorage.setItem('sessionId', sessionId.value)

  try {
    loading.value = true
    survey.value = await surveyApi.getSurvey(route.params.id)

    // Initialize answers object
    survey.value.questions.forEach((q) => {
      if (q.type === 'checkbox') {
        answers[q.id] = []
      } else {
        answers[q.id] = q.type === 'scale' ? 0 : null
      }
    })
  } catch (err) {
    error.value = 'Опрос не найден или больше не доступен'
    console.error(err)
  } finally {
    loading.value = false
  }
})

const submitAnswers = async () => {
  // Validate required questions
  for (const question of survey.value.questions) {
    if (question.is_required) {
      const answer = answers[question.id]
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        alert(`Пожалуйста, ответьте на обязательный вопрос: "${question.text}"`)
        return
      }
    }
  }

  try {
    submitting.value = true

    // Format answers for API
    const formattedAnswers = []
    for (const question of survey.value.questions) {
      const answer = answers[question.id]

      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        continue
      }

      if (question.type === 'checkbox' && Array.isArray(answer)) {
        formattedAnswers.push({
          question_id: question.id,
          option_ids: answer,
        })
      } else if (question.type === 'radio') {
        formattedAnswers.push({
          question_id: question.id,
          option_id: answer,
        })
      } else if (question.type === 'text' || question.type === 'scale') {
        formattedAnswers.push({
          question_id: question.id,
          answer_text: String(answer),
        })
      }
    }

    await surveyApi.submitAnswers(route.params.id, {
      session_id: sessionId.value,
      answers: formattedAnswers,
    })

    submitted.value = true
  } catch (err) {
    const errorMsg =
      err.response?.data?.error || 'Ошибка при отправке ответов. Попробуйте позже.'
    alert(errorMsg)
    console.error(err)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.survey-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
}

.survey-header h1 {
  margin-bottom: 0.5rem;
}

.survey-description {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.survey-form {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.question-block {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);

  &:last-of-type {
    border-bottom: none;
  }
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  h3 {
    margin: 0;
    flex: 1;
  }
}

.required {
  color: var(--color-danger);
  font-weight: 600;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  user-select: none;

  input {
    width: auto;
    margin: 0;
    cursor: pointer;
  }

  span {
    flex: 1;
  }

  &:hover {
    background-color: var(--color-bg-tertiary);
  }
}

textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(82, 183, 136, 0.1);
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }
}

.scale-container {
  padding: 1.5rem;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.scale-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(
    to right,
    #d62828,
    #f77f00,
    #52b788
  );
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  margin-bottom: 1rem;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    box-shadow: var(--shadow-md);
    border: 2px solid var(--color-bg-secondary);
  }

  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    box-shadow: var(--shadow-md);
    border: 2px solid var(--color-bg-secondary);
  }
}

.scale-value {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.btn-block {
  width: 100%;
}

.success-message {
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  animation: slideUp 0.5s ease-out;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-message h2 {
  margin-bottom: 0.5rem;
}

.success-message p {
  margin-bottom: 2rem;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
