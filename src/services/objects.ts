import { callProtectedAPI } from './api';

export interface ReservableObject {
  id: string;
  name: string;
  type: 'parking' | 'desk';
  location: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingSpace extends ReservableObject {
  type: 'parking';
  level: number;
  spotNumber: string;
  isCovered: boolean;
  isEVCharging: boolean;
  isAccessible: boolean;
}

export interface Desk extends ReservableObject {
  type: 'desk';
  workspaceType: 'hotdesk' | 'dedicated' | 'meeting_room';
  equipment: string[];
  maxOccupants: number;
  hasWindow: boolean;
}

export interface ObjectFilters {
  type?: 'parking' | 'desk';
  location?: string;
  isActive?: boolean;
  level?: number;
  workspaceType?: string;
  hasEVCharging?: boolean;
  hasWindow?: boolean;
  isCovered?: boolean;
  isAccessible?: boolean;
}

// Union type for available objects
export type AvailableObject = ParkingSpace | Desk;

export interface CreateObjectRequest {
  name: string;
  type: 'parking' | 'desk';
  location: string;
  capacity: number;
  level?: number;
  spotNumber?: string;
  isCovered?: boolean;
  isEVCharging?: boolean;
  isAccessible?: boolean;
  workspaceType?: 'hotdesk' | 'dedicated' | 'meeting_room';
  equipment?: string[];
  maxOccupants?: number;
  hasWindow?: boolean;
}

export interface ObjectAnalytics {
  totalObjects: number;
  activeObjects: number;
  parkingSpaces: number;
  desks: number;
  utilizationRate: number;
  popularTimeSlots: Array<{
    timeRange: string;
    bookingCount: number;
  }>;
}

export interface ConflictCheckRequest {
  objectId: string;
  startTime: string;
  endTime: string;
  date: string;
  excludeReservationId?: string;
}

export interface AvailabilityQuery {
  date: string;
  startTime: string;
  endTime: string;
  type?: 'parking' | 'desk';
}

const buildQueryString = (filters?: ObjectFilters): string => {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });
  
  return params.toString() ? `?${params.toString()}` : '';
};

export const objectsService = {
  // Get all objects with optional filters
  async getObjects(filters?: ObjectFilters): Promise<(ParkingSpace | Desk)[]> {
    const queryString = buildQueryString(filters);
    const response = await callProtectedAPI(`objects${queryString}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch objects');
    }
    
    return response.json();
  },

  // Get specific object by ID
  async getObject(id: string): Promise<ParkingSpace | Desk> {
    const response = await callProtectedAPI(`objects/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch object');
    }
    
    return response.json();
  },

  // Create new object (Admin only)
  async createObject(objectData: CreateObjectRequest): Promise<ParkingSpace | Desk> {
    const response = await callProtectedAPI('objects', {
      method: 'POST',
      body: JSON.stringify(objectData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create object');
    }

    return response.json();
  },

  // Update object (Admin/Manager only)
  async updateObject(id: string, updates: Partial<CreateObjectRequest>): Promise<ParkingSpace | Desk> {
    const response = await callProtectedAPI(`objects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update object');
    }

    return response.json();
  },

  // Delete object (Admin only)
  async deleteObject(id: string): Promise<{ message: string }> {
    const response = await callProtectedAPI(`objects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete object');
    }

    return response.json();
  },

  // Get analytics (Admin/Manager only)
  async getAnalytics(): Promise<ObjectAnalytics> {
    const response = await callProtectedAPI('admin/objects/analytics');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch analytics');
    }

    return response.json();
  },

  // Check for booking conflicts
  async checkConflicts(conflictData: ConflictCheckRequest): Promise<{
    hasConflict: boolean;
    conflictingReservations: any[];
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
  }
};