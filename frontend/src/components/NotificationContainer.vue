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
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(26, 26, 26, 0.9));
  border: 1px solid rgba(82, 183, 136, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(82, 183, 136, 0.1);
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.95rem;
  backdrop-filter: blur(10px);
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
  min-width: 1.1rem;
  text-align: center;
}

.notification-message {
  color: var(--color-text-primary);
  word-break: break-word;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  flex-shrink: 0;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--color-text-secondary);
    transform: scale(1.1);
  }
}

/* Type-specific styles */
.notification-success {
  border-color: rgba(82, 183, 136, 0.3);
  background: linear-gradient(135deg, rgba(82, 183, 136, 0.08), rgba(82, 183, 136, 0.03));

  .notification-icon {
    color: #22c55e;
  }

  .notification-message {
    color: #a7f3d0;
  }
}

.notification-error {
  border-color: rgba(214, 40, 40, 0.3);
  background: linear-gradient(135deg, rgba(214, 40, 40, 0.08), rgba(214, 40, 40, 0.03));

  .notification-icon {
    color: #ef4444;
  }

  .notification-message {
    color: #fca5a5;
  }
}

.notification-warning {
  border-color: rgba(247, 127, 0, 0.3);
  background: linear-gradient(135deg, rgba(247, 127, 0, 0.08), rgba(247, 127, 0, 0.03));

  .notification-icon {
    color: #f59e0b;
  }

  .notification-message {
    color: #fed7aa;
  }
}

.notification-info {
  border-color: rgba(90, 154, 201, 0.3);
  background: linear-gradient(135deg, rgba(90, 154, 201, 0.08), rgba(90, 154, 201, 0.03));

  .notification-icon {
    color: #3b82f6;
  }

  .notification-message {
    color: #bfdbfe;
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
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-leave-active {
  animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
