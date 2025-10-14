<template>
  <div class="welcome-container">
    <nav class="navbar">
      <div class="nav-content">
        <h1>Workspace Reservation System</h1>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
    </nav>
    <main class="main-content">
      <div class="welcome-card">
        <h2>Welcome, {{ user?.name }}!</h2>
        <div class="user-info">
          <p><strong>Email:</strong> {{ user?.email }}</p>
          <p><strong>Role:</strong> <span class="role-badge">{{ user?.role }}</span></p>
        </div>
        <div class="placeholder">
          <p>Ready to add features</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/auth';
import type { User } from '../services/api';

const router = useRouter();
const user = ref<User | null>(null);

onMounted(() => {
  user.value = authService.getUser();
});

const handleLogout = () => {
  authService.clearAuth();
  router.push('/login');
};
</script>

<style scoped>
.welcome-container {
  min-height: 100vh;
  background: #f7fafc;
}

.navbar {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.logout-btn {
  padding: 0.5rem 1.25rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background: #5568d3;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.welcome-card h2 {
  margin: 0 0 1.5rem;
  font-size: 1.875rem;
  font-weight: 600;
  color: #1a202c;
}

.user-info {
  margin-bottom: 2rem;
}

.user-info p {
  margin: 0.5rem 0;
  color: #4a5568;
  font-size: 1rem;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
}

.placeholder {
  margin-top: 3rem;
  padding: 3rem;
  background: #f7fafc;
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  text-align: center;
}

.placeholder p {
  margin: 0;
  color: #718096;
  font-size: 1.125rem;
  font-weight: 500;
}
</style>
