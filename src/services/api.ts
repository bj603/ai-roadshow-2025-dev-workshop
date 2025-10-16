import { 
  ReservableObject, 
  ReservableObjectType, 
  Reservation, 
  CreateReservationRequest, 
  AvailabilityCheck, 
  AvailabilityResponse 
} from '../types/reservations';

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
  },

  // =============================================================================
  // RESERVABLE OBJECTS API
  // =============================================================================

  async getReservableObjects(): Promise<ReservableObject[]> {
    const response = await callAPI('objects', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch reservable objects');
    }

    return response.json();
  },

  async getObjectsByType(type: ReservableObjectType): Promise<ReservableObject[]> {
    const response = await callAPI(`objects/type/${type}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch objects by type');
    }

    return response.json();
  },

  async getObjectById(id: string): Promise<ReservableObject> {
    const response = await callAPI(`objects/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch object details');
    }

    return response.json();
  },

  async checkAvailability(check: AvailabilityCheck): Promise<AvailabilityResponse> {
    const response = await callAPI(`objects/${check.objectId}/availability`, {
      method: 'POST',
      body: JSON.stringify({
        startDateTime: check.startDateTime,
        endDateTime: check.endDateTime
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to check availability');
    }

    return response.json();
  },

  // =============================================================================
  // RESERVATIONS API (Protected)
  // =============================================================================

  async getUserReservations(): Promise<Reservation[]> {
    const response = await callProtectedAPI('reservations', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch reservations');
    }

    return response.json();
  },

  async createReservation(request: CreateReservationRequest): Promise<Reservation> {
    const response = await callProtectedAPI('reservations', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create reservation');
    }

    return response.json();
  },

  async getReservationById(id: string): Promise<Reservation> {
    const response = await callProtectedAPI(`reservations/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch reservation');
    }

    return response.json();
  },

  async cancelReservation(id: string): Promise<void> {
    const response = await callProtectedAPI(`reservations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to cancel reservation');
    }
  },

  async getUpcomingReservations(): Promise<Reservation[]> {
    const response = await callProtectedAPI('reservations/upcoming', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch upcoming reservations');
    }

    return response.json();
  },

  async getObjectReservations(objectId: string): Promise<Reservation[]> {
    const response = await callProtectedAPI(`objects/${objectId}/reservations`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch object reservations');
    }

    return response.json();
  }
};
