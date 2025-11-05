const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

import type { 
  ReservableObject, 
  Reservation, 
  CreateReservationRequest, 
  AvailabilityResponse, 
  ApiResponse 
} from '../types/reservations';

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
  },

  // ========== RESERVATION ENDPOINTS ==========

  async getObjects(type?: 'desk' | 'parking'): Promise<ApiResponse<ReservableObject[]>> {
    const queryParam = type ? `?type=${type}` : '';
    const response = await callAPI(`objects${queryParam}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get objects');
    }

    return response.json();
  },

  async checkAvailability(objectId: string, startDateTime: string, endDateTime: string): Promise<ApiResponse<AvailabilityResponse>> {
    const params = new URLSearchParams({
      startDateTime,
      endDateTime
    });
    
    const response = await callAPI(`objects/${objectId}/availability?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check availability');
    }

    return response.json();
  },

  async getAvailableObjects(startDateTime: string, endDateTime: string, type?: 'desk' | 'parking'): Promise<ApiResponse<ReservableObject[]>> {
    const params = new URLSearchParams({
      startDateTime,
      endDateTime
    });
    
    if (type) {
      params.append('type', type);
    }
    
    const response = await callAPI(`objects/available?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get available objects');
    }

    return response.json();
  },

  async createReservation(request: CreateReservationRequest): Promise<ApiResponse<Reservation>> {
    const response = await callProtectedAPI('reservations', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create reservation');
    }

    return response.json();
  },

  async getReservations(status?: 'active' | 'upcoming'): Promise<ApiResponse<Reservation[]>> {
    const queryParam = status ? `?status=${status}` : '';
    const response = await callProtectedAPI(`reservations${queryParam}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get reservations');
    }

    return response.json();
  },

  async cancelReservation(reservationId: string): Promise<ApiResponse<Reservation>> {
    const response = await callProtectedAPI(`reservations/${reservationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel reservation');
    }

    return response.json();
  },

  async getObjectReservations(objectId: string): Promise<ApiResponse<Reservation[]>> {
    const response = await callAPI(`objects/${objectId}/reservations`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get object reservations');
    }

    return response.json();
  }
};
