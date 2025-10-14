<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Workspace Reservation System</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      <div class="demo-users">
        <p>Demo Users:</p>
        <ul>
          <li>admin@example.com / admin123</li>
          <li>manager@example.com / manager123</li>
          <li>user@example.com / user123</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import { authService } from '../services/auth';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.login({
      email: email.value,
      password: password.value,
    });

    authService.saveAuth(response.token, response.user);
    router.push('/welcome');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
}

h1 {
  margin: 0 0 2rem;
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a202c;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
  font-size: 0.875rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

button {
  width: 100%;
  padding: 0.875rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background: #5568d3;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee;
  color: #c53030;
  border-radius: 6px;
  font-size: 0.875rem;
  text-align: center;
}

.demo-users {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.demo-users p {
  margin: 0 0 0.75rem;
  font-weight: 500;
  color: #4a5568;
  font-size: 0.875rem;
}

.demo-users ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.demo-users li {
  padding: 0.5rem 0;
  color: #718096;
  font-size: 0.8125rem;
  font-family: monospace;
}
</style>
