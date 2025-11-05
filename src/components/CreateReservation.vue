<template>
  <div class="create-reservation">
    <div class="header">
      <h3>{{ title }}</h3>
      <p class="subtitle">Book a desk or parking space for your visit</p>
    </div>

    <form @submit.prevent="submitReservation" class="reservation-form">
      <!-- Object Type Selection -->
      <div class="form-section">
        <label class="section-label">What would you like to reserve?</label>
        <div class="type-selector">
          <button 
            type="button"
            v-for="type in objectTypes" 
            :key="type.value"
            @click="selectedType = type.value"
            :class="{ active: selectedType === type.value }"
            class="type-btn"
          >
            <span class="icon">{{ type.icon }}</span>
            <span class="label">{{ type.label }}</span>
          </button>
        </div>
      </div>

      <!-- Date and Time Selection -->
      <div class="form-section">
        <label class="section-label">When do you need it?</label>
        <div class="datetime-grid">
          <div class="field-group">
            <label for="startDate">Start Date</label>
            <input 
              id="startDate"
              type="date" 
              v-model="form.startDate"
              :min="minDate"
              :max="maxDate"
              required
            />
          </div>
          
          <div class="field-group">
            <label for="startTime">Start Time</label>
            <input 
              id="startTime"
              type="time" 
              v-model="form.startTime"
              required
            />
          </div>
          
          <div class="field-group">
            <label for="endDate">End Date</label>
            <input 
              id="endDate"
              type="date" 
              v-model="form.endDate"
              :min="form.startDate || minDate"
              :max="maxDate"
              required
            />
          </div>
          
          <div class="field-group">
            <label for="endTime">End Time</label>
            <input 
              id="endTime"
              type="time" 
              v-model="form.endTime"
              required
            />
          </div>
        </div>
        
        <div v-if="reservationDuration" class="duration-display">
          Duration: {{ reservationDuration }}
        </div>
      </div>

      <!-- Object Selection -->
      <div v-if="selectedType && isValidTimeRange" class="form-section">
        <label class="section-label">Choose your {{ selectedType }}</label>
        
        <div v-if="loadingAvailability" class="loading">
          Checking availability...
        </div>
        
        <div v-else-if="availabilityError" class="error">
          {{ availabilityError }}
          <button type="button" @click="checkAvailability" class="retry-btn">Retry</button>
        </div>
        
        <div v-else-if="availableObjects.length === 0" class="empty">
          No {{ selectedType }} spaces available for the selected time period.
        </div>
        
        <div v-else class="object-grid">
          <div 
            v-for="object in availableObjects"
            :key="object.id"
            @click="form.objectId = object.id"
            :class="{ selected: form.objectId === object.id }"
            class="object-card"
          >
            <div class="object-header">
              <span class="object-icon">{{ getObjectIcon(object.type) }}</span>
              <span class="object-id">{{ object.id }}</span>
            </div>
            <div class="object-location">{{ object.location }}</div>
            <div v-if="object.metadata" class="object-features">
              <span 
                v-for="feature in getObjectFeatures(object.metadata)"
                :key="feature"
                class="feature-tag"
              >
                {{ feature }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Validation Messages -->
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <h4>Please fix the following issues:</h4>
        <ul>
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <!-- Submit Button -->
      <div class="form-actions">
        <button 
          type="submit" 
          :disabled="!canSubmit || submitting"
          class="submit-btn"
        >
          {{ submitting ? 'Creating Reservation...' : 'Create Reservation' }}
        </button>
        
        <button type="button" @click="resetForm" class="reset-btn">
          Reset Form
        </button>
      </div>
    </form>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
      <button @click="successMessage = ''" class="close-btn">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { api } from '../services/api';
import type { ReservableObject, ReservationFormData } from '../types/reservations';

interface Props {
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: 'Create Reservation'
});

// Emit events
const emit = defineEmits<{
  reservationCreated: [reservationId: string];
}>();

// Reactive state
const selectedType = ref<'desk' | 'parking'>('desk');
const form = ref<ReservationFormData>({
  objectId: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: ''
});

const availableObjects = ref<ReservableObject[]>([]);
const loadingAvailability = ref(false);
const availabilityError = ref<string | null>(null);
const submitting = ref(false);
const successMessage = ref('');
const validationErrors = ref<string[]>([]);

// Constants
const objectTypes = [
  { value: 'desk', label: 'Desk', icon: '🖥️' },
  { value: 'parking', label: 'Parking Space', icon: '🚗' }
] as const;

// Computed properties
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const maxDate = computed(() => {
  const today = new Date();
  const maxAdvance = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return maxAdvance.toISOString().split('T')[0];
});

const isValidTimeRange = computed(() => {
  if (!form.value.startDate || !form.value.startTime || !form.value.endDate || !form.value.endTime) {
    return false;
  }
  
  const start = new Date(`${form.value.startDate}T${form.value.startTime}`);
  const end = new Date(`${form.value.endDate}T${form.value.endTime}`);
  
  return start < end && start > new Date();
});

const reservationDuration = computed(() => {
  if (!isValidTimeRange.value) return null;
  
  const start = new Date(`${form.value.startDate}T${form.value.startTime}`);
  const end = new Date(`${form.value.endDate}T${form.value.endTime}`);
  const durationMs = end.getTime() - start.getTime();
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (minutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minutes`;
  }
});

const canSubmit = computed(() => {
  return isValidTimeRange.value && 
         form.value.objectId && 
         validationErrors.value.length === 0 &&
         !submitting.value;
});

// Helper functions
const getObjectIcon = (type: string): string => {
  return type === 'desk' ? '🖥️' : '🚗';
};

const getObjectFeatures = (metadata: Record<string, any>): string[] => {
  const features: string[] = [];
  
  if (metadata.hasMonitor) features.push('Monitor');
  if (metadata.isHandicapAccessible) features.push('Accessible');
  if (metadata.floor) features.push(`Floor ${metadata.floor}`);
  if (metadata.zone) features.push(`Zone ${metadata.zone}`);
  
  return features;
};

const validateForm = (): string[] => {
  const errors: string[] = [];
  
  if (!selectedType.value) {
    errors.push('Please select a reservation type');
  }
  
  if (!form.value.startDate || !form.value.startTime) {
    errors.push('Please select a start date and time');
  }
  
  if (!form.value.endDate || !form.value.endTime) {
    errors.push('Please select an end date and time');
  }
  
  if (!isValidTimeRange.value) {
    errors.push('End time must be after start time, and start time must be in the future');
  }
  
  // Business rule validations
  if (isValidTimeRange.value) {
    const start = new Date(`${form.value.startDate}T${form.value.startTime}`);
    const end = new Date(`${form.value.endDate}T${form.value.endTime}`);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (durationHours < 0.5) {
      errors.push('Reservations must be at least 30 minutes');
    }
    
    if (durationHours > 24) {
      errors.push('Reservations cannot exceed 24 hours');
    }
    
    // Desk-specific validations
    if (selectedType.value === 'desk') {
      const startDay = start.getDay();
      const endDay = end.getDay();
      
      if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
        errors.push('Desk reservations are only allowed on weekdays');
      }
      
      const startHour = start.getHours();
      const endHour = end.getHours();
      
      if (startHour < 9 || endHour > 18) {
        errors.push('Desk reservations must be within business hours (9 AM to 6 PM)');
      }
    }
  }
  
  if (!form.value.objectId) {
    errors.push('Please select a specific object to reserve');
  }
  
  return errors;
};

// API functions
const checkAvailability = async () => {
  if (!isValidTimeRange.value) return;
  
  loadingAvailability.value = true;
  availabilityError.value = null;
  form.value.objectId = ''; // Reset selection
  
  try {
    const startDateTime = new Date(`${form.value.startDate}T${form.value.startTime}`).toISOString();
    const endDateTime = new Date(`${form.value.endDate}T${form.value.endTime}`).toISOString();
    
    const response = await api.getAvailableObjects(startDateTime, endDateTime, selectedType.value);
    availableObjects.value = response.data || [];
  } catch (err) {
    availabilityError.value = err instanceof Error ? err.message : 'Failed to check availability';
    availableObjects.value = [];
  } finally {
    loadingAvailability.value = false;
  }
};

const submitReservation = async () => {
  // Validate form
  validationErrors.value = validateForm();
  if (validationErrors.value.length > 0) {
    return;
  }
  
  submitting.value = true;
  
  try {
    const startDateTime = new Date(`${form.value.startDate}T${form.value.startTime}`).toISOString();
    const endDateTime = new Date(`${form.value.endDate}T${form.value.endTime}`).toISOString();
    
    const response = await api.createReservation({
      objectId: form.value.objectId,
      startDateTime,
      endDateTime
    });
    
    if (response.success && response.data) {
      successMessage.value = `Reservation created successfully! Reservation ID: ${response.data.id}`;
      emit('reservationCreated', response.data.id);
      resetForm();
    }
  } catch (err) {
    validationErrors.value = [err instanceof Error ? err.message : 'Failed to create reservation'];
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  form.value = {
    objectId: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  };
  availableObjects.value = [];
  validationErrors.value = [];
  successMessage.value = '';
  selectedType.value = 'desk';
};

// Watchers
watch([selectedType, () => form.value.startDate, () => form.value.startTime, () => form.value.endDate, () => form.value.endTime], 
  () => {
    if (isValidTimeRange.value) {
      validationErrors.value = []; // Clear errors when form becomes valid
      checkAvailability();
    } else {
      availableObjects.value = [];
      form.value.objectId = '';
    }
  }
);

// Initialize with today's date
const today = new Date();
form.value.startDate = today.toISOString().split('T')[0];
form.value.endDate = today.toISOString().split('T')[0];
</script>

<style scoped>
.create-reservation {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.header h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 28px;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.reservation-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.section-label {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.type-selector {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.type-btn:hover {
  border-color: #007bff;
  transform: translateY(-2px);
}

.type-btn.active {
  border-color: #007bff;
  background: #f8f9ff;
}

.type-btn .icon {
  font-size: 24px;
}

.type-btn .label {
  font-weight: 500;
  color: #333;
}

.datetime-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-group label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.field-group input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.field-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.duration-display {
  background: #e3f2fd;
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: 500;
  color: #1565c0;
  text-align: center;
}

.loading, .error, .empty {
  text-align: center;
  padding: 20px;
  color: #666;
  background: #f8f9fa;
  border-radius: 6px;
}

.error {
  color: #dc3545;
  background: #f8d7da;
}

.retry-btn {
  margin-left: 10px;
  padding: 4px 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.object-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.object-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.object-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.object-card.selected {
  border-color: #007bff;
  background: #f8f9ff;
}

.object-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.object-icon {
  font-size: 18px;
}

.object-id {
  font-weight: 600;
  color: #333;
}

.object-location {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.object-features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-tag {
  background: #e9ecef;
  color: #495057;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 500;
}

.validation-errors {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 15px;
  color: #721c24;
}

.validation-errors h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.validation-errors ul {
  margin: 0;
  padding-left: 20px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.submit-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #218838;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.reset-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: #5a6268;
}

.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #d4edda;
  color: #155724;
  padding: 15px 20px;
  border-radius: 6px;
  border: 1px solid #c3e6cb;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  z-index: 1000;
  max-width: 400px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #155724;
  padding: 0;
  line-height: 1;
}

@media (max-width: 768px) {
  .datetime-grid {
    grid-template-columns: 1fr;
  }
  
  .object-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .success-message {
    position: relative;
    top: auto;
    right: auto;
    margin-top: 20px;
  }
}
</style>