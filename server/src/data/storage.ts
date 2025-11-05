import { ReservableObject, Reservation, CreateReservationRequest } from '../types/index.js';

/**
 * In-memory storage for reservable objects and reservations
 */
class Storage {
  private reservableObjects: ReservableObject[] = [];
  private reservations: Reservation[] = [];

  // ========== RESERVABLE OBJECTS OPERATIONS ==========

  /**
   * Get all reservable objects
   */
  getAllObjects(): ReservableObject[] {
    return [...this.reservableObjects];
  }

  /**
   * Get a reservable object by ID
   */
  getObjectById(id: string): ReservableObject | undefined {
    return this.reservableObjects.find(obj => obj.id === id);
  }

  /**
   * Get objects by type
   */
  getObjectsByType(type: 'desk' | 'parking'): ReservableObject[] {
    return this.reservableObjects.filter(obj => obj.type === type);
  }

  /**
   * Add a new reservable object
   */
  addObject(object: ReservableObject): ReservableObject {
    this.reservableObjects.push(object);
    return object;
  }

  /**
   * Update an existing reservable object
   */
  updateObject(id: string, updates: Partial<ReservableObject>): ReservableObject | null {
    const index = this.reservableObjects.findIndex(obj => obj.id === id);
    if (index === -1) return null;
    
    this.reservableObjects[index] = { ...this.reservableObjects[index], ...updates };
    return this.reservableObjects[index];
  }

  /**
   * Delete a reservable object
   */
  deleteObject(id: string): boolean {
    const index = this.reservableObjects.findIndex(obj => obj.id === id);
    if (index === -1) return false;
    
    this.reservableObjects.splice(index, 1);
    return true;
  }

  // ========== RESERVATIONS OPERATIONS ==========

  /**
   * Get all reservations
   */
  getAllReservations(): Reservation[] {
    return [...this.reservations];
  }

  /**
   * Get a reservation by ID
   */
  getReservationById(id: string): Reservation | undefined {
    return this.reservations.find(res => res.id === id);
  }

  /**
   * Get reservations for a specific object
   */
  getReservationsByObjectId(objectId: string): Reservation[] {
    return this.reservations.filter(res => res.objectId === objectId);
  }

  /**
   * Get reservations for a specific user
   */
  getReservationsByUserId(userId: string): Reservation[] {
    return this.reservations.filter(res => res.userId === userId);
  }

  /**
   * Get active reservations for an object within a time range
   */
  getActiveReservationsInRange(objectId: string, startDateTime: string, endDateTime: string): Reservation[] {
    return this.reservations.filter(res => 
      res.objectId === objectId &&
      res.status === 'active' &&
      this.timeRangesOverlap(res.startDateTime, res.endDateTime, startDateTime, endDateTime)
    );
  }

  /**
   * Create a new reservation
   */
  createReservation(request: CreateReservationRequest): Reservation {
    const reservation: Reservation = {
      id: this.generateId(),
      objectId: request.objectId,
      userId: request.userId,
      startDateTime: request.startDateTime,
      endDateTime: request.endDateTime,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    this.reservations.push(reservation);
    return reservation;
  }

  /**
   * Update an existing reservation
   */
  updateReservation(id: string, updates: Partial<Reservation>): Reservation | null {
    const index = this.reservations.findIndex(res => res.id === id);
    if (index === -1) return null;
    
    this.reservations[index] = { ...this.reservations[index], ...updates };
    return this.reservations[index];
  }

  /**
   * Cancel a reservation (set status to cancelled)
   */
  cancelReservation(id: string): Reservation | null {
    return this.updateReservation(id, { status: 'cancelled' });
  }

  /**
   * Delete a reservation
   */
  deleteReservation(id: string): boolean {
    const index = this.reservations.findIndex(res => res.id === id);
    if (index === -1) return false;
    
    this.reservations.splice(index, 1);
    return true;
  }

  // ========== UTILITY METHODS ==========

  /**
   * Check if two time ranges overlap
   */
  private timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const startTime1 = new Date(start1).getTime();
    const endTime1 = new Date(end1).getTime();
    const startTime2 = new Date(start2).getTime();
    const endTime2 = new Date(end2).getTime();

    return startTime1 < endTime2 && startTime2 < endTime1;
  }

  /**
   * Generate a simple unique ID
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // ========== DATA SEEDING ==========

  /**
   * Initialize storage with sample data
   */
  seedData(): void {
    // Sample desk objects
    this.addObject({
      id: 'desk-001',
      type: 'desk',
      location: 'Floor 1, Zone A, Desk 1',
      isAvailable: true,
      metadata: { floor: 1, zone: 'A', hasMonitor: true }
    });

    this.addObject({
      id: 'desk-002',
      type: 'desk',
      location: 'Floor 1, Zone A, Desk 2',
      isAvailable: true,
      metadata: { floor: 1, zone: 'A', hasMonitor: false }
    });

    this.addObject({
      id: 'desk-003',
      type: 'desk',
      location: 'Floor 2, Zone B, Desk 1',
      isAvailable: true,
      metadata: { floor: 2, zone: 'B', hasMonitor: true }
    });

    // Sample parking spaces
    this.addObject({
      id: 'parking-001',
      type: 'parking',
      location: 'Parking Garage Level 1, Spot A1',
      isAvailable: true,
      metadata: { level: 1, zone: 'A', isHandicapAccessible: false }
    });

    this.addObject({
      id: 'parking-002',
      type: 'parking',
      location: 'Parking Garage Level 1, Spot A2',
      isAvailable: true,
      metadata: { level: 1, zone: 'A', isHandicapAccessible: true }
    });

    console.log('Storage seeded with sample data');
  }

  /**
   * Clear all data (useful for testing)
   */
  clearAll(): void {
    this.reservableObjects = [];
    this.reservations = [];
  }

  /**
   * Get storage statistics
   */
  getStats(): { objectCount: number; reservationCount: number; activeReservations: number } {
    return {
      objectCount: this.reservableObjects.length,
      reservationCount: this.reservations.length,
      activeReservations: this.reservations.filter(r => r.status === 'active').length
    };
  }
}

// Create and export a singleton instance
export const storage = new Storage();

// Seed with initial data
storage.seedData();