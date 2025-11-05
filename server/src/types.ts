// Data model interfaces for the workspace reservation system

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
  level: number; // Floor level or parking deck
  spotNumber: string;
  isCovered: boolean;
  isEVCharging: boolean;
  isAccessible: boolean;
}

export interface Desk extends ReservableObject {
  type: 'desk';
  workspaceType: 'hotdesk' | 'dedicated' | 'meeting_room';
  equipment: string[]; // ['monitor', 'phone', 'ethernet']
  maxOccupants: number;
  hasWindow: boolean;
}

export interface Reservation {
  id: string;
  objectId: string; // References ParkingSpace or Desk
  objectType: 'parking' | 'desk';
  userId: string;
  userEmail: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  date: string;      // YYYY-MM-DD format
  status: 'active' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
}

// Request/Response interfaces
export interface CreateReservationRequest {
  objectId: string;
  objectType: 'parking' | 'desk';
  startTime: string;
  endTime: string;
  date: string;
}

export interface CreateObjectRequest {
  name: string;
  type: 'parking' | 'desk';
  location: string;
  capacity: number;
  // For parking spaces
  level?: number;
  spotNumber?: string;
  isCovered?: boolean;
  isEVCharging?: boolean;
  isAccessible?: boolean;
  // For desks
  workspaceType?: 'hotdesk' | 'dedicated' | 'meeting_room';
  equipment?: string[];
  maxOccupants?: number;
  hasWindow?: boolean;
}

export interface UpdateReservationRequest {
  startTime?: string;
  endTime?: string;
  date?: string;
  status?: 'active' | 'cancelled' | 'expired';
}

export interface ObjectFilters {
  type?: 'parking' | 'desk';
  location?: string;
  isActive?: boolean;
  level?: number;
  workspaceType?: 'hotdesk' | 'dedicated' | 'meeting_room';
  hasEVCharging?: boolean;
  hasWindow?: boolean;
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

// Admin analytics interface
export interface ObjectAnalytics {
  totalObjects: number;
  activeObjects: number;
  parkingSpaces: number;
  desks: number;
  utilizationRate: number; // Percentage
  popularTimeSlots: Array<{
    timeRange: string;
    bookingCount: number;
  }>;
}