/**
 * Frontend types for the reservation system
 */

export interface ReservableObject {
  id: string;
  type: 'desk' | 'parking';
  location: string;
  isAvailable: boolean;
  metadata?: Record<string, any>;
}

export interface Reservation {
  id: string;
  objectId: string;
  userId: string;
  startDateTime: string;
  endDateTime: string;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface CreateReservationRequest {
  objectId: string;
  startDateTime: string;
  endDateTime: string;
}

export interface AvailabilityResponse {
  available: boolean;
  conflictingReservations?: Reservation[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ReservationFormData {
  objectId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export interface ObjectWithAvailability extends ReservableObject {
  isAvailableForPeriod?: boolean;
  conflicts?: Reservation[];
}