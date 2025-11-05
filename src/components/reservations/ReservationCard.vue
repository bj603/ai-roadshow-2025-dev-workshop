<template>
  <div class="reservation-card" :class="`reservation-${reservation.status}`">
    <div class="card-header">
      <div class="reservation-type">
        <span class="type-icon">{{ getTypeIcon(reservation.objectType) }}</span>
        <div class="type-info">
          <span class="type-label">{{ reservation.objectType === 'parking' ? 'Parking' : 'Desk' }} Reservation</span>
          <span class="object-name">{{ objectName || 'Loading...' }}</span>
        </div>
      </div>
      <div class="status-badge" :class="`status-${reservation.status}`">
        {{ formatStatus(reservation.status) }}
      </div>
    </div>

    <div class="card-content">
      <div class="reservation-details">
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <span class="detail-text">{{ formattedTime.date }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">🕐</span>
          <span class="detail-text">
            {{ formattedTime.startTime }} - {{ formattedTime.endTime }}
            <span class="duration">({{ formattedTime.duration }})</span>
          </span>
        </div>
        <div class="detail-row" v-if="reservation.objectType === 'parking'">
          <span class="detail-icon">📍</span>
          <span class="detail-text">{{ objectLocation || 'Location not available' }}</span>
        </div>
        <div class="detail-row" v-if="reservation.objectType === 'desk'">
          <span class="detail-icon">🏢</span>
          <span class="detail-text">{{ objectLocation || 'Location not available' }}</span>
        </div>
      </div>

      <div v-if="showObjectDetails" class="object-preview">
        <div class="preview-header">
          <span class="preview-label">Object Details</span>
        </div>
        <div class="preview-content">
          <!-- Parking Space Details -->
          <div v-if="reservation.objectType === 'parking' && parkingDetails">
            <div class="preview-item">
              <span class="preview-label">Level:</span>
              <span class="preview-value">Floor {{ parkingDetails.level }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Spot:</span>
              <span class="preview-value">{{ parkingDetails.spotNumber }}</span>
            </div>
            <div v-if="parkingDetails.isEVCharging" class="feature-tag">
              ⚡ EV Charging
            </div>
            <div v-if="parkingDetails.isCovered" class="feature-tag">
              🏠 Covered
            </div>
            <div v-if="parkingDetails.isAccessible" class="feature-tag">
              ♿ Accessible
            </div>
          </div>

          <!-- Desk Details -->
          <div v-if="reservation.objectType === 'desk' && deskDetails">
            <div class="preview-item">
              <span class="preview-label">Type:</span>
              <span class="preview-value">{{ formatWorkspaceType(deskDetails.workspaceType) }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Capacity:</span>
              <span class="preview-value">{{ deskDetails.capacity }} {{ deskDetails.capacity === 1 ? 'person' : 'people' }}</span>
            </div>
            <div v-if="deskDetails.equipment?.length" class="equipment-tags">
              <span 
                v-for="equipment in deskDetails.equipment.slice(0, 3)" 
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

    <div class="card-actions">
      <button 
        v-if="canCancel" 
        @click="onCancel"
        class="cancel-btn"
        :disabled="isCancelling"
      >
        <span v-if="isCancelling">Cancelling...</span>
        <span v-else>Cancel Reservation</span>
      </button>
      <button 
        v-if="canModify" 
        @click="onModify"
        class="modify-btn"
      >
        Modify
      </button>
      <button 
        v-if="showDetails" 
        @click="onViewDetails"
        class="details-btn"
      >
        View Details
      </button>
    </div>

    <div v-if="timeUntilReservation" class="reservation-timing">
      <div class="timing-info">
        <span class="timing-icon">{{ getTimingIcon() }}</span>
        <span class="timing-text">{{ timeUntilReservation }}</span>
      </div>
    </div>

    <div v-if="confirmationCode" class="confirmation-code">
      <span class="code-label">Confirmation:</span>
      <span class="code-value">{{ confirmationCode }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Reservation } from '../../services/reservations';
import type { ParkingSpace, Desk } from '../../services/objects';
import { reservationsService } from '../../services/reservations';

interface Props {
  reservation: Reservation;
  objectDetails?: ParkingSpace | Desk | null;
  showObjectDetails?: boolean;
  showDetails?: boolean;
  showActions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showObjectDetails: true,
  showDetails: true,
  showActions: true
});

const emit = defineEmits<{
  'cancel': [reservation: Reservation];
  'modify': [reservation: Reservation];
  'viewDetails': [reservation: Reservation, object: ParkingSpace | Desk | null | undefined];
}>();

const isCancelling = ref(false);

// Computed properties
const objectName = computed(() => props.objectDetails?.name || 'Loading...');
const objectLocation = computed(() => props.objectDetails?.location || 'Location not available');

const parkingDetails = computed(() => {
  return props.objectDetails && props.objectDetails.type === 'parking' 
    ? props.objectDetails as ParkingSpace 
    : null;
});

const deskDetails = computed(() => {
  return props.objectDetails && props.objectDetails.type === 'desk' 
    ? props.objectDetails as Desk 
    : null;
});

const formattedTime = computed(() => {
  return reservationsService.formatReservationTime(props.reservation);
});

const isUpcoming = computed(() => {
  return reservationsService.isUpcoming(props.reservation);
});

const isPast = computed(() => {
  return reservationsService.isPast(props.reservation);
});

const canCancel = computed(() => {
  return props.showActions && reservationsService.canBeCancelled(props.reservation);
});

const canModify = computed(() => {
  return props.showActions && 
         props.reservation.status === 'active' && 
         isUpcoming.value;
});

const timeUntilReservation = computed(() => {
  if (!isUpcoming.value) return '';
  
  const now = new Date();
  const startTime = new Date(props.reservation.startTime);
  const diffMs = startTime.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `Starts in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  } else if (diffHours > 0) {
    return `Starts in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `Starts in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  }
});

const confirmationCode = computed(() => {
  // Generate a simple confirmation code from reservation ID
  return props.reservation.id.split('-').pop()?.toUpperCase() || props.reservation.id.slice(-6).toUpperCase();
});

// Methods
const formatStatus = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
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

const getTimingIcon = (): string => {
  if (isPast.value) return '⏰';
  if (isUpcoming.value) {
    const now = new Date();
    const startTime = new Date(props.reservation.startTime);
    const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return '🚨';
    if (diffHours < 24) return '⏱️';
    return '📅';
  }
  return '⏰';
};

// Event handlers
const onCancel = async () => {
  if (isCancelling.value) return;
  
  isCancelling.value = true;
  try {
    emit('cancel', props.reservation);
  } finally {
    // Reset after a short delay to allow for state updates
    setTimeout(() => {
      isCancelling.value = false;
    }, 1000);
  }
};

const onModify = () => {
  emit('modify', props.reservation);
};

const onViewDetails = () => {
  emit('viewDetails', props.reservation, props.objectDetails);
};
</script>

<style scoped>
.reservation-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.reservation-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.reservation-active {
  border-left: 4px solid #28a745;
}

.reservation-cancelled {
  border-left: 4px solid #dc3545;
  opacity: 0.8;
}

.reservation-expired {
  border-left: 4px solid #6c757d;
  opacity: 0.7;
}

.card-header {
  padding: 1rem 1.25rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f0f0f0;
}

.reservation-type {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.type-icon {
  font-size: 1.5rem;
}

.type-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.type-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.object-name {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-cancelled {
  background: #f8d7da;
  color: #721c24;
}

.status-expired {
  background: #e2e3e5;
  color: #383d41;
}

.card-content {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reservation-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-icon {
  font-size: 1.1rem;
  width: 1.5rem;
  text-align: center;
}

.detail-text {
  color: #333;
  font-size: 0.95rem;
}

.duration {
  color: #666;
  font-size: 0.85rem;
  margin-left: 0.5rem;
  font-style: italic;
}

.object-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.preview-header {
  margin-bottom: 0.75rem;
}

.preview-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.preview-label {
  font-weight: 500;
  color: #6c757d;
}

.preview-value {
  color: #495057;
  font-weight: 500;
}

.feature-tag,
.equipment-tag {
  display: inline-block;
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 0.5rem;
  margin-bottom: 0.25rem;
}

.equipment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.card-actions {
  padding: 1rem 1.25rem;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 0.75rem;
}

.cancel-btn,
.modify-btn,
.details-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #dc3545;
  color: white;
}

.cancel-btn:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
}

.cancel-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
  transform: none;
}

.modify-btn {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.modify-btn:hover {
  background: #007bff;
  color: white;
}

.details-btn {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.details-btn:hover {
  background: #6c757d;
  color: white;
}

.reservation-timing {
  padding: 0.75rem 1.25rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.timing-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.timing-icon {
  font-size: 1rem;
}

.timing-text {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.confirmation-code {
  padding: 0.5rem 1.25rem;
  background: #e9ecef;
  border-top: 1px solid #dee2e6;
  text-align: center;
}

.code-label {
  font-size: 0.8rem;
  color: #6c757d;
  margin-right: 0.5rem;
}

.code-value {
  font-size: 0.8rem;
  color: #495057;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

@media (max-width: 768px) {
  .reservation-card {
    margin: 0.5rem;
  }
  
  .card-header {
    padding: 0.75rem 1rem 0.5rem;
  }
  
  .card-content {
    padding: 1rem;
  }
  
  .card-actions {
    padding: 0.75rem 1rem;
    flex-direction: column;
  }
  
  .object-name {
    font-size: 0.95rem;
  }
  
  .detail-row {
    gap: 0.5rem;
  }
  
  .detail-icon {
    font-size: 1rem;
  }
  
  .detail-text {
    font-size: 0.9rem;
  }
}
</style>