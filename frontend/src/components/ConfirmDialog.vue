<template>
  <div v-if="isOpen" class="confirm-overlay" @click.self="onCancel">
    <div class="confirm-modal" @click.stop>
      <div class="confirm-header">
        <h3>{{ title }}</h3>
        <button @click="onCancel" class="confirm-close">✕</button>
      </div>

      <div class="confirm-body">
        <p>{{ message }}</p>
      </div>

      <div class="confirm-footer">
        <button @click="onCancel" class="btn btn-secondary">
          {{ cancelText }}
        </button>
        <button @click="onConfirm" class="btn btn-danger" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>{{ confirmText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isOpen = ref(false)
const isLoading = ref(false)
const title = ref('Подтверждение')
const message = ref('Вы уверены?')
const cancelText = ref('Отмена')
const confirmText = ref('Подтвердить')
let resolveCallback = null

const open = (options = {}) => {
  return new Promise((resolve) => {
    title.value = options.title || 'Подтверждение'
    message.value = options.message || 'Вы уверены?'
    cancelText.value = options.cancelText || 'Отмена'
    confirmText.value = options.confirmText || 'Подтвердить'
    resolveCallback = resolve
    isLoading.value = false
    isOpen.value = true
  })
}

const onConfirm = async () => {
  isLoading.value = true
  resolveCallback?.(true)
  isOpen.value = false
  isLoading.value = false
}

const onCancel = () => {
  resolveCallback?.(false)
  isOpen.value = false
  isLoading.value = false
}

defineExpose({ open, isOpen, isLoading })
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.confirm-modal {
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.98), rgba(26, 26, 26, 0.95));
  border: 1px solid rgba(82, 183, 136, 0.2);
  border-radius: 14px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.confirm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(82, 183, 136, 0.1);

  h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--color-text-primary);
  }
}

.confirm-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--color-text-secondary);
    transform: scale(1.1);
  }
}

.confirm-body {
  padding: 1.5rem;

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.6;
    font-size: 0.95rem;
  }
}

.confirm-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(82, 183, 136, 0.1);

  button {
    flex: 1;
  }
}

.spinner {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .confirm-modal {
    width: 95%;
    max-width: none;
  }

  .confirm-footer {
    flex-direction: column;
  }
}
</style>
