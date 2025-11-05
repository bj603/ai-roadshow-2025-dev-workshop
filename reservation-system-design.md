# Workspace Reservation System Extension Design

## Overview
Extend the current workspace reservation system with parking spaces and desks reservation capabilities while maintaining the existing authentication and role-based access control.

## 1. Data Models

### ReservableObject (Base Interface)
```typescript
interface ReservableObject {
  id: string;
  name: string;
  type: 'parking' | 'desk';
  location: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### ParkingSpace
```typescript
interface ParkingSpace extends ReservableObject {
  type: 'parking';
  level: number; // Floor level or parking deck
  spotNumber: string;
  isCovered: boolean;
  isEVCharging: boolean;
  isAccessible: boolean;
}
```

### Desk
```typescript
interface Desk extends ReservableObject {
  type: 'desk';
  workspaceType: 'hotdesk' | 'dedicated' | 'meeting_room';
  equipment: string[]; // ['monitor', 'phone', 'ethernet']
  maxOccupants: number;
  hasWindow: boolean;
}
```

### Reservation
```typescript
interface Reservation {
  id: string;
  objectId: string; // References ParkingSpace or Desk
  objectType: 'parking' | 'desk';
  userId: string;
  userEmail: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  date: string;      // YYYY-MM-DD format
  status: 'active' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
}
```

## 2. Backend API Endpoints

### Reservable Objects Management
```
GET    /api/objects                 # List all objects (with filters)
GET    /api/objects/:id             # Get specific object
POST   /api/objects                 # Create new object (Admin only)
PUT    /api/objects/:id             # Update object (Admin/Manager only)
DELETE /api/objects/:id             # Delete object (Admin only)
```

### Reservations Management
```
GET    /api/reservations            # Get user's reservations
GET    /api/reservations/available  # Get available objects for date/time
POST   /api/reservations            # Create new reservation
PUT    /api/reservations/:id        # Update reservation
DELETE /api/reservations/:id        # Cancel reservation
GET    /api/reservations/conflicts  # Check for booking conflicts
```

### Admin/Manager Endpoints
```
GET    /api/admin/reservations      # All reservations (Admin/Manager)
GET    /api/admin/objects/analytics # Usage statistics
PUT    /api/admin/reservations/:id/status # Update reservation status
```

## 3. Reservation Logic & Conflict Detection

### Time Slot System
- **Granularity**: 30-minute slots
- **Booking Window**: Users can book up to 30 days in advance
- **Minimum Duration**: 1 hour
- **Maximum Duration**: 8 hours per day

### Conflict Detection Algorithm
```typescript
function checkConflict(
  newStart: Date, 
  newEnd: Date, 
  existingReservations: Reservation[]
): boolean {
  return existingReservations.some(reservation => {
    const existingStart = new Date(reservation.startTime);
    const existingEnd = new Date(reservation.endTime);
    
    // Check for time overlap
    return (newStart < existingEnd && newEnd > existingStart);
  });
}
```

### Availability Rules
1. **Overlap Detection**: No overlapping reservations for same object
2. **Advance Booking**: Max 30 days ahead
3. **Same-Day Booking**: Allowed up to 1 hour before start time
4. **Cancellation**: Up to 2 hours before reservation start

## 4. Frontend Component Architecture

### New Vue Components
```
src/components/
├── reservations/
│   ├── ReservationCard.vue      # Display reservation details
│   ├── AvailabilityGrid.vue     # Visual availability calendar
│   ├── ReservationForm.vue      # Booking form
│   └── ReservationList.vue      # User's reservations
├── objects/
│   ├── ObjectCard.vue           # Parking space/desk display
│   └── ObjectFilters.vue        # Filter objects by type/criteria
└── common/
    ├── TimeSlotPicker.vue       # Date/time selection
    └── ConflictAlert.vue        # Show booking conflicts
```

### Route Additions
```typescript
// src/router/index.ts additions
{
  path: '/reservations',
  name: 'Reservations',
  component: () => import('@/views/Reservations.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/objects',
  name: 'Objects',
  component: () => import('@/views/Objects.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/admin/objects',
  name: 'AdminObjects',
  component: () => import('@/views/AdminObjects.vue'),
  meta: { requiresAuth: true, roles: ['admin', 'manager'] }
}
```

### Service Extensions
```typescript
// src/services/reservations.ts
export const reservationsService = {
  getAvailableObjects: (date: string, startTime: string, endTime: string) => 
    callAPI(`reservations/available?date=${date}&start=${startTime}&end=${endTime}`),
  
  createReservation: (reservationData: CreateReservationRequest) =>
    callProtectedAPI('reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    }),
  
  getUserReservations: () =>
    callProtectedAPI('reservations'),
  
  cancelReservation: (id: string) =>
    callProtectedAPI(`reservations/${id}`, { method: 'DELETE' })
};

// src/services/objects.ts
export const objectsService = {
  getObjects: (filters?: ObjectFilters) =>
    callAPI(`objects${buildQueryString(filters)}`),
  
  createObject: (objectData: CreateObjectRequest) =>
    callProtectedAPI('objects', {
      method: 'POST',
      body: JSON.stringify(objectData)
    })
};
```

## 5. User Experience Flow

### Booking Flow
1. **Object Selection**: User browses available parking spaces/desks
2. **Date/Time Selection**: Interactive calendar with time slots
3. **Availability Check**: Real-time availability verification
4. **Confirmation**: Review booking details before submit
5. **Success**: Confirmation message with reservation details

### Reservation Management
1. **Dashboard**: List of upcoming/past reservations
2. **Actions**: Cancel/modify reservations (within time limits)
3. **Details**: Full reservation information and access instructions

### Admin Interface
1. **Object Management**: CRUD operations for parking spaces/desks
2. **Reservation Overview**: All reservations with filtering
3. **Analytics**: Usage statistics and popular time slots

## 6. In-Memory Data Structure

### Mock Data for POC
```typescript
// server/src/data.ts
export const mockParkingSpaces: ParkingSpace[] = [
  {
    id: 'park-001',
    name: 'Parking Space A1',
    type: 'parking',
    location: 'Ground Floor - Section A',
    capacity: 1,
    level: 0,
    spotNumber: 'A1',
    isCovered: true,
    isEVCharging: false,
    isAccessible: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // ... more parking spaces
];

export const mockDesks: Desk[] = [
  {
    id: 'desk-001',
    name: 'Hot Desk 1',
    type: 'desk',
    location: 'Floor 2 - Open Office',
    capacity: 1,
    workspaceType: 'hotdesk',
    equipment: ['monitor', 'ethernet'],
    maxOccupants: 1,
    hasWindow: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // ... more desks
];
```

## 7. Implementation Priority

### Phase 1: Core Backend (Days 1-2)
1. Extend server.ts with new endpoints
2. Implement data models and validation
3. Add conflict detection logic
4. Create mock data structures

### Phase 2: Frontend Core (Days 3-4)
1. Extend API services
2. Create object listing components
3. Build reservation form components
4. Implement availability checking

### Phase 3: Advanced Features (Days 5-6)
1. Real-time availability display
2. Reservation management interface
3. Admin object management
4. User dashboard improvements

### Phase 4: Polish & Testing (Days 7-8)
1. Error handling and validation
2. Responsive design improvements
3. Performance optimization
4. Cross-browser testing

## 8. Security Considerations

### Role-Based Access Control
- **Admin**: Full CRUD on objects and all reservations
- **Manager**: CRUD on objects, view all reservations
- **User**: Create/view/cancel own reservations only

### Validation Rules
- Input sanitization for all reservation data
- Rate limiting on booking attempts
- Time zone handling for consistent booking times
- CSRF protection on state-changing operations

### Error Handling
- Consistent error response format
- Meaningful error messages for users
- Logging for administrative debugging
- Graceful degradation for service failures