# Reservation System API Reference

## Frontend Integration Overview

### 📁 Files Added in Phase 3:

#### Type Definitions
- **`src/types/reservations.ts`** - Complete TypeScript interfaces mirroring backend types
- **`src/utils/reservationUtils.ts`** - Utility functions for date/time handling and form validation
- **`src/composables/useReservations.ts`** - Vue 3 composable for reservation state management

### 🔧 API Service Extensions

The existing `src/services/api.ts` has been extended with:

#### Public API Methods (No Authentication)
```typescript
api.getReservableObjects()           // Get all objects
api.getObjectsByType(type)          // Filter by DESK/PARKING_SPACE
api.getObjectById(id)               // Get specific object
api.checkAvailability(check)        // Check time slot availability
```

#### Protected API Methods (JWT Required)
```typescript
api.getUserReservations()           // Current user's reservations
api.createReservation(request)      // Create new reservation
api.getReservationById(id)          // Get specific reservation
api.cancelReservation(id)           // Cancel reservation
api.getUpcomingReservations()       // Next 7 days
api.getObjectReservations(objectId) // Admin/manager only
```

### 🎯 Vue 3 Composable Usage

```vue
<script setup lang="ts">
import { useReservations } from '@/composables/useReservations';

const {
  // State
  objects, reservations, selectedObject, isLoading, error,
  
  // Computed
  desks, parkingSpaces, activeReservations, upcomingReservations,
  
  // Actions
  loadObjects, loadUserReservations, checkAvailability,
  createReservation, cancelReservation, selectObject
} = useReservations();
</script>
```

### 🛠️ Utility Functions

```typescript
import { 
  formatDateTime, formatDate, formatTime,
  calculateDuration, isToday, isFuture, isCurrentlyActive,
  formDataToReservationRequest, validateReservationForm,
  getDefaultReservationForm
} from '@/utils/reservationUtils';
```

### 📊 Type Safety

All API calls and data structures are fully typed with TypeScript:
- **ReservableObject**, **Desk**, **ParkingSpace** - Object types
- **Reservation**, **ReservationStatus** - Reservation data
- **CreateReservationRequest**, **AvailabilityCheck** - API requests
- **ReservationFormData** - Frontend form handling
- **ReservationUIState** - Component state management

### 🔐 Authentication Integration

- Uses existing `callProtectedAPI` pattern from auth system
- JWT tokens automatically included in protected requests
- Error handling follows existing API error format: `{ detail: "message" }`

### ✅ Build Status

- ✅ **Frontend TypeScript**: Compiles successfully
- ✅ **Backend TypeScript**: Compiles successfully
- ✅ **Type Safety**: All interfaces properly typed
- ✅ **API Integration**: Ready for Vue component usage

### 🚀 Ready for Phase 4

The frontend data layer is complete and ready for Vue component implementation:
- **Complete API integration** with reservation endpoints
- **Type-safe** data handling throughout
- **Vue 3 composable** for easy state management
- **Utility functions** for common operations
- **Form validation** and data conversion helpers

Next: Create Vue components and views for the reservation system.