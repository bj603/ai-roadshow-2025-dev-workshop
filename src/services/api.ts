const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

const callAPI = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}/api/${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};

const callProtectedAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const url = `${API_BASE_URL}/api/${endpoint}`;
  const headers = {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};

export const api = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await callAPI('auth', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  },

  async healthCheck() {
    const response = await callAPI('health', {
      method: 'GET',
    });
    return response.json();
  },

  async getVersion() {
    const response = await callAPI('version', {
      method: 'GET',
    });
    return response.json();
  },

  async getProfile() {
    const response = await callProtectedAPI('profile', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get profile');
    }

    return response.json();
  }
};
