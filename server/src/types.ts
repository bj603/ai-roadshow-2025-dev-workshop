// Enums
export enum ReservableObjectType {
  DESK = 'desk',
  PARKING_SPACE = 'parking_space'
}

export enum ReservationStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

// Interfaces
export interface ReservableObject {
  id: string;
  name: string;
  type: ReservableObjectType;
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  userId: string;
  objectId: string;
  startDateTime: Date;
  endDateTime: Date;
  status: ReservationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types for API
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
  startDateTime: string; // ISO string format
  endDateTime: string;   // ISO string format
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