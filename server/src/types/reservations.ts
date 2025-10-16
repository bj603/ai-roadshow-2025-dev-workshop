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