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

export interface ReservableObject {
  id: string;
  type: 'DESK' | 'PARKING_SPACE';
  name: string;
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  objectId: string;
  userId: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationRequest {
  objectId: string;
  startDateTime: string;
  endDateTime?: string;
  duration?: number; // in minutes
  description?: string;
}

export interface AvailabilityCheck {
  objectId: string;
  timeSlot: {
    start: string;
    end: string;
  };
  isAvailable: boolean;
  conflictingReservations?: Reservation[];
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

  // Reservable Objects API
  async getReservableObjects(type?: 'DESK' | 'PARKING_SPACE'): Promise<ReservableObject[]> {
    const query = type ? `?type=${type}` : '';
    const response = await callProtectedAPI(`reservable-objects${query}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get reservable objects');
    }

    return response.json();
  },

  async getReservableObject(id: string): Promise<ReservableObject> {
    const response = await callProtectedAPI(`reservable-objects/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get reservable object');
    }

    return response.json();
  },

  async checkAvailability(objectId: string, startDateTime: string, endDateTime?: string, duration?: number): Promise<AvailabilityCheck> {
    const payload: any = { startDateTime };
    if (endDateTime) payload.endDateTime = endDateTime;
    if (duration) payload.duration = duration;

    const response = await callProtectedAPI(`reservable-objects/${objectId}/availability`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to check availability');
    }

    return response.json();
  },

  // Reservations API
  async getReservations(): Promise<Reservation[]> {
    const response = await callProtectedAPI('reservations', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get reservations');
    }

    return response.json();
  },

  async createReservation(reservation: CreateReservationRequest): Promise<Reservation> {
    const response = await callProtectedAPI('reservations', {
      method: 'POST',
      body: JSON.stringify(reservation),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create reservation');
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
  }
};
