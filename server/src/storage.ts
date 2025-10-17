import { 
  ReservableObject, 
  Reservation, 
  ReservableObjectType,
  CreateReservableObjectRequest,
  UpdateReservableObjectRequest,
  CreateReservationRequest,
  UpdateReservationRequest,
  TimeSlot,
  AvailabilityCheck,
  ReservationConflict
} from './models';

// Utility function to generate unique IDs
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Utility function to convert duration to end date
function calculateEndDateTime(startDateTime: Date, durationMinutes: number): Date {
  return new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
}

// Utility function to parse date strings
function parseDate(date: string | Date): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

export class ReservableObjectStorage {
  private objects: Map<string, ReservableObject> = new Map();

  // Create a new reservable object
  create(request: CreateReservableObjectRequest): ReservableObject {
    const now = new Date();
    const object: ReservableObject = {
      id: generateId(),
      type: request.type,
      name: request.name,
      location: request.location,
      description: request.description,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    this.objects.set(object.id, object);
    return object;
  }

  // Get object by ID
  getById(id: string): ReservableObject | undefined {
    return this.objects.get(id);
  }

  // Get all objects, optionally filtered by type
  getAll(type?: ReservableObjectType): ReservableObject[] {
    const allObjects = Array.from(this.objects.values());
    
    if (type) {
      return allObjects.filter(obj => obj.type === type);
    }
    
    return allObjects;
  }

  // Get active objects only
  getActive(type?: ReservableObjectType): ReservableObject[] {
    return this.getAll(type).filter(obj => obj.isActive);
  }

  // Update an object
  update(id: string, request: UpdateReservableObjectRequest): ReservableObject | null {
    const object = this.objects.get(id);
    if (!object) {
      return null;
    }

    const updatedObject: ReservableObject = {
      ...object,
      name: request.name ?? object.name,
      location: request.location ?? object.location,
      description: request.description ?? object.description,
      isActive: request.isActive ?? object.isActive,
      updatedAt: new Date()
    };

    this.objects.set(id, updatedObject);
    return updatedObject;
  }

  // Delete an object (soft delete by setting isActive to false)
  delete(id: string): boolean {
    const object = this.objects.get(id);
    if (!object) {
      return false;
    }

    const updatedObject = {
      ...object,
      isActive: false,
      updatedAt: new Date()
    };

    this.objects.set(id, updatedObject);
    return true;
  }

  // Hard delete (completely remove from storage)
  hardDelete(id: string): boolean {
    return this.objects.delete(id);
  }

  // Search objects by name or location
  search(query: string): ReservableObject[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.objects.values()).filter(obj =>
      obj.name.toLowerCase().includes(searchTerm) ||
      obj.location.toLowerCase().includes(searchTerm) ||
      (obj.description && obj.description.toLowerCase().includes(searchTerm))
    );
  }
}

export class ReservationStorage {
  private reservations: Map<string, Reservation> = new Map();

  // Create a new reservation
  create(request: CreateReservationRequest): Reservation | null {
    const startDateTime = parseDate(request.startDateTime);
    let endDateTime: Date;

    // Handle duration vs endDateTime
    if (request.endDateTime) {
      endDateTime = parseDate(request.endDateTime);
    } else if (request.duration) {
      endDateTime = calculateEndDateTime(startDateTime, request.duration);
    } else {
      // Default to 1 hour if neither is provided
      endDateTime = calculateEndDateTime(startDateTime, 60);
    }

    // Validate time period
    if (startDateTime >= endDateTime) {
      throw new Error('End time must be after start time');
    }

    // Check for conflicts
    const conflicts = this.findConflicts(request.objectId, { start: startDateTime, end: endDateTime });
    if (conflicts.length > 0) {
      throw new Error('Time slot conflicts with existing reservations');
    }

    const now = new Date();
    const reservation: Reservation = {
      id: generateId(),
      objectId: request.objectId,
      userId: request.userId,
      startDateTime,
      endDateTime,
      description: request.description,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  // Get reservation by ID
  getById(id: string): Reservation | undefined {
    return this.reservations.get(id);
  }

  // Get all reservations
  getAll(): Reservation[] {
    return Array.from(this.reservations.values());
  }

  // Get reservations for a specific object
  getByObjectId(objectId: string): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(reservation => reservation.objectId === objectId && reservation.isActive);
  }

  // Get reservations for a specific user
  getByUserId(userId: string): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(reservation => reservation.userId === userId && reservation.isActive);
  }

  // Update a reservation
  update(id: string, request: UpdateReservationRequest): Reservation | null {
    const reservation = this.reservations.get(id);
    if (!reservation) {
      return null;
    }

    let startDateTime = reservation.startDateTime;
    let endDateTime = reservation.endDateTime;

    // Handle time updates
    if (request.startDateTime) {
      startDateTime = parseDate(request.startDateTime);
    }

    if (request.endDateTime) {
      endDateTime = parseDate(request.endDateTime);
    } else if (request.duration) {
      endDateTime = calculateEndDateTime(startDateTime, request.duration);
    }

    // Validate time period
    if (startDateTime >= endDateTime) {
      throw new Error('End time must be after start time');
    }

    // Check for conflicts (excluding current reservation)
    const timeSlot = { start: startDateTime, end: endDateTime };
    const conflicts = this.findConflicts(reservation.objectId, timeSlot, id);
    if (conflicts.length > 0) {
      throw new Error('Updated time slot conflicts with existing reservations');
    }

    const updatedReservation: Reservation = {
      ...reservation,
      startDateTime,
      endDateTime,
      description: request.description ?? reservation.description,
      isActive: request.isActive ?? reservation.isActive,
      updatedAt: new Date()
    };

    this.reservations.set(id, updatedReservation);
    return updatedReservation;
  }

  // Delete a reservation (soft delete)
  delete(id: string): boolean {
    const reservation = this.reservations.get(id);
    if (!reservation) {
      return false;
    }

    const updatedReservation = {
      ...reservation,
      isActive: false,
      updatedAt: new Date()
    };

    this.reservations.set(id, updatedReservation);
    return true;
  }

  // Hard delete
  hardDelete(id: string): boolean {
    return this.reservations.delete(id);
  }

  // Check availability for a specific object and time slot
  checkAvailability(objectId: string, timeSlot: TimeSlot): AvailabilityCheck {
    const conflicts = this.findConflicts(objectId, timeSlot);
    
    return {
      objectId,
      timeSlot,
      isAvailable: conflicts.length === 0,
      conflictingReservations: conflicts.length > 0 ? conflicts : undefined
    };
  }

  // Find conflicting reservations for a time slot
  findConflicts(objectId: string, timeSlot: TimeSlot, excludeReservationId?: string): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(reservation => {
        if (!reservation.isActive || reservation.objectId !== objectId) {
          return false;
        }

        if (excludeReservationId && reservation.id === excludeReservationId) {
          return false;
        }

        // Check for overlap: reservations overlap if start < other.end AND end > other.start
        return timeSlot.start < reservation.endDateTime && timeSlot.end > reservation.startDateTime;
      });
  }

  // Get reservations for a date range
  getByDateRange(startDate: Date, endDate: Date, objectId?: string): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(reservation => {
        if (!reservation.isActive) {
          return false;
        }

        if (objectId && reservation.objectId !== objectId) {
          return false;
        }

        // Check if reservation overlaps with date range
        return reservation.startDateTime < endDate && reservation.endDateTime > startDate;
      });
  }
}

// Singleton instances for global use
export const reservableObjectStorage = new ReservableObjectStorage();
export const reservationStorage = new ReservationStorage();