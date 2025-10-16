import { 
  Reservation, 
  CreateReservationRequest, 
  AvailabilityCheck, 
  AvailabilityResponse,
  ReservationStatus,
  ReservableObject,
  ReservableObjectType 
} from '../types/reservations.js';
import { reservationStorage } from '../storage/reservationStorage.js';

export class ReservationService {
  
  /**
   * Check if a reservable object is available for the specified time range
   */
  checkAvailability(check: AvailabilityCheck): AvailabilityResponse {
    // Validate the object exists
    const object = reservationStorage.getObjectById(check.objectId);
    if (!object) {
      return {
        isAvailable: false,
        conflictingReservations: []
      };
    }

    // Validate time range
    const startTime = new Date(check.startDateTime);
    const endTime = new Date(check.endDateTime);
    
    if (startTime >= endTime) {
      return {
        isAvailable: false,
        conflictingReservations: []
      };
    }

    // Check for conflicting reservations
    const conflictingReservations = reservationStorage.getActiveReservationsInRange(
      check.objectId, 
      check.startDateTime, 
      check.endDateTime
    );

    return {
      isAvailable: conflictingReservations.length === 0,
      conflictingReservations
    };
  }

  /**
   * Create a new reservation if the time slot is available
   */
  createReservation(userId: string, request: CreateReservationRequest): { success: boolean, reservation?: Reservation, error?: string } {
    // Validate the object exists
    const object = reservationStorage.getObjectById(request.objectId);
    if (!object) {
      return { success: false, error: 'Reservable object not found' };
    }

    // Validate time range
    const startTime = new Date(request.startDateTime);
    const endTime = new Date(request.endDateTime);
    const now = new Date();
    
    if (startTime >= endTime) {
      return { success: false, error: 'Start time must be before end time' };
    }

    if (startTime <= now) {
      return { success: false, error: 'Reservation start time must be in the future' };
    }

    // Check availability
    const availabilityCheck: AvailabilityCheck = {
      objectId: request.objectId,
      startDateTime: request.startDateTime,
      endDateTime: request.endDateTime
    };

    const availability = this.checkAvailability(availabilityCheck);
    if (!availability.isAvailable) {
      return { 
        success: false, 
        error: `Time slot is not available. ${availability.conflictingReservations?.length || 0} conflicting reservation(s) found.` 
      };
    }

    // Create the reservation
    const reservation: Reservation = {
      id: this.generateReservationId(),
      objectId: request.objectId,
      objectType: object.type,
      userId,
      startDateTime: request.startDateTime,
      endDateTime: request.endDateTime,
      status: ReservationStatus.ACTIVE,
      notes: request.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reservationStorage.addReservation(reservation);
    
    return { success: true, reservation };
  }

  /**
   * Cancel a reservation
   */
  cancelReservation(userId: string, reservationId: string): { success: boolean, error?: string } {
    const reservation = reservationStorage.getReservationById(reservationId);
    
    if (!reservation) {
      return { success: false, error: 'Reservation not found' };
    }

    if (reservation.userId !== userId) {
      return { success: false, error: 'You can only cancel your own reservations' };
    }

    if (reservation.status !== ReservationStatus.ACTIVE) {
      return { success: false, error: 'Only active reservations can be cancelled' };
    }

    // Update reservation status
    const updated = reservationStorage.updateReservation(reservationId, {
      status: ReservationStatus.CANCELLED
    });

    if (!updated) {
      return { success: false, error: 'Failed to cancel reservation' };
    }

    return { success: true };
  }

  /**
   * Get all reservations for a user
   */
  getUserReservations(userId: string): Reservation[] {
    return reservationStorage.getReservationsByUserId(userId);
  }

  /**
   * Get all active reservations for a specific object
   */
  getObjectReservations(objectId: string): Reservation[] {
    return reservationStorage.getReservationsByObjectId(objectId)
      .filter(res => res.status === ReservationStatus.ACTIVE);
  }

  /**
   * Get a specific reservation by ID
   */
  getReservationById(reservationId: string): Reservation | undefined {
    return reservationStorage.getReservationById(reservationId);
  }

  /**
   * Get all reservable objects
   */
  getAllObjects(): ReservableObject[] {
    return reservationStorage.getAllObjects();
  }

  /**
   * Get reservable objects by type
   */
  getObjectsByType(type: ReservableObjectType): ReservableObject[] {
    return reservationStorage.getObjectsByType(type);
  }

  /**
   * Get a specific object by ID
   */
  getObjectById(objectId: string): ReservableObject | undefined {
    return reservationStorage.getObjectById(objectId);
  }

  /**
   * Validate reservation time constraints
   */
  validateReservationTime(startDateTime: string, endDateTime: string): { valid: boolean, error?: string } {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: false, error: 'Invalid date format. Use ISO 8601 format.' };
    }

    if (start >= end) {
      return { valid: false, error: 'Start time must be before end time' };
    }

    if (start <= now) {
      return { valid: false, error: 'Reservation start time must be in the future' };
    }

    // Check for reasonable duration limits (e.g., max 24 hours for desks, max 7 days for parking)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours > 24) {
      return { valid: false, error: 'Reservation duration cannot exceed 24 hours' };
    }

    return { valid: true };
  }

  /**
   * Get upcoming reservations (next 7 days)
   */
  getUpcomingReservations(userId?: string): Reservation[] {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    let reservations = reservationStorage.getAllReservations();
    
    if (userId) {
      reservations = reservations.filter(res => res.userId === userId);
    }

    return reservations
      .filter(res => res.status === ReservationStatus.ACTIVE)
      .filter(res => {
        const start = new Date(res.startDateTime);
        return start >= now && start <= nextWeek;
      })
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }

  /**
   * Generate a unique reservation ID
   */
  private generateReservationId(): string {
    return `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const reservationService = new ReservationService();