<template>
  <div class="reservation-form">
    <form @submit.prevent="handleSubmit">
      <!-- Object Information (Read-only) -->
      <div class="form-section">
        <h4>Reserving</h4>
        <div class="object-info">
          <div class="object-summary">
            <span class="object-icon">
              {{ object.type === 'DESK' ? '🖥️' : '🚗' }}
            </span>
            <div class="object-details">
              <strong>{{ object.name }}</strong>
              <span class="object-location">{{ object.location }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Date and Time Selection -->
      <div class="form-section">
        <h4>Date & Time</h4>
        
        <div class="datetime-grid">
          <div class="form-group">
            <label for="start-date">Start Date</label>
            <input 
              id="start-date"
              type="date"
              v-model="formData.startDate"
              :min="minDate"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="start-time">Start Time</label>
            <input 
              id="start-time"
              type="time"
              v-model="formData.startTime"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="end-date">End Date</label>
            <input 
              id="end-date"
              type="date"
              v-model="formData.endDate"
              :min="formData.startDate || minDate"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="end-time">End Time</label>
            <input 
              id="end-time"
              type="time"
              v-model="formData.endTime"
              required
            />
          </div>
        </div>

        <!-- Duration Display -->
        <div v-if="estimatedDuration" class="duration-display">
          <span class="duration-label">Duration:</span>
          <span class="duration-value">{{ estimatedDuration }}</span>
        </div>
      </div>

      <!-- Availability Check -->
      <div class="form-section">
        <div class="availability-section">
          <button 
            type="button"
            @click="checkAvailability"
            :disabled="!canCheckAvailability || isCheckingAvailability"
            class="btn-secondary"
          >
            {{ isCheckingAvailability ? 'Checking...' : 'Check Availability' }}
          </button>

          <!-- Availability Result -->
          <div v-if="availabilityResult" class="availability-result">
            <div v-if="availabilityResult.isAvailable" class="availability-success">
              ✅ Available! You can proceed with the reservation.
            </div>
            <div v-else class="availability-conflict">
              ❌ Not available. There are {{ availabilityResult.conflictingReservations?.length || 0 }} conflicting reservation(s).
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-section">
        <div class="form-group">
          <label for="notes">Notes (Optional)</label>
          <textarea 
            id="notes"
            v-model="formData.notes"
            placeholder="Add any additional notes for this reservation..."
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Validation Errors -->
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <h5>Please fix the following errors:</h5>
        <ul>
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <!-- General Error -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button 
          type="button" 
          @click="$emit('cancel')"
          class="btn-secondary"
        >
          Cancel
        </button>
        <button 
          type="submit"
          :disabled="!canSubmit || isSubmitting"
          class="btn-primary"
        >
          {{ isSubmitting ? 'Creating...' : 'Create Reservation' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ReservableObject, Reservation, ReservationFormData, AvailabilityResponse } from '../types/reservations';
import { useReservations } from '../composables/useReservations';
import { 
  getDefaultReservationForm, 
  validateReservationForm, 
  calculateDuration,
  formatDateForInput
} from '../utils/reservationUtils';

// Props
interface Props {
  object: ReservableObject;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  reservationCreated: [reservation: Reservation]
  cancel: []
}>();

// State
const formData = ref<ReservationFormData>(getDefaultReservationForm());
const availabilityResult = ref<AvailabilityResponse | null>(null);
const isCheckingAvailability = ref(false);
const isSubmitting = ref(false);
const error = ref<string | null>(null);

// Composable
const { checkAvailability: checkAvailabilityAPI, createReservation } = useReservations();

// Computed
const minDate = computed(() => formatDateForInput(new Date()));

const estimatedDuration = computed(() => {
  if (formData.value.startDate && formData.value.startTime && 
      formData.value.endDate && formData.value.endTime) {
    try {
      const startDateTime = `${formData.value.startDate}T${formData.value.startTime}:00`;
      const endDateTime = `${formData.value.endDate}T${formData.value.endTime}:00`;
      return calculateDuration(startDateTime, endDateTime);
    } catch {
      return null;
    }
  }
  return null;
});

const canCheckAvailability = computed(() => {
  return formData.value.startDate && formData.value.startTime && 
         formData.value.endDate && formData.value.endTime;
});

const validation = computed(() => validateReservationForm(formData.value));
const validationErrors = computed(() => validation.value.errors);

const canSubmit = computed(() => {
  return validation.value.valid && 
         availabilityResult.value?.isAvailable === true &&
         !isSubmitting.value;
});

// Methods
async function checkAvailability() {
  if (!canCheckAvailability.value) return;

  isCheckingAvailability.value = true;
  error.value = null;

  try {
    const startDateTime = `${formData.value.startDate}T${formData.value.startTime}:00.000Z`;
    const endDateTime = `${formData.value.endDate}T${formData.value.endTime}:00.000Z`;

    availabilityResult.value = await checkAvailabilityAPI(
      props.object.id,
      startDateTime,
      endDateTime
    );
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to check availability';
    availabilityResult.value = null;
  } finally {
    isCheckingAvailability.value = false;
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return;

  isSubmitting.value = true;
  error.value = null;

  try {
    const reservation = await createReservation(formData.value);
    emit('reservationCreated', reservation);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create reservation';
  } finally {
    isSubmitting.value = false;
  }
}

// Watchers
watch(() => [formData.value.startDate, formData.value.startTime, formData.value.endDate, formData.value.endTime], () => {
  // Clear availability result when dates/times change
  availabilityResult.value = null;
});

// Initialize form data
onMounted(() => {
  formData.value = getDefaultReservationForm(
    props.object.id,
    props.object.name,
    props.object.type
  );
});
</script>

<style scoped>
.reservation-form {
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.object-info {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
}

.object-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.object-icon {
  font-size: 1.5rem;
}

.object-details {
  display: flex;
  flex-direction: column;
}

.object-location {
  color: #64748b;
  font-size: 0.875rem;
}

.datetime-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.duration-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-top: 1rem;
}

.duration-label {
  font-weight: 500;
  color: #1e40af;
}

.duration-value {
  font-weight: 600;
  color: #1e40af;
}

.availability-section {
  space-y: 1rem;
}

.availability-result {
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-top: 1rem;
}

.availability-success {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 0.75rem;
  border-radius: 0.375rem;
}

.availability-conflict {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.375rem;
}

.validation-errors {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.validation-errors h5 {
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.validation-errors ul {
  margin: 0;
  padding-left: 1.25rem;
}

.validation-errors li {
  color: #dc2626;
  font-size: 0.875rem;
}

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 0.75rem;
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .datetime-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .availability-section {
    text-align: center;
  }
}
</style>