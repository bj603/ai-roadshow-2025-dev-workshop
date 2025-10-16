import { ReservableObject, Desk, ParkingSpace, Reservation, ReservableObjectType, ReservationStatus } from '../types/reservations.js';

// In-memory storage using Maps for better performance
class ReservationStorage {
  private objects: Map<string, ReservableObject> = new Map();
  private reservations: Map<string, Reservation> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  // Reservable Objects CRUD operations
  getAllObjects(): ReservableObject[] {
    return Array.from(this.objects.values()).filter(obj => obj.isActive);
  }

  getObjectsByType(type: ReservableObjectType): ReservableObject[] {
    return this.getAllObjects().filter(obj => obj.type === type);
  }

  getObjectById(id: string): ReservableObject | undefined {
    const obj = this.objects.get(id);
    return obj?.isActive ? obj : undefined;
  }

  addObject(object: ReservableObject): void {
    this.objects.set(object.id, object);
  }

  updateObject(id: string, updates: Partial<ReservableObject>): boolean {
    const existing = this.objects.get(id);
    if (!existing) return false;
    
    const updated = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.objects.set(id, updated);
    return true;
  }

  // Reservations CRUD operations
  getAllReservations(): Reservation[] {
    return Array.from(this.reservations.values());
  }

  getReservationsByUserId(userId: string): Reservation[] {
    return this.getAllReservations().filter(res => res.userId === userId);
  }

  getReservationsByObjectId(objectId: string): Reservation[] {
    return this.getAllReservations().filter(res => res.objectId === objectId);
  }

  getReservationById(id: string): Reservation | undefined {
    return this.reservations.get(id);
  }

  addReservation(reservation: Reservation): void {
    this.reservations.set(reservation.id, reservation);
  }

  updateReservation(id: string, updates: Partial<Reservation>): boolean {
    const existing = this.reservations.get(id);
    if (!existing) return false;
    
    const updated = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.reservations.set(id, updated);
    return true;
  }

  deleteReservation(id: string): boolean {
    return this.reservations.delete(id);
  }

  // Helper method to get active reservations for an object within a time range
  getActiveReservationsInRange(objectId: string, startDateTime: string, endDateTime: string): Reservation[] {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    return this.getReservationsByObjectId(objectId)
      .filter(res => res.status === ReservationStatus.ACTIVE)
      .filter(res => {
        const resStart = new Date(res.startDateTime);
        const resEnd = new Date(res.endDateTime);
        
        // Check for time overlap: reservation overlaps if it starts before our end and ends after our start
        return resStart < end && resEnd > start;
      });
  }

  private initializeSampleData(): void {
    const now = new Date().toISOString();

    // Sample Desks
    const desks: Desk[] = [
      {
        id: 'desk-001',
        name: 'Desk A1',
        location: 'Floor 1, Zone A',
        type: ReservableObjectType.DESK,
        equipment: ['Monitor', 'Keyboard', 'Mouse'],
        capacity: 1,
        hasMonitor: true,
        hasPhone: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'desk-002',
        name: 'Desk A2',
        location: 'Floor 1, Zone A',
        type: ReservableObjectType.DESK,
        equipment: ['Monitor', 'Keyboard', 'Mouse', 'Webcam'],
        capacity: 1,
        hasMonitor: true,
        hasPhone: false,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'desk-003',
        name: 'Desk B1',
        location: 'Floor 2, Zone B',
        type: ReservableObjectType.DESK,
        equipment: ['Dual Monitor', 'Keyboard', 'Mouse', 'Docking Station'],
        capacity: 1,
        hasMonitor: true,
        hasPhone: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    // Sample Parking Spaces
    const parkingSpaces: ParkingSpace[] = [
      {
        id: 'parking-001',
        name: 'Parking Space P1-01',
        location: 'Level P1',
        type: ReservableObjectType.PARKING_SPACE,
        level: 'P1',
        isHandicapAccessible: false,
        isElectricVehicleCharging: false,
        spaceNumber: '01',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'parking-002',
        name: 'Parking Space P1-02',
        location: 'Level P1',
        type: ReservableObjectType.PARKING_SPACE,
        level: 'P1',
        isHandicapAccessible: true,
        isElectricVehicleCharging: false,
        spaceNumber: '02',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'parking-003',
        name: 'Parking Space P1-03',
        location: 'Level P1',
        type: ReservableObjectType.PARKING_SPACE,
        level: 'P1',
        isHandicapAccessible: false,
        isElectricVehicleCharging: true,
        spaceNumber: '03',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    // Add sample data to storage
    [...desks, ...parkingSpaces].forEach(obj => this.addObject(obj));

    // Add some sample reservations for demonstration
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(17, 0, 0, 0);

    const sampleReservation: Reservation = {
      id: 'res-001',
      objectId: 'desk-001',
      objectType: ReservableObjectType.DESK,
      userId: '1', // Admin user from server.ts
      startDateTime: tomorrow.toISOString(),
      endDateTime: tomorrowEnd.toISOString(),
      status: ReservationStatus.ACTIVE,
      notes: 'All-day meeting room setup',
      createdAt: now,
      updatedAt: now
    };

    this.addReservation(sampleReservation);
  }
}

// Singleton instance
export const reservationStorage = new ReservationStorage();