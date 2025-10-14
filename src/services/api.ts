const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

const callEdgeFunction = async (functionName: string, options: RequestInit = {}) => {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};

export const api = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await callEdgeFunction('auth', {
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
    const response = await callEdgeFunction('health', {
      method: 'GET',
    });
    return response.json();
  },

  async getVersion() {
    const response = await callEdgeFunction('version', {
      method: 'GET',
    });
    return response.json();
  }
};
