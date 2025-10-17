// Enums for type safety
export enum ReservableObjectType {
  DESK = 'DESK',
  PARKING_SPACE = 'PARKING_SPACE'
}

// Core interfaces for reservable objects and reservations
export interface ReservableObject {
  id: string;
  type: ReservableObjectType;
  name: string;
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  objectId: string;
  userId: string;
  startDateTime: Date;
  endDateTime: Date;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request/response DTOs
export interface CreateReservableObjectRequest {
  type: ReservableObjectType;
  name: string;
  location: string;
  description?: string;
}

export interface UpdateReservableObjectRequest {
  name?: string;
  location?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateReservationRequest {
  objectId: string;
  userId: string;
  startDateTime: string | Date; // Allow string for API input
  endDateTime?: string | Date;  // Optional if using duration
  duration?: number;            // Duration in minutes, alternative to endDateTime
  description?: string;
}

export interface UpdateReservationRequest {
  startDateTime?: string | Date;
  endDateTime?: string | Date;
  duration?: number;
  description?: string;
  isActive?: boolean;
}

// Utility interfaces
export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface AvailabilityCheck {
  objectId: string;
  timeSlot: TimeSlot;
  isAvailable: boolean;
  conflictingReservations?: Reservation[];
}

export interface ReservationConflict {
  existingReservation: Reservation;
  requestedTimeSlot: TimeSlot;
  overlapStart: Date;
  overlapEnd: Date;
}