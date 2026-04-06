<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'
import NotificationContainer from './components/NotificationContainer.vue'

const isMenuOpen = ref(false)
</script>

<template>
  <div id="app" class="app-layout">
    <!-- Navigation Header -->
    <header class="navbar">
      <div class="navbar-container">
        <RouterLink to="/" class="navbar-brand">
          <span class="brand-icon">📊</span>
          <span class="brand-text">PayziiiPolls</span>
        </RouterLink>

        <button class="menu-toggle" @click="isMenuOpen = !isMenuOpen">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav class="navbar-nav" :class="{ active: isMenuOpen }">
          <RouterLink to="/" class="nav-link" @click="isMenuOpen = false">
            Мои Опросы
          </RouterLink>
          <RouterLink to="/create" class="nav-link nav-link-primary" @click="isMenuOpen = false">
            + Создать
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- Notifications -->
    <NotificationContainer />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ========== Navbar ========== */
.navbar {
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 1rem 0;
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  gap: 2rem;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-primary-light);
  }
}

.brand-icon {
  font-size: 1.75rem;
}

.brand-text {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: auto;
}

.nav-link {
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: color var(--transition-fast);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);

  &:hover,
  &.router-link-active {
    color: var(--color-primary);
  }
}

.nav-link-primary {
  background-color: var(--color-primary);
  color: white !important;

  &:hover {
    background-color: var(--color-primary-hover);
  }
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;

  span {
    width: 1.5rem;
    height: 2px;
    background-color: var(--color-text-primary);
    transition: all var(--transition-fast);
    border-radius: 1px;
  }
}

/* ========== Main Content ========== */
.main-content {
  flex: 1;
  padding: 2rem 0;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 1rem;
    gap: 1rem;
  }

  .menu-toggle {
    display: flex;
    order: 2;
  }

  .navbar-nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--color-bg-secondary);
    flex-direction: column;
    gap: 0;
    margin: 0;
    border-bottom: 1px solid var(--color-border);
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--transition-normal);

    &.active {
      max-height: 200px;
    }
  }

  .nav-link {
    width: 100%;
    padding: 1rem 1.5rem;
    border-radius: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .main-content {
    padding: 1rem 0;
  }
}
</style>
