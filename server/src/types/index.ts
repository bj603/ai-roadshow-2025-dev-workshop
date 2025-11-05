/**
 * Core data models for the workspace reservation system
 */

/**
 * Represents a reservable object (desk or parking space)
 */
export interface ReservableObject {
  /** Unique identifier for the object */
  id: string;
  
  /** Type of reservable object */
  type: 'desk' | 'parking';
  
  /** Physical location description */
  location: string;
  
  /** Current availability status */
  isAvailable: boolean;
  
  /** Additional metadata for extensibility */
  metadata?: Record<string, any>;
}

/**
 * Represents a reservation for a specific object and time period
 */
export interface Reservation {
  /** Unique identifier for the reservation */
  id: string;
  
  /** ID of the reserved object */
  objectId: string;
  
  /** ID of the user making the reservation */
  userId: string;
  
  /** Start date and time in ISO 8601 format */
  startDateTime: string;
  
  /** End date and time in ISO 8601 format */
  endDateTime: string;
  
  /** Current status of the reservation */
  status: 'active' | 'cancelled' | 'completed';
  
  /** Timestamp when the reservation was created */
  createdAt: string;
}

/**
 * Type for creating a new reservation (omitting auto-generated fields)
 */
export interface CreateReservationRequest {
  objectId: string;
  userId: string;
  startDateTime: string;
  endDateTime: string;
}

/**
 * Response format for availability check
 */
export interface AvailabilityResponse {
  available: boolean;
  conflictingReservations?: Reservation[];
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}