import { 
  ReservableObject, 
  Reservation, 
  ReservableObjectType, 
  ReservationStatus 
} from './types';

// In-memory storage for reservable objects
class ReservableObjectStore {
  private objects: Map<string, ReservableObject> = new Map();
  private nextId = 1;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Sample desks
    this.create({
      name: 'Desk A1',
      type: ReservableObjectType.DESK,
      location: 'Floor 1, Section A',
      description: 'Window desk with natural light'
    });

    this.create({
      name: 'Desk A2',
      type: ReservableObjectType.DESK,
      location: 'Floor 1, Section A',
      description: 'Quiet corner desk'
    });

    this.create({
      name: 'Desk B1',
      type: ReservableObjectType.DESK,
      location: 'Floor 1, Section B',
      description: 'Standing desk with dual monitor setup'
    });

    // Sample parking spaces
    this.create({
      name: 'Parking Spot 1',
      type: ReservableObjectType.PARKING_SPACE,
      location: 'Ground Level, Row A',
      description: 'Close to elevator'
    });

    this.create({
      name: 'Parking Spot 2',
      type: ReservableObjectType.PARKING_SPACE,
      location: 'Ground Level, Row A',
      description: 'Regular parking space'
    });

    this.create({
      name: 'Parking Spot 3',
      type: ReservableObjectType.PARKING_SPACE,
      location: 'Underground Level 1',
      description: 'Covered parking'
    });
  }

  create(data: Omit<ReservableObject, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>): ReservableObject {
    const id = this.nextId.toString();
    this.nextId++;

    const object: ReservableObject = {
      id,
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.objects.set(id, object);
    return object;
  }

  findAll(): ReservableObject[] {
    return Array.from(this.objects.values()).filter(obj => obj.isActive);
  }

  findById(id: string): ReservableObject | undefined {
    const object = this.objects.get(id);
    return object && object.isActive ? object : undefined;
  }

  findByType(type: ReservableObjectType): ReservableObject[] {
    return Array.from(this.objects.values())
      .filter(obj => obj.isActive && obj.type === type);
  }

  update(id: string, data: Partial<Omit<ReservableObject, 'id' | 'createdAt'>>): ReservableObject | undefined {
    const object = this.objects.get(id);
    if (!object) return undefined;

    const updated: ReservableObject = {
      ...object,
      ...data,
      updatedAt: new Date()
    };

    this.objects.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    const object = this.objects.get(id);
    if (!object) return false;

    // Soft delete by setting isActive to false
    this.update(id, { isActive: false });
    return true;
  }
}

// In-memory storage for reservations
class ReservationStore {
  private reservations: Map<string, Reservation> = new Map();
  private nextId = 1;

  create(data: Omit<Reservation, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Reservation {
    const id = this.nextId.toString();
    this.nextId++;

    const reservation: Reservation = {
      id,
      ...data,
      status: ReservationStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.reservations.set(id, reservation);
    return reservation;
  }

  findAll(): Reservation[] {
    return Array.from(this.reservations.values());
  }

  findById(id: string): Reservation | undefined {
    return this.reservations.get(id);
  }

  findByUserId(userId: string): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(res => res.userId === userId);
  }

  findByObjectId(objectId: string): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(res => res.objectId === objectId);
  }

  findActiveReservations(): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(res => res.status === ReservationStatus.ACTIVE);
  }

  findConflicting(objectId: string, startDateTime: Date, endDateTime: Date, excludeReservationId?: string): Reservation[] {
    return this.findActiveReservations()
      .filter(res => {
        if (res.objectId !== objectId) return false;
        if (excludeReservationId && res.id === excludeReservationId) return false;

        // Check for time overlap
        const resStart = new Date(res.startDateTime);
        const resEnd = new Date(res.endDateTime);

        return (
          (startDateTime >= resStart && startDateTime < resEnd) ||
          (endDateTime > resStart && endDateTime <= resEnd) ||
          (startDateTime <= resStart && endDateTime >= resEnd)
        );
      });
  }

  update(id: string, data: Partial<Omit<Reservation, 'id' | 'createdAt'>>): Reservation | undefined {
    const reservation = this.reservations.get(id);
    if (!reservation) return undefined;

    const updated: Reservation = {
      ...reservation,
      ...data,
      updatedAt: new Date()
    };

    this.reservations.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.reservations.delete(id);
  }

  cancel(id: string): Reservation | undefined {
    return this.update(id, { status: ReservationStatus.CANCELLED });
  }
}

// Export singleton instances
export const objectStore = new ReservableObjectStore();
export const reservationStore = new ReservationStore();