import { ref, computed } from 'vue';
import { api } from '../services/api';
import { 
  ReservableObject, 
  ReservableObjectType, 
  Reservation, 
  ReservationFormData,
  AvailabilityResponse,
  ReservationStatus
} from '../types/reservations';
import { formDataToReservationRequest, validateReservationForm } from '../utils/reservationUtils';

export function useReservations() {
  // State
  const objects = ref<ReservableObject[]>([]);
  const reservations = ref<Reservation[]>([]);
  const selectedObject = ref<ReservableObject | null>(null);
  const availabilityResult = ref<AvailabilityResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const desks = computed(() => 
    objects.value.filter(obj => obj.type === ReservableObjectType.DESK)
  );

  const parkingSpaces = computed(() => 
    objects.value.filter(obj => obj.type === ReservableObjectType.PARKING_SPACE)
  );

  const activeReservations = computed(() =>
    reservations.value.filter(res => res.status === ReservationStatus.ACTIVE)
  );

  const upcomingReservations = computed(() => {
    const now = new Date();
    return activeReservations.value.filter(res => new Date(res.startDateTime) > now);
  });

  // Actions
  async function loadObjects() {
    try {
      isLoading.value = true;
      error.value = null;
      objects.value = await api.getReservableObjects();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load objects';
      console.error('Error loading objects:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadObjectsByType(type: ReservableObjectType) {
    try {
      isLoading.value = true;
      error.value = null;
      objects.value = await api.getObjectsByType(type);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load objects';
      console.error('Error loading objects by type:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadUserReservations() {
    try {
      isLoading.value = true;
      error.value = null;
      reservations.value = await api.getUserReservations();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load reservations';
      console.error('Error loading reservations:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function checkAvailability(objectId: string, startDateTime: string, endDateTime: string) {
    try {
      isLoading.value = true;
      error.value = null;
      availabilityResult.value = await api.checkAvailability({
        objectId,
        startDateTime,
        endDateTime
      });
      return availabilityResult.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to check availability';
      console.error('Error checking availability:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function createReservation(formData: ReservationFormData) {
    try {
      isLoading.value = true;
      error.value = null;

      // Validate form data
      const validation = validateReservationForm(formData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Convert form data to API request
      const request = formDataToReservationRequest(formData);
      
      // Create reservation
      const newReservation = await api.createReservation(request);
      
      // Add to local state
      reservations.value.unshift(newReservation);
      
      return newReservation;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create reservation';
      console.error('Error creating reservation:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function cancelReservation(reservationId: string) {
    try {
      isLoading.value = true;
      error.value = null;
      
      await api.cancelReservation(reservationId);
      
      // Update local state
      const index = reservations.value.findIndex(res => res.id === reservationId);
      if (index !== -1) {
        reservations.value[index].status = ReservationStatus.CANCELLED;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to cancel reservation';
      console.error('Error cancelling reservation:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function selectObject(object: ReservableObject) {
    selectedObject.value = object;
    availabilityResult.value = null;
  }

  function clearSelection() {
    selectedObject.value = null;
    availabilityResult.value = null;
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    objects,
    reservations,
    selectedObject,
    availabilityResult,
    isLoading,
    error,
    
    // Computed
    desks,
    parkingSpaces,
    activeReservations,
    upcomingReservations,
    
    // Actions
    loadObjects,
    loadObjectsByType,
    loadUserReservations,
    checkAvailability,
    createReservation,
    cancelReservation,
    selectObject,
    clearSelection,
    clearError
  };
}