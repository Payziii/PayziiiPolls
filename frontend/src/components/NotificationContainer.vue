<template>
  <div class="notification-container">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`]"
      >
        <div class="notification-content">
          <span class="notification-icon">
            <template v-if="notification.type === 'success'">✓</template>
            <template v-else-if="notification.type === 'error'">✕</template>
            <template v-else-if="notification.type === 'warning'">⚠</template>
            <template v-else>ℹ</template>
          </span>
          <span class="notification-message">{{ notification.message }}</span>
        </div>
        <button @click="notification.dismiss" class="notification-close" aria-label="Закрыть">
          ✕
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotifications } from '../composables/useNotifications'

const { notifications } = useNotifications()
</script>

<style scoped>
.notification-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
}

.notification {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease-out;
  font-size: 0.95rem;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.notification-icon {
  font-size: 1.1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.notification-message {
  color: var(--color-text);
  word-break: break-word;
}

.notification-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  flex-shrink: 0;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-text);
  }
}

/* Type-specific styles */
.notification-success {
  background-color: var(--color-bg-secondary);
  border-left: 4px solid #22c55e;

  .notification-icon {
    color: #22c55e;
  }
}

.notification-error {
  background-color: var(--color-bg-secondary);
  border-left: 4px solid #ef4444;

  .notification-icon {
    color: #ef4444;
  }
}

.notification-warning {
  background-color: var(--color-bg-secondary);
  border-left: 4px solid #f59e0b;

  .notification-icon {
    color: #f59e0b;
  }
}

.notification-info {
  background-color: var(--color-bg-secondary);
  border-left: 4px solid #3b82f6;

  .notification-icon {
    color: #3b82f6;
  }
}

/* Animations */
@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-enter-active {
  animation: slideInRight 0.3s ease-out;
}

.notification-leave-active {
  animation: slideOutRight 0.3s ease-in;
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(400px);
    opacity: 0;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .notification-container {
    top: 1rem;
    bottom: auto;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
  }

  .notification {
    width: 100%;
  }
}
</style>
