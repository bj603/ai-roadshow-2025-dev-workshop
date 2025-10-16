<template>
  <div :class="['object-card', { selected: isSelected }]" @click="$emit('select', object)">
    <div class="card-header">
      <div class="object-type-badge" :class="typeClass">
        {{ object.type === 'DESK' ? '🖥️' : '🚗' }}
        {{ object.type === 'DESK' ? 'Desk' : 'Parking' }}
      </div>
      <div class="object-status">
        <span class="status-dot active"></span>
        Available
      </div>
    </div>

    <div class="card-content">
      <h3 class="object-name">{{ object.name }}</h3>
      <p class="object-location">📍 {{ object.location }}</p>

      <!-- Desk-specific details -->
      <div v-if="isDeskObject" class="object-details">
        <div class="detail-item">
          <span class="detail-label">Equipment:</span>
          <span class="detail-value">{{ deskObject.equipment.join(', ') }}</span>
        </div>
        <div class="detail-features">
          <span v-if="deskObject.hasMonitor" class="feature-tag">📺 Monitor</span>
          <span v-if="deskObject.hasPhone" class="feature-tag">📞 Phone</span>
        </div>
      </div>

      <!-- Parking-specific details -->
      <div v-if="isParkingObject" class="object-details">
        <div class="detail-item">
          <span class="detail-label">Level:</span>
          <span class="detail-value">{{ parkingObject.level }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Space:</span>
          <span class="detail-value">#{{ parkingObject.spaceNumber }}</span>
        </div>
        <div class="detail-features">
          <span v-if="parkingObject.isHandicapAccessible" class="feature-tag">♿ Accessible</span>
          <span v-if="parkingObject.isElectricVehicleCharging" class="feature-tag">🔌 EV Charging</span>
        </div>
      </div>
    </div>

    <div class="card-actions">
      <button 
        @click.stop="$emit('reserve', object)" 
        class="btn-primary"
      >
        Reserve Now
      </button>
      <button 
        @click.stop="checkAvailability" 
        class="btn-secondary"
        :disabled="isCheckingAvailability"
      >
        {{ isCheckingAvailability ? 'Checking...' : 'Check Availability' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ReservableObject, ReservableObjectType, Desk, ParkingSpace } from '../types/reservations';

// Props
interface Props {
  object: ReservableObject;
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
});

// Emits
defineEmits<{
  select: [object: ReservableObject]
  reserve: [object: ReservableObject]
}>();

// State
const isCheckingAvailability = ref(false);

// Computed
const isDeskObject = computed(() => props.object.type === ReservableObjectType.DESK);
const isParkingObject = computed(() => props.object.type === ReservableObjectType.PARKING_SPACE);

const deskObject = computed(() => props.object as Desk);
const parkingObject = computed(() => props.object as ParkingSpace);

const typeClass = computed(() => ({
  'type-desk': isDeskObject.value,
  'type-parking': isParkingObject.value
}));

// Methods
async function checkAvailability() {
  isCheckingAvailability.value = true;
  
  try {
    // Here you would typically call the availability API
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    // For now, just show an alert
    alert(`Availability check for ${props.object.name} would go here`);
  } catch (error) {
    console.error('Error checking availability:', error);
  } finally {
    isCheckingAvailability.value = false;
  }
}
</script>

<style scoped>
.object-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.object-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.object-card.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.object-type-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.object-type-badge.type-desk {
  background-color: #dbeafe;
  color: #1e40af;
}

.object-type-badge.type-parking {
  background-color: #d1fae5;
  color: #065f46;
}

.object-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #059669;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.status-dot.active {
  background-color: #10b981;
}

.card-content {
  margin-bottom: 1.5rem;
}

.object-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.object-location {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.object-details {
  space-y: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.detail-label {
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  color: #374151;
}

.detail-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.feature-tag {
  background-color: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  flex: 1;
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  flex: 1;
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.75rem;
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
  .card-actions {
    flex-direction: column;
  }
  
  .detail-item {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>