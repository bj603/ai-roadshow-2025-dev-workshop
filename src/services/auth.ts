import type { User } from './api';

export const authService = {
  saveAuth(token: string, user: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getCurrentUser(): User | null {
    return this.getUser();
  },

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  logout() {
    this.clearAuth();
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
