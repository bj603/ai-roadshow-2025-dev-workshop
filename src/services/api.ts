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

// Reservable Objects Types
export enum ReservableObjectType {
  DESK = 'desk',
  PARKING_SPACE = 'parking_space'
}

export enum ReservationStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface ReservableObject {
  id: string;
  name: string;
  type: ReservableObjectType;
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  userId: string;
  objectId: string;
  startDateTime: string;
  endDateTime: string;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservableObjectRequest {
  name: string;
  type: ReservableObjectType;
  location: string;
  description?: string;
}

export interface UpdateReservableObjectRequest {
  name?: string;
  type?: ReservableObjectType;
  location?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateReservationRequest {
  objectId: string;
  startDateTime: string;
  endDateTime: string;
  notes?: string;
}

export interface UpdateReservationRequest {
  startDateTime?: string;
  endDateTime?: string;
  notes?: string;
}

export interface AvailabilityQuery {
  objectId?: string;
  startDateTime: string;
  endDateTime: string;
}

export interface AvailabilitySlot {
  objectId: string;
  object: ReservableObject;
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

  // ===== RESERVABLE OBJECTS API =====
  
  async getReservableObjects(): Promise<ReservableObject[]> {
    const response = await callProtectedAPI('objects', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get reservable objects');
    }

    return response.json();
  },

  async getReservableObject(id: string): Promise<ReservableObject> {
    const response = await callProtectedAPI(`objects/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get reservable object');
    }

    return response.json();
  },

  async createReservableObject(data: CreateReservableObjectRequest): Promise<ReservableObject> {
    const response = await callProtectedAPI('objects', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create reservable object');
    }

    return response.json();
  },

  async updateReservableObject(id: string, data: UpdateReservableObjectRequest): Promise<ReservableObject> {
    const response = await callProtectedAPI(`objects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update reservable object');
    }

    return response.json();
  },

  async deleteReservableObject(id: string): Promise<void> {
    const response = await callProtectedAPI(`objects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete reservable object');
    }
  },

  // ===== RESERVATIONS API =====

  async getReservations(includeInactive: boolean = false): Promise<Reservation[]> {
    const queryParam = includeInactive ? '?includeInactive=true' : '';
    const response = await callProtectedAPI(`reservations${queryParam}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get reservations');
    }

    return response.json();
  },

  async getReservation(id: string): Promise<Reservation> {
    const response = await callProtectedAPI(`reservations/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get reservation');
    }

    return response.json();
  },

  async createReservation(data: CreateReservationRequest): Promise<Reservation> {
    const response = await callProtectedAPI('reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create reservation');
    }

    return response.json();
  },

  async updateReservation(id: string, data: UpdateReservationRequest): Promise<Reservation> {
    const response = await callProtectedAPI(`reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update reservation');
    }

    return response.json();
  },

  async cancelReservation(id: string): Promise<Reservation> {
    const response = await callProtectedAPI(`reservations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to cancel reservation');
    }

    return response.json();
  },

  // ===== AVAILABILITY API =====

  async checkAvailability(query: AvailabilityQuery): Promise<AvailabilitySlot[]> {
    const response = await callProtectedAPI('availability', {
      method: 'POST',
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to check availability');
    }

    return response.json();
  }
};
