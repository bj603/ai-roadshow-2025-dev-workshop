<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authService } from './services/auth';

const router = useRouter();
const route = useRoute();

// Reactive state
const user = ref(authService.getCurrentUser());
const isLoggedIn = computed(() => !!user.value);
const showMobileMenu = ref(false);

// Navigation items
const navItems = [
  { path: '/reservations', label: 'Reservations', icon: '🏢' },
  { path: '/welcome', label: 'Dashboard', icon: '📊' }
];

// Methods
const logout = () => {
  authService.logout();
  user.value = null;
  router.push('/login');
};

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const closeMobileMenu = () => {
  showMobileMenu.value = false;
};

// Check auth status on mount
onMounted(() => {
  user.value = authService.getCurrentUser();
});

// Hide navigation on login page
const hideNavigation = computed(() => {
  return route.path === '/login';
});
</script>

<template>
  <div id="app">
    <!-- Navigation Bar -->
    <nav v-if="!hideNavigation && isLoggedIn" class="navbar">
      <div class="nav-container">
        <!-- Logo/Brand -->
        <div class="nav-brand">
          <router-link to="/reservations" class="brand-link">
            <span class="brand-icon">🏢</span>
            <span class="brand-text">Workspace</span>
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <div class="nav-links">
          <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ active: route.path === item.path }"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>

        <!-- User Menu -->
        <div class="user-menu">
          <div class="user-info">
            <span class="user-name">{{ user?.name }}</span>
            <span class="user-role">{{ user?.role }}</span>
          </div>
          <button @click="logout" class="logout-btn">
            Logout
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <button @click="toggleMobileMenu" class="mobile-menu-btn">
          ☰
        </button>
      </div>

      <!-- Mobile Navigation -->
      <div v-if="showMobileMenu" class="mobile-nav" @click="closeMobileMenu">
        <div class="mobile-nav-content" @click.stop>
          <div class="mobile-user-info">
            <div class="mobile-user-name">{{ user?.name }}</div>
            <div class="mobile-user-role">{{ user?.role }}</div>
          </div>
          
          <div class="mobile-nav-links">
            <router-link 
              v-for="item in navItems" 
              :key="item.path"
              :to="item.path"
              class="mobile-nav-link"
              :class="{ active: route.path === item.path }"
              @click="closeMobileMenu"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </router-link>
          </div>
          
          <div class="mobile-nav-footer">
            <button @click="logout" class="mobile-logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content" :class="{ 'with-nav': !hideNavigation && isLoggedIn }">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8f9fa;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navigation Styles */
.navbar {
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.nav-brand {
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #333;
  font-weight: 600;
  font-size: 18px;
}

.brand-icon {
  font-size: 24px;
}

.brand-text {
  color: #007bff;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  text-decoration: none;
  color: #666;
  border-radius: 6px;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  background: #f8f9fa;
  color: #007bff;
}

.nav-link.active {
  background: #007bff;
  color: white;
}

.nav-icon {
  font-size: 16px;
}

.nav-label {
  font-size: 14px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 14px;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-role {
  font-size: 12px;
  color: #666;
  text-transform: capitalize;
}

.logout-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #c82333;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
}

/* Mobile Navigation */
.mobile-nav {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.mobile-nav-content {
  background: white;
  height: 100%;
  width: 280px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mobile-user-info {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.mobile-user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.mobile-user-role {
  font-size: 14px;
  color: #666;
  text-transform: capitalize;
}

.mobile-nav-links {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  text-decoration: none;
  color: #666;
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
}

.mobile-nav-link:hover {
  background: #f8f9fa;
  color: #007bff;
}

.mobile-nav-link.active {
  background: #007bff;
  color: white;
}

.mobile-nav-footer {
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.mobile-logout-btn {
  width: 100%;
  padding: 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-content.with-nav {
  min-height: calc(100vh - 64px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  
  .user-menu {
    display: none;
  }
  
  .mobile-menu-btn {
    display: block;
  }
  
  .nav-container {
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .brand-text {
    display: none;
  }
  
  .nav-container {
    padding: 0 12px;
  }
}
</style>
