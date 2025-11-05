import { storage } from '../data/storage.js';
import { ReservableObject, Reservation, CreateReservationRequest, AvailabilityResponse } from '../types/index.js';

/**
 * Business logic service for managing reservations
 */
export class ReservationService {

  /**
   * Check if an object is available for a specific time period
   */
  checkAvailability(objectId: string, startDateTime: string, endDateTime: string): AvailabilityResponse {
    // Check if object exists
    const object = storage.getObjectById(objectId);
    if (!object) {
      return {
        available: false,
        conflictingReservations: []
      };
    }

    // Check if object is generally available
    if (!object.isAvailable) {
      return {
        available: false,
        conflictingReservations: []
      };
    }

    // Check for conflicting reservations
    const conflictingReservations = storage.getActiveReservationsInRange(
      objectId, 
      startDateTime, 
      endDateTime
    );

    return {
      available: conflictingReservations.length === 0,
      conflictingReservations: conflictingReservations.length > 0 ? conflictingReservations : undefined
    };
  }

  /**
   * Create a new reservation
   */
  createReservation(request: CreateReservationRequest): { success: boolean; reservation?: Reservation; error?: string } {
    try {
      // Validate input
      const validation = this.validateReservationRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Check availability
      const availability = this.checkAvailability(request.objectId, request.startDateTime, request.endDateTime);
      if (!availability.available) {
        return { 
          success: false, 
          error: `Object is not available for the requested time period. ${availability.conflictingReservations?.length || 0} conflicting reservations found.`
        };
      }

      // Create the reservation
      const reservation = storage.createReservation(request);
      
      return { success: true, reservation };

    } catch (error) {
      return { success: false, error: `Failed to create reservation: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Cancel a reservation
   */
  cancelReservation(reservationId: string, userId: string): { success: boolean; reservation?: Reservation; error?: string } {
    try {
      const reservation = storage.getReservationById(reservationId);
      
      if (!reservation) {
        return { success: false, error: 'Reservation not found' };
      }

      // Check if user owns the reservation (basic authorization)
      if (reservation.userId !== userId) {
        return { success: false, error: 'Unauthorized: You can only cancel your own reservations' };
      }

      // Check if reservation is already cancelled or completed
      if (reservation.status !== 'active') {
        return { success: false, error: `Cannot cancel reservation with status: ${reservation.status}` };
      }

      // Cancel the reservation
      const updatedReservation = storage.cancelReservation(reservationId);
      
      if (!updatedReservation) {
        return { success: false, error: 'Failed to cancel reservation' };
      }

      return { success: true, reservation: updatedReservation };

    } catch (error) {
      return { success: false, error: `Failed to cancel reservation: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get all reservations for a specific object
   */
  getReservationsForObject(objectId: string): Reservation[] {
    return storage.getReservationsByObjectId(objectId);
  }

  /**
   * Get all reservations for a specific user
   */
  getReservationsForUser(userId: string): Reservation[] {
    return storage.getReservationsByUserId(userId);
  }

  /**
   * Get active reservations for a user
   */
  getActiveReservationsForUser(userId: string): Reservation[] {
    return storage.getReservationsByUserId(userId).filter(r => r.status === 'active');
  }

  /**
   * Get upcoming reservations for a user (starting within next 24 hours)
   */
  getUpcomingReservationsForUser(userId: string): Reservation[] {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return storage.getReservationsByUserId(userId)
      .filter(r => {
        const startTime = new Date(r.startDateTime);
        return r.status === 'active' && startTime >= now && startTime <= next24Hours;
      })
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }

  /**
   * Complete reservations that have ended
   */
  completeExpiredReservations(): number {
    const now = new Date().toISOString();
    const activeReservations = storage.getAllReservations().filter(r => r.status === 'active');
    let completedCount = 0;

    for (const reservation of activeReservations) {
      if (reservation.endDateTime <= now) {
        storage.updateReservation(reservation.id, { status: 'completed' });
        completedCount++;
      }
    }

    return completedCount;
  }

  /**
   * Get all available objects for a specific time period
   */
  getAvailableObjects(startDateTime: string, endDateTime: string, type?: 'desk' | 'parking'): ReservableObject[] {
    let objects = storage.getAllObjects();
    
    if (type) {
      objects = objects.filter(obj => obj.type === type);
    }

    return objects.filter(obj => {
      if (!obj.isAvailable) return false;
      
      const availability = this.checkAvailability(obj.id, startDateTime, endDateTime);
      return availability.available;
    });
  }

  /**
   * Validate reservation request
   */
  private validateReservationRequest(request: CreateReservationRequest): { valid: boolean; error?: string } {
    // Check required fields
    if (!request.objectId || !request.userId || !request.startDateTime || !request.endDateTime) {
      return { valid: false, error: 'Missing required fields: objectId, userId, startDateTime, endDateTime' };
    }

    // Validate dates
    const startDate = new Date(request.startDateTime);
    const endDate = new Date(request.endDateTime);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { valid: false, error: 'Invalid date format. Use ISO 8601 format (e.g., 2025-11-05T10:00:00.000Z)' };
    }

    if (startDate >= endDate) {
      return { valid: false, error: 'Start date must be before end date' };
    }

    if (startDate < now) {
      return { valid: false, error: 'Cannot create reservations in the past' };
    }

    // Check if object exists
    const object = storage.getObjectById(request.objectId);
    if (!object) {
      return { valid: false, error: `Object with ID ${request.objectId} not found` };
    }

    // Business rules validation
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    
    if (durationHours > 24) {
      return { valid: false, error: 'Reservations cannot exceed 24 hours' };
    }

    if (durationHours < 0.5) {
      return { valid: false, error: 'Reservations must be at least 30 minutes' };
    }

    return { valid: true };
  }
}

// Create and export a singleton instance
export const reservationService = new ReservationService();