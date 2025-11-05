import { callProtectedAPI } from './api';

export interface Reservation {
  id: string;
  objectId: string;
  objectType: 'parking' | 'desk';
  userId: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'active' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationRequest {
  objectId: string;
  objectType: 'parking' | 'desk';
  date: string;
  startTime: string;
  endTime: string;
}

export interface UpdateReservationRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: 'active' | 'cancelled' | 'expired';
}

export interface AvailabilityQuery {
  date: string;
  startTime: string;
  endTime: string;
  type?: 'parking' | 'desk';
}

export interface ConflictCheckRequest {
  objectId: string;
  startTime: string;
  endTime: string;
  date: string;
  excludeReservationId?: string;
}

export interface AvailableObject {
  id: string;
  name: string;
  type: 'parking' | 'desk';
  location: string;
  capacity: number;
  isActive: boolean;
  // Additional properties based on type
  level?: number;
  spotNumber?: string;
  isCovered?: boolean;
  isEVCharging?: boolean;
  isAccessible?: boolean;
  workspaceType?: 'hotdesk' | 'dedicated' | 'meeting_room';
  equipment?: string[];
  maxOccupants?: number;
  hasWindow?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationWithObject extends Reservation {
  object?: AvailableObject;
}

export const reservationsService = {
  // Get user's reservations
  async getUserReservations(): Promise<Reservation[]> {
    const response = await callProtectedAPI('reservations');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch reservations');
    }

    return response.json();
  },

  // Get available objects for specific date/time
  async getAvailableObjects(query: AvailabilityQuery): Promise<AvailableObject[]> {
    const params = new URLSearchParams({
      date: query.date,
      startTime: query.startTime,
      endTime: query.endTime,
    });

    if (query.type) {
      params.append('type', query.type);
    }

    const response = await callProtectedAPI(`reservations/available?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch available objects');
    }

    return response.json();
  },

  // Create new reservation
  async createReservation(reservationData: CreateReservationRequest): Promise<Reservation> {
    const response = await callProtectedAPI('reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create reservation');
    }

    return response.json();
  },

  // Update existing reservation
  async updateReservation(
    id: string,
    updates: UpdateReservationRequest
  ): Promise<Reservation> {
    const response = await callProtectedAPI(`reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update reservation');
    }

    return response.json();
  },

  // Cancel reservation
  async cancelReservation(id: string): Promise<{ message: string }> {
    const response = await callProtectedAPI(`reservations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to cancel reservation');
    }

    return response.json();
  },

  // Check for booking conflicts
  async checkConflicts(conflictData: ConflictCheckRequest): Promise<{
    hasConflict: boolean;
    conflictingReservations: Reservation[];
  }> {
    const params = new URLSearchParams({
      objectId: conflictData.objectId,
      startTime: conflictData.startTime,
      endTime: conflictData.endTime,
      date: conflictData.date,
    });

    if (conflictData.excludeReservationId) {
      params.append('excludeReservationId', conflictData.excludeReservationId);
    }

    const response = await callProtectedAPI(`reservations/conflicts?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to check conflicts');
    }

    return response.json();
  },

  // Get all reservations (Admin/Manager only)
  async getAllReservations(filters?: {
    userId?: string;
    status?: 'active' | 'cancelled' | 'expired';
    date?: string;
  }): Promise<Reservation[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await callProtectedAPI(`admin/reservations${queryString}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch all reservations');
    }

    return response.json();
  },

  // Update reservation status (Admin/Manager only)
  async updateReservationStatus(
    id: string,
    status: 'active' | 'cancelled' | 'expired'
  ): Promise<Reservation> {
    const response = await callProtectedAPI(`admin/reservations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update reservation status');
    }

    return response.json();
  },

  // Helper method to format reservation for display
  formatReservationTime(reservation: Reservation): {
    date: string;
    startTime: string;
    endTime: string;
    duration: string;
  } {
    const startDate = new Date(reservation.startTime);
    const endDate = new Date(reservation.endTime);
    
    const date = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const duration = durationHours > 0 
      ? `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ''}`
      : `${durationMinutes}m`;

    return {
      date,
      startTime,
      endTime,
      duration
    };
  },

  // Helper method to check if reservation is upcoming
  isUpcoming(reservation: Reservation): boolean {
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    return startTime > now && reservation.status === 'active';
  },

  // Helper method to check if reservation is past
  isPast(reservation: Reservation): boolean {
    const now = new Date();
    const endTime = new Date(reservation.endTime);
    return endTime < now || reservation.status === 'expired';
  },

  // Helper method to check if reservation can be cancelled
  canBeCancelled(reservation: Reservation): boolean {
    if (reservation.status !== 'active') return false;
    
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Can cancel up to 2 hours before start time
    return hoursUntilStart > 2;
  }
};