import { ParkingSpace, Desk, Reservation } from './types';

// Mock parking spaces with diverse features and locations
export const mockParkingSpaces: ParkingSpace[] = [
  {
    id: 'park-001',
    name: 'Premium Spot A1',
    type: 'parking',
    location: 'Ground Floor - Section A',
    capacity: 1,
    level: 0,
    spotNumber: 'A1',
    isCovered: true,
    isEVCharging: true,
    isAccessible: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-002',
    name: 'Standard Spot A2',
    type: 'parking',
    location: 'Ground Floor - Section A',
    capacity: 1,
    level: 0,
    spotNumber: 'A2',
    isCovered: false,
    isEVCharging: false,
    isAccessible: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-003',
    name: 'Covered Spot B1',
    type: 'parking',
    location: 'Ground Floor - Section B',
    capacity: 1,
    level: 0,
    spotNumber: 'B1',
    isCovered: true,
    isEVCharging: false,
    isAccessible: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-004',
    name: 'EV Charging Spot C1',
    type: 'parking',
    location: 'First Floor - Section C',
    capacity: 1,
    level: 1,
    spotNumber: 'C1',
    isCovered: true,
    isEVCharging: true,
    isAccessible: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-005',
    name: 'Standard Spot C2',
    type: 'parking',
    location: 'First Floor - Section C',
    capacity: 1,
    level: 1,
    spotNumber: 'C2',
    isCovered: true,
    isEVCharging: false,
    isAccessible: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-006',
    name: 'Accessible Spot D1',
    type: 'parking',
    location: 'First Floor - Section D',
    capacity: 1,
    level: 1,
    spotNumber: 'D1',
    isCovered: false,
    isEVCharging: false,
    isAccessible: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-007',
    name: 'Premium EV Spot E1',
    type: 'parking',
    location: 'Second Floor - Section E',
    capacity: 1,
    level: 2,
    spotNumber: 'E1',
    isCovered: true,
    isEVCharging: true,
    isAccessible: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-008',
    name: 'Standard Spot E2',
    type: 'parking',
    location: 'Second Floor - Section E',
    capacity: 1,
    level: 2,
    spotNumber: 'E2',
    isCovered: true,
    isEVCharging: false,
    isAccessible: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-009',
    name: 'Covered Spot F1',
    type: 'parking',
    location: 'Second Floor - Section F',
    capacity: 1,
    level: 2,
    spotNumber: 'F1',
    isCovered: true,
    isEVCharging: false,
    isAccessible: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-010',
    name: 'Standard Spot F2',
    type: 'parking',
    location: 'Second Floor - Section F',
    capacity: 1,
    level: 2,
    spotNumber: 'F2',
    isCovered: false,
    isEVCharging: true,
    isAccessible: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-011',
    name: 'Visitor Spot G1',
    type: 'parking',
    location: 'Ground Floor - Visitor Area',
    capacity: 1,
    level: 0,
    spotNumber: 'G1',
    isCovered: true,
    isEVCharging: false,
    isAccessible: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'park-012',
    name: 'VIP Spot H1',
    type: 'parking',
    location: 'Ground Floor - VIP Section',
    capacity: 1,
    level: 0,
    spotNumber: 'H1',
    isCovered: true,
    isEVCharging: true,
    isAccessible: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  }
];

// Mock desks with various workspace types and equipment
export const mockDesks: Desk[] = [
  {
    id: 'desk-001',
    name: 'Hot Desk 1 - Window Seat',
    type: 'desk',
    location: 'Floor 2 - Open Office Zone A',
    capacity: 1,
    workspaceType: 'hotdesk',
    equipment: ['monitor', 'ethernet', 'phone'],
    maxOccupants: 1,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-002',
    name: 'Hot Desk 2 - Interior',
    type: 'desk',
    location: 'Floor 2 - Open Office Zone A',
    capacity: 1,
    workspaceType: 'hotdesk',
    equipment: ['monitor', 'ethernet'],
    maxOccupants: 1,
    hasWindow: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-003',
    name: 'Dedicated Desk A1',
    type: 'desk',
    location: 'Floor 3 - Dedicated Section A',
    capacity: 1,
    workspaceType: 'dedicated',
    equipment: ['monitor', 'ethernet', 'phone', 'keyboard', 'mouse'],
    maxOccupants: 1,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-004',
    name: 'Dedicated Desk A2',
    type: 'desk',
    location: 'Floor 3 - Dedicated Section A',
    capacity: 1,
    workspaceType: 'dedicated',
    equipment: ['monitor', 'ethernet', 'keyboard'],
    maxOccupants: 1,
    hasWindow: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-005',
    name: 'Meeting Room Alpha',
    type: 'desk',
    location: 'Floor 4 - Meeting Rooms',
    capacity: 8,
    workspaceType: 'meeting_room',
    equipment: ['projector', 'whiteboard', 'ethernet', 'video_conference'],
    maxOccupants: 8,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-006',
    name: 'Meeting Room Beta',
    type: 'desk',
    location: 'Floor 4 - Meeting Rooms',
    capacity: 6,
    workspaceType: 'meeting_room',
    equipment: ['projector', 'whiteboard', 'ethernet'],
    maxOccupants: 6,
    hasWindow: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-007',
    name: 'Hot Desk 3 - Creative Zone',
    type: 'desk',
    location: 'Floor 2 - Creative Zone',
    capacity: 1,
    workspaceType: 'hotdesk',
    equipment: ['monitor', 'ethernet', 'tablet_stylus'],
    maxOccupants: 1,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-008',
    name: 'Hot Desk 4 - Quiet Zone',
    type: 'desk',
    location: 'Floor 3 - Quiet Zone',
    capacity: 1,
    workspaceType: 'hotdesk',
    equipment: ['monitor', 'ethernet', 'headphone_jack'],
    maxOccupants: 1,
    hasWindow: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-009',
    name: 'Dedicated Desk B1',
    type: 'desk',
    location: 'Floor 3 - Dedicated Section B',
    capacity: 1,
    workspaceType: 'dedicated',
    equipment: ['dual_monitors', 'ethernet', 'phone', 'ergonomic_chair'],
    maxOccupants: 1,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-010',
    name: 'Meeting Room Gamma',
    type: 'desk',
    location: 'Floor 4 - Meeting Rooms',
    capacity: 12,
    workspaceType: 'meeting_room',
    equipment: ['large_projector', 'whiteboard', 'ethernet', 'video_conference', 'sound_system'],
    maxOccupants: 12,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-011',
    name: 'Hot Desk 5 - Focus Pod',
    type: 'desk',
    location: 'Floor 2 - Focus Area',
    capacity: 1,
    workspaceType: 'hotdesk',
    equipment: ['monitor', 'ethernet', 'noise_cancelling'],
    maxOccupants: 1,
    hasWindow: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-012',
    name: 'Dedicated Desk C1',
    type: 'desk',
    location: 'Floor 3 - Dedicated Section C',
    capacity: 1,
    workspaceType: 'dedicated',
    equipment: ['monitor', 'ethernet', 'phone', 'standing_desk'],
    maxOccupants: 1,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-013',
    name: 'Hot Desk 6 - Collaboration',
    type: 'desk',
    location: 'Floor 2 - Collaboration Zone',
    capacity: 2,
    workspaceType: 'hotdesk',
    equipment: ['monitor', 'ethernet', 'wireless_charging'],
    maxOccupants: 2,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-014',
    name: 'Meeting Room Delta',
    type: 'desk',
    location: 'Floor 4 - Meeting Rooms',
    capacity: 4,
    workspaceType: 'meeting_room',
    equipment: ['projector', 'whiteboard', 'ethernet'],
    maxOccupants: 4,
    hasWindow: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-015',
    name: 'Dedicated Desk D1',
    type: 'desk',
    location: 'Floor 3 - Dedicated Section D',
    capacity: 1,
    workspaceType: 'dedicated',
    equipment: ['monitor', 'ethernet', 'phone', 'dual_monitors', 'webcam'],
    maxOccupants: 1,
    hasWindow: false,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-016',
    name: 'Hot Desk 7 - Executive',
    type: 'desk',
    location: 'Floor 5 - Executive Floor',
    capacity: 1,
    workspaceType: 'hotdesk',
    equipment: ['monitor', 'ethernet', 'phone', 'premium_chair'],
    maxOccupants: 1,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-017',
    name: 'Meeting Room Executive Suite',
    type: 'desk',
    location: 'Floor 5 - Executive Floor',
    capacity: 16,
    workspaceType: 'meeting_room',
    equipment: ['large_projector', 'whiteboard', 'ethernet', 'video_conference', 'sound_system', 'executive_seating'],
    maxOccupants: 16,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'desk-018',
    name: 'Hot Desk 8 - Innovation Lab',
    type: 'desk',
    location: 'Floor 6 - Innovation Lab',
    capacity: 1,
    workspaceType: 'hotdesk',
    equipment: ['monitor', 'ethernet', 'arduino', 'raspberry_pi'],
    maxOccupants: 1,
    hasWindow: true,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  }
];

// Sample reservation data for testing
export const mockReservations: Reservation[] = [
  {
    id: 'res-001',
    objectId: 'park-001',
    objectType: 'parking',
    userId: '3',
    userEmail: 'user@example.com',
    startTime: '2024-10-30T09:00:00.000Z',
    endTime: '2024-10-30T17:00:00.000Z',
    date: '2024-10-30',
    status: 'active',
    createdAt: new Date('2024-10-29').toISOString(),
    updatedAt: new Date('2024-10-29').toISOString()
  },
  {
    id: 'res-002',
    objectId: 'desk-001',
    objectType: 'desk',
    userId: '3',
    userEmail: 'user@example.com',
    startTime: '2024-10-30T10:00:00.000Z',
    endTime: '2024-10-30T16:00:00.000Z',
    date: '2024-10-30',
    status: 'active',
    createdAt: new Date('2024-10-29').toISOString(),
    updatedAt: new Date('2024-10-29').toISOString()
  },
  {
    id: 'res-003',
    objectId: 'desk-005',
    objectType: 'desk',
    userId: '2',
    userEmail: 'manager@example.com',
    startTime: '2024-10-30T14:00:00.000Z',
    endTime: '2024-10-30T16:00:00.000Z',
    date: '2024-10-30',
    status: 'active',
    createdAt: new Date('2024-10-29').toISOString(),
    updatedAt: new Date('2024-10-29').toISOString()
  },
  {
    id: 'res-004',
    objectId: 'park-004',
    objectType: 'parking',
    userId: '2',
    userEmail: 'manager@example.com',
    startTime: '2024-10-31T08:00:00.000Z',
    endTime: '2024-10-31T18:00:00.000Z',
    date: '2024-10-31',
    status: 'active',
    createdAt: new Date('2024-10-29').toISOString(),
    updatedAt: new Date('2024-10-29').toISOString()
  },
  {
    id: 'res-005',
    objectId: 'desk-003',
    objectType: 'desk',
    userId: '1',
    userEmail: 'admin@example.com',
    startTime: '2024-11-01T09:00:00.000Z',
    endTime: '2024-11-01T17:00:00.000Z',
    date: '2024-11-01',
    status: 'active',
    createdAt: new Date('2024-10-29').toISOString(),
    updatedAt: new Date('2024-10-29').toISOString()
  },
  {
    id: 'res-006',
    objectId: 'park-007',
    objectType: 'parking',
    userId: '3',
    userEmail: 'user@example.com',
    startTime: '2024-11-01T09:00:00.000Z',
    endTime: '2024-11-01T17:00:00.000Z',
    date: '2024-11-01',
    status: 'active',
    createdAt: new Date('2024-10-29').toISOString(),
    updatedAt: new Date('2024-10-29').toISOString()
  }
];

// In-memory data store for runtime modifications
export const dataStore = {
  parkingSpaces: [...mockParkingSpaces],
  desks: [...mockDesks],
  reservations: [...mockReservations]
};

// Helper function to generate unique IDs
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`;
}

// Helper function to check time conflicts
export function hasTimeConflict(
  newStart: Date, 
  newEnd: Date, 
  existingReservations: Reservation[]
): boolean {
  return existingReservations.some(reservation => {
    if (reservation.status !== 'active') return false;
    
    const existingStart = new Date(reservation.startTime);
    const existingEnd = new Date(reservation.endTime);
    
    // Check for time overlap
    return (newStart < existingEnd && newEnd > existingStart);
  });
}

// Helper function to get available objects
export function getAvailableObjects(
  type: 'parking' | 'desk',
  date: string,
  startTime: string,
  endTime: string
) {
  const targetStart = new Date(`${date}T${startTime}`);
  const targetEnd = new Date(`${date}T${endTime}`);
  
  const objects = type === 'parking' ? dataStore.parkingSpaces : dataStore.desks;
  
  return objects.filter(object => {
    if (!object.isActive) return false;
    
    const objectReservations = dataStore.reservations.filter(
      res => res.objectId === object.id && res.date === date && res.status === 'active'
    );
    
    return !hasTimeConflict(targetStart, targetEnd, objectReservations);
  });
}