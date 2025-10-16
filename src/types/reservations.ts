// Mirror of backend types for frontend use
export enum ReservableObjectType {
  DESK = 'DESK',
  PARKING_SPACE = 'PARKING_SPACE'
}

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface ReservableObject {
  id: string;
  name: string;
  location: string;
  type: ReservableObjectType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Desk extends ReservableObject {
  type: ReservableObjectType.DESK;
  equipment: string[];
  capacity: number;
  hasMonitor: boolean;
  hasPhone: boolean;
}

export interface ParkingSpace extends ReservableObject {
  type: ReservableObjectType.PARKING_SPACE;
  level: string;
  isHandicapAccessible: boolean;
  isElectricVehicleCharging: boolean;
  spaceNumber: string;
}

export interface Reservation {
  id: string;
  objectId: string;
  objectType: ReservableObjectType;
  userId: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string;   // ISO 8601 format
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response types
export interface CreateReservationRequest {
  objectId: string;
  startDateTime: string;
  endDateTime: string;
  notes?: string;
}

export interface AvailabilityCheck {
  objectId: string;
  startDateTime: string;
  endDateTime: string;
}

export interface AvailabilityResponse {
  isAvailable: boolean;
  conflictingReservations?: Reservation[];
}

// Frontend-specific types
export interface ReservationFormData {
  objectId: string;
  objectName: string;
  objectType: ReservableObjectType;
  startDate: string;    // YYYY-MM-DD format for date input
  startTime: string;    // HH:MM format for time input
  endDate: string;      // YYYY-MM-DD format for date input
  endTime: string;      // HH:MM format for time input
  notes?: string;
}

export interface ObjectFilter {
  type?: ReservableObjectType;
  location?: string;
  searchTerm?: string;
  availableOnly?: boolean;
  availabilityStart?: string;
  availabilityEnd?: string;
}

export interface ReservationWithObject extends Reservation {
  object?: ReservableObject;
}

// UI State types
export interface ReservationUIState {
  selectedObject: ReservableObject | null;
  isCheckingAvailability: boolean;
  isCreatingReservation: boolean;
  isCancellingReservation: boolean;
  showReservationForm: boolean;
  availabilityResult: AvailabilityResponse | null;
  error: string | null;
}

// Date/Time utilities for frontend
export interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
  conflictingReservations?: Reservation[];
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD format
  timeSlots: TimeSlot[];
  hasAvailableSlots: boolean;
}