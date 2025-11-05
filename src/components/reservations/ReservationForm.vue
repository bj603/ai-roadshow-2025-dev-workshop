<template>
  <div class="reservation-form">
    <div class="form-header">
      <h2 class="form-title">Book {{ objectTypeLabel }}</h2>
      <p v-if="selectedObject" class="object-title">{{ selectedObject.name }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="form-content">
      <!-- Object Selection -->
      <div v-if="!selectedObject" class="form-section">
        <label class="form-label">Select {{ objectTypeLabel }}</label>
        <div class="object-selection">
          <div
            v-for="object in availableObjects"
            :key="getObjectId(object)"
            @click="selectObject(object)"
            class="object-option"
            :class="{ selected: isObjectSelected(object) }"
          >
            <div class="object-info">
              <span class="object-name">{{ object.name }}</span>
              <span class="object-location">{{ object.location }}</span>
              <div class="object-features" v-if="isParkingObject(object)">
                <span v-if="(object as any).isEVCharging" class="feature-badge">⚡ EV</span>
                <span v-if="(object as any).isCovered" class="feature-badge">🏠</span>
                <span v-if="(object as any).isAccessible" class="feature-badge">♿</span>
              </div>
              <div class="object-features" v-else>
                <span v-if="(object as any).workspaceType === 'meeting_room'" class="feature-badge">👥 {{ (object as any).capacity }}</span>
                <span v-if="(object as any).hasWindow" class="feature-badge">🌅</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Object Summary -->
      <div v-if="selectedObject" class="form-section">
        <div class="selected-object-summary">
          <div class="object-header">
            <span class="object-icon">{{ getTypeIcon(selectedObject.type) }}</span>
            <div class="object-details">
              <h3 class="object-name">{{ selectedObject.name }}</h3>
              <p class="object-location">{{ selectedObject.location }}</p>
            </div>
            <button type="button" @click="clearObjectSelection" class="change-object-btn">
              Change
            </button>
          </div>
          
          <!-- Object Features -->
          <div v-if="selectedObject.type === 'parking'" class="object-features-list">
            <div class="feature-item">
              <span class="feature-label">Level:</span>
              <span class="feature-value">Floor {{ (selectedObject as ParkingSpace).level }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">Spot:</span>
              <span class="feature-value">{{ (selectedObject as ParkingSpace).spotNumber }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">Capacity:</span>
              <span class="feature-value">{{ selectedObject.capacity }} vehicle</span>
            </div>
            <div class="feature-list">
              <span v-if="(selectedObject as ParkingSpace).isCovered" class="feature-badge">🏠 Covered</span>
              <span v-if="(selectedObject as ParkingSpace).isEVCharging" class="feature-badge">⚡ EV Charging</span>
              <span v-if="(selectedObject as ParkingSpace).isAccessible" class="feature-badge">♿ Accessible</span>
            </div>
          </div>

          <div v-else class="object-features-list">
            <div class="feature-item">
              <span class="feature-label">Type:</span>
              <span class="feature-value">{{ formatWorkspaceType((selectedObject as Desk).workspaceType) }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">Capacity:</span>
              <span class="feature-value">{{ (selectedObject as Desk).maxOccupants || selectedObject.capacity }} {{ (selectedObject as Desk).maxOccupants === 1 ? 'person' : 'people' }}</span>
            </div>
            <div v-if="(selectedObject as Desk).equipment?.length" class="equipment-list">
              <span class="feature-label">Equipment:</span>
              <div class="equipment-tags">
                <span 
                  v-for="equipment in (selectedObject as Desk).equipment" 
                  :key="equipment" 
                  class="equipment-tag"
                >
                  {{ formatEquipment(equipment) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Time Selection -->
      <div v-if="selectedObject" class="form-section">
        <label class="form-label">Select Date & Time</label>
        <TimeSlotPicker
          v-model="timeSlot"
          :on-conflict-check="checkForConflicts"
          :excluded-slots="excludedTimeSlots"
          @change="onTimeSlotChange"
        />
      </div>

      <!-- Additional Information -->
      <div v-if="selectedObject && timeSlot.date && timeSlot.startTime && timeSlot.endTime" class="form-section">
        <label class="form-label">Additional Information (Optional)</label>
        <textarea
          v-model="additionalNotes"
          placeholder="Any special requirements or notes..."
          class="notes-input"
          rows="3"
        ></textarea>
      </div>

      <!-- Conflicts Alert -->
      <ConflictAlert
        v-if="conflictError"
        :show="!!conflictError"
        title="Booking Conflict"
        :message="conflictError"
        severity="error"
        @dismiss="clearConflictError"
      />

      <!-- Form Actions -->
      <div v-if="selectedObject && timeSlot.date && timeSlot.startTime && timeSlot.endTime" class="form-actions">
        <button
          type="button"
          @click="handleReset"
          class="reset-btn"
          :disabled="isSubmitting"
        >
          Reset
        </button>
        <button
          type="submit"
          class="submit-btn"
          :disabled="isSubmitting || !!conflictError"
        >
          <span v-if="isSubmitting">Booking...</span>
          <span v-else>Confirm Reservation</span>
        </button>
      </div>

      <!-- Booking Summary -->
      <div v-if="selectedObject && timeSlot.date && timeSlot.startTime && timeSlot.endTime" class="booking-summary">
        <h3 class="summary-title">Booking Summary</h3>
        <div class="summary-content">
          <div class="summary-item">
            <span class="summary-label">Object:</span>
            <span class="summary-value">{{ selectedObject.name }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Date:</span>
            <span class="summary-value">{{ formatDate(timeSlot.date) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Time:</span>
            <span class="summary-value">{{ formatTimeRange(timeSlot.startTime, timeSlot.endTime) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Duration:</span>
            <span class="summary-value">{{ calculateDuration() }}</span>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import TimeSlotPicker from '../common/TimeSlotPicker.vue';
import ConflictAlert from '../common/ConflictAlert.vue';
import type { ParkingSpace, Desk } from '../../services/objects';
import type { CreateReservationRequest } from '../../services/reservations';
import { objectsService } from '../../services/objects';

interface Props {
  objectType?: 'parking' | 'desk';
  initialObject?: ParkingSpace | Desk | null;
  availableObjects?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  objectType: 'desk',
  initialObject: null,
  availableObjects: () => []
});

const emit = defineEmits<{
  'submit': [reservation: CreateReservationRequest];
  'cancel': [];
  'objectSelected': [object: ParkingSpace | Desk];
}>();

// Reactive data
const selectedObject = ref<ParkingSpace | Desk | null>(props.initialObject);
const timeSlot = ref({
  date: '',
  startTime: '',
  endTime: ''
});
const additionalNotes = ref('');
const conflictError = ref('');
const isSubmitting = ref(false);

// Computed properties
const objectTypeLabel = computed(() => {
  return props.objectType === 'parking' ? 'Parking Space' : 'Desk/Workspace';
});

const excludedTimeSlots = computed(() => {
  if (!selectedObject.value) return [];
  
  // This would typically come from the API or prop
  // For now, we'll return an empty array
  return [];
});

// Computed properties for template type handling
const getObjectId = (object: any) => object?.id || Math.random();
const isObjectSelected = (object: any) => selectedObject.value?.id === object?.id;
const isParkingObject = (object: any) => object?.type === 'parking';

// Methods
const selectObject = (object: any) => {
  const typedObject = object as ParkingSpace | Desk;
  selectedObject.value = typedObject;
  emit('objectSelected', typedObject);
  
  // Clear any existing time selection when object changes
  timeSlot.value = {
    date: '',
    startTime: '',
    endTime: ''
  };
};

const clearObjectSelection = () => {
  selectedObject.value = null;
  timeSlot.value = {
    date: '',
    startTime: '',
    endTime: ''
  };
  conflictError.value = '';
};

const onTimeSlotChange = (newTimeSlot: { date: string; startTime: string; endTime: string }) => {
  timeSlot.value = newTimeSlot;
};

const checkForConflicts = async (date: string, startTime: string, endTime: string): Promise<boolean> => {
  if (!selectedObject.value) return false;
  
  try {
    const result = await objectsService.checkConflicts({
      objectId: selectedObject.value.id,
      date,
      startTime,
      endTime
    });
    
    if (result.hasConflict) {
      conflictError.value = 'This time slot conflicts with an existing reservation.';
      return true;
    }
    
    conflictError.value = '';
    return false;
  } catch (error) {
    console.error('Error checking conflicts:', error);
    conflictError.value = 'Error checking availability. Please try again.';
    return false;
  }
};

const clearConflictError = () => {
  conflictError.value = '';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTimeRange = (startTime: string, endTime: string): string => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

const calculateDuration = (): string => {
  if (!timeSlot.value.startTime || !timeSlot.value.endTime) return '';
  
  const start = new Date(`1970-01-01T${timeSlot.value.startTime}:00`);
  const end = new Date(`1970-01-01T${timeSlot.value.endTime}:00`);
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  }
  
  const hours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'parking':
      return '🅿️';
    case 'desk':
      return '🪑';
    default:
      return '📍';
  }
};

const formatWorkspaceType = (workspaceType: string): string => {
  switch (workspaceType) {
    case 'hotdesk':
      return 'Hot Desk';
    case 'dedicated':
      return 'Dedicated Desk';
    case 'meeting_room':
      return 'Meeting Room';
    default:
      return workspaceType;
  }
};

const formatEquipment = (equipment: string): string => {
  const equipmentMap: Record<string, string> = {
    'monitor': '🖥️ Monitor',
    'ethernet': '🌐 Ethernet',
    'phone': '☎️ Phone',
    'keyboard': '⌨️ Keyboard',
    'mouse': '🖱️ Mouse',
    'projector': '📽️ Projector',
    'whiteboard': '📋 Whiteboard',
    'video_conference': '📹 Video Call',
    'dual_monitors': '🖥️ Dual Monitors',
    'headphone_jack': '🎧 Headphone Jack',
    'noise_cancelling': '🔇 Noise Cancelling',
    'wireless_charging': '⚡ Wireless Charging',
    'standing_desk': '↕️ Standing Desk',
    'premium_chair': '💺 Premium Chair',
    'ergonomic_chair': '🪑 Ergonomic Chair',
    'webcam': '📷 Webcam',
    'large_projector': '📽️ Large Projector',
    'sound_system': '🔊 Sound System',
    'executive_seating': '👔 Executive Seating',
    'tablet_stylus': '✏️ Tablet & Stylus',
    'arduino': '🔧 Arduino',
    'raspberry_pi': '🖥️ Raspberry Pi'
  };
  
  return equipmentMap[equipment] || equipment;
};

// Event handlers
const handleSubmit = async () => {
  if (!selectedObject.value || !timeSlot.value.date || !timeSlot.value.startTime || !timeSlot.value.endTime) {
    return;
  }
  
  if (conflictError.value) {
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    const reservation: CreateReservationRequest = {
      objectId: selectedObject.value.id,
      objectType: selectedObject.value.type,
      date: timeSlot.value.date,
      startTime: timeSlot.value.startTime,
      endTime: timeSlot.value.endTime
    };
    
    emit('submit', reservation);
  } catch (error) {
    console.error('Error submitting reservation:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleReset = () => {
  timeSlot.value = {
    date: '',
    startTime: '',
    endTime: ''
  };
  additionalNotes.value = '';
  conflictError.value = '';
};

// Watch for external initial object changes
watch(() => props.initialObject, (newObject) => {
  if (newObject) {
    selectedObject.value = newObject;
  }
});
</script>

<style scoped>
.reservation-form {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  overflow: hidden;
  max-width: 800px;
  margin: 0 auto;
}

.form-header {
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  text-align: center;
}

.form-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.object-title {
  margin: 0;
  font-size: 1rem;
  color: #666;
  font-weight: 500;
}

.form-content {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-label {
  display: block;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.object-selection {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.object-option {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.object-option:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.object-option.selected {
  border-color: #007bff;
  background: #f8f9ff;
}

.object-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.object-name {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.object-location {
  color: #666;
  font-size: 0.9rem;
}

.object-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.feature-badge {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.selected-object-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

.object-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.object-icon {
  font-size: 2rem;
}

.object-details {
  flex: 1;
}

.object-details .object-name {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #333;
}

.object-details .object-location {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.change-object-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #007bff;
  color: #007bff;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.change-object-btn:hover {
  background: #007bff;
  color: white;
}

.object-features-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feature-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.feature-value {
  color: #333;
  font-size: 0.9rem;
}

.feature-list,
.equipment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.equipment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.equipment-tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.notes-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.notes-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.reset-btn,
.submit-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.reset-btn:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.submit-btn {
  background: #007bff;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
  transform: none;
}

.booking-summary {
  background: #e8f4f8;
  border: 1px solid #bee5eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.summary-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0c5460;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-weight: 600;
  color: #0c5460;
  font-size: 0.9rem;
}

.summary-value {
  color: #333;
  font-size: 0.9rem;
  text-align: right;
}

@media (max-width: 768px) {
  .reservation-form {
    margin: 0.5rem;
  }
  
  .form-header {
    padding: 1rem;
  }
  
  .form-content {
    padding: 1rem;
  }
  
  .object-selection {
    grid-template-columns: 1fr;
  }
  
  .object-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .feature-item,
  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .feature-value,
  .summary-value {
    text-align: left;
  }
}
</style>