import { 
  ReservableObject, 
  Reservation, 
  CreateReservationRequest,
  AvailabilityQuery,
  AvailabilitySlot,
  ReservationStatus 
} from './types';
import { objectStore, reservationStore } from './storage';

export class ReservationService {
  
  /**
   * Check if an object is available for a given time period
   */
  checkAvailability(objectId: string, startDateTime: Date, endDateTime: Date, excludeReservationId?: string): boolean {
    const conflicts = reservationStore.findConflicting(objectId, startDateTime, endDateTime, excludeReservationId);
    return conflicts.length === 0;
  }

  /**
   * Get availability for multiple objects or a specific time range
   */
  getAvailableSlots(query: AvailabilityQuery): AvailabilitySlot[] {
    const startDateTime = new Date(query.startDateTime);
    const endDateTime = new Date(query.endDateTime);
    
    // Validate date range
    if (startDateTime >= endDateTime) {
      throw new Error('Start date must be before end date');
    }

    // If specific object requested, check only that object
    if (query.objectId) {
      const object = objectStore.findById(query.objectId);
      if (!object) {
        throw new Error('Object not found');
      }

      const isAvailable = this.checkAvailability(query.objectId, startDateTime, endDateTime);
      const conflictingReservations = isAvailable ? 
        [] : 
        reservationStore.findConflicting(query.objectId, startDateTime, endDateTime);

      return [{
        objectId: query.objectId,
        object,
        isAvailable,
        conflictingReservations
      }];
    }

    // Check all active objects
    const objects = objectStore.findAll();
    return objects.map(object => {
      const isAvailable = this.checkAvailability(object.id, startDateTime, endDateTime);
      const conflictingReservations = isAvailable ? 
        [] : 
        reservationStore.findConflicting(object.id, startDateTime, endDateTime);

      return {
        objectId: object.id,
        object,
        isAvailable,
        conflictingReservations
      };
    });
  }

  /**
   * Create a new reservation with validation
   */
  createReservation(userId: string, data: CreateReservationRequest): Reservation {
    const startDateTime = new Date(data.startDateTime);
    const endDateTime = new Date(data.endDateTime);

    // Validate dates
    if (startDateTime >= endDateTime) {
      throw new Error('Start date must be before end date');
    }

    if (startDateTime < new Date()) {
      throw new Error('Cannot create reservation in the past');
    }

    // Check if object exists
    const object = objectStore.findById(data.objectId);
    if (!object) {
      throw new Error('Reservable object not found');
    }

    // Check availability
    if (!this.checkAvailability(data.objectId, startDateTime, endDateTime)) {
      throw new Error('Object is not available for the requested time period');
    }

    // Create the reservation
    return reservationStore.create({
      userId,
      objectId: data.objectId,
      startDateTime,
      endDateTime,
      notes: data.notes
    });
  }

  /**
   * Update an existing reservation with conflict checking
   */
  updateReservation(reservationId: string, userId: string, updates: Partial<CreateReservationRequest>): Reservation {
    const reservation = reservationStore.findById(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Check ownership (users can only modify their own reservations)
    if (reservation.userId !== userId) {
      throw new Error('Not authorized to modify this reservation');
    }

    // If updating dates, validate availability
    if (updates.startDateTime || updates.endDateTime) {
      const startDateTime = updates.startDateTime ? new Date(updates.startDateTime) : reservation.startDateTime;
      const endDateTime = updates.endDateTime ? new Date(updates.endDateTime) : reservation.endDateTime;

      if (startDateTime >= endDateTime) {
        throw new Error('Start date must be before end date');
      }

      if (startDateTime < new Date()) {
        throw new Error('Cannot update reservation to start in the past');
      }

      // Check availability (excluding current reservation)
      if (!this.checkAvailability(reservation.objectId, startDateTime, endDateTime, reservationId)) {
        throw new Error('Object is not available for the updated time period');
      }
    }

    // Apply updates
    const updateData: any = {};
    if (updates.startDateTime) updateData.startDateTime = new Date(updates.startDateTime);
    if (updates.endDateTime) updateData.endDateTime = new Date(updates.endDateTime);
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const updated = reservationStore.update(reservationId, updateData);
    if (!updated) {
      throw new Error('Failed to update reservation');
    }

    return updated;
  }

  /**
   * Cancel a reservation
   */
  cancelReservation(reservationId: string, userId: string): Reservation {
    const reservation = reservationStore.findById(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Check ownership
    if (reservation.userId !== userId) {
      throw new Error('Not authorized to cancel this reservation');
    }

    // Check if reservation can be cancelled
    if (reservation.status !== ReservationStatus.ACTIVE) {
      throw new Error('Only active reservations can be cancelled');
    }

    const cancelled = reservationStore.cancel(reservationId);
    if (!cancelled) {
      throw new Error('Failed to cancel reservation');
    }

    return cancelled;
  }

  /**
   * Get user's reservations with optional filtering
   */
  getUserReservations(userId: string, includeInactive: boolean = false): Reservation[] {
    const userReservations = reservationStore.findByUserId(userId);
    
    if (includeInactive) {
      return userReservations;
    }

    return userReservations.filter(res => res.status === ReservationStatus.ACTIVE);
  }

  /**
   * Validate date format and convert to Date object
   */
  private validateAndParseDate(dateString: string, fieldName: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ${fieldName} format. Please use ISO 8601 format.`);
    }
    return date;
  }
}

// Export singleton instance
export const reservationService = new ReservationService();