<template>
  <div class="object-card" :class="`object-${object.type}`">
    <div class="card-header">
      <div class="object-type-indicator">
        <span class="type-icon">{{ getTypeIcon(object.type) }}</span>
        <span class="type-badge" :class="`type-${object.type}`">
          {{ object.type === 'parking' ? 'Parking' : 'Desk' }}
        </span>
      </div>
      <div class="availability-status" :class="`status-${availabilityStatus}`">
        {{ availabilityText }}
      </div>
    </div>

    <div class="card-content">
      <h3 class="object-name">{{ object.name }}</h3>
      <p class="object-location">{{ object.location }}</p>

      <div class="object-details">
        <div class="detail-item">
          <span class="detail-label">Capacity:</span>
          <span class="detail-value">{{ object.capacity }} {{ object.capacity === 1 ? 'person' : 'people' }}</span>
        </div>

        <!-- Parking Space Specific Details -->
        <template v-if="object.type === 'parking'">
          <div class="detail-item">
            <span class="detail-label">Level:</span>
            <span class="detail-value">Floor {{ (object as ParkingSpace).level }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Spot:</span>
            <span class="detail-value">{{ (object as ParkingSpace).spotNumber }}</span>
          </div>
          <div class="feature-list">
            <span v-if="(object as ParkingSpace).isCovered" class="feature-badge covered">
              <span class="feature-icon">🏠</span> Covered
            </span>
            <span v-if="(object as ParkingSpace).isEVCharging" class="feature-badge ev-charging">
              <span class="feature-icon">⚡</span> EV Charging
            </span>
            <span v-if="(object as ParkingSpace).isAccessible" class="feature-badge accessible">
              <span class="feature-icon">♿</span> Accessible
            </span>
          </div>
        </template>

        <!-- Desk Specific Details -->
        <template v-else>
          <div class="detail-item">
            <span class="detail-label">Workspace:</span>
            <span class="detail-value">{{ formatWorkspaceType((object as Desk).workspaceType) }}</span>
          </div>
          <div class="detail-item" v-if="(object as Desk).hasWindow">
            <span class="detail-label">Features:</span>
            <span class="detail-value">🌅 Window view</span>
          </div>
          <div class="equipment-list" v-if="(object as Desk).equipment?.length">
            <span class="detail-label">Equipment:</span>
            <div class="equipment-tags">
              <span 
                v-for="equipment in (object as Desk).equipment.slice(0, 3)" 
                :key="equipment" 
                class="equipment-tag"
              >
                {{ formatEquipment(equipment) }}
              </span>
              <span v-if="(object as Desk).equipment.length > 3" class="equipment-more">
                +{{ (object as Desk).equipment.length - 3 }} more
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="card-actions">
      <button 
        v-if="showReservationButton" 
        @click="onReserve"
        class="reserve-btn"
        :disabled="!canReserve"
      >
        {{ canReserve ? 'Reserve Now' : 'Unavailable' }}
      </button>
      <button 
        v-if="showViewDetails" 
        @click="onViewDetails"
        class="view-details-btn"
      >
        View Details
      </button>
    </div>

    <div v-if="upcomingReservations && upcomingReservations.length > 0" class="reservation-status">
      <div class="status-header">
        <span class="status-label">Next Reservation:</span>
        <span class="status-time">{{ formatNextReservation() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ParkingSpace, Desk } from '../../services/objects';

interface Props {
  object: ParkingSpace | Desk;
  upcomingReservations?: Array<{
    startTime: string;
    endTime: string;
    status: string;
  }>;
  showReservationButton?: boolean;
  showViewDetails?: boolean;
  isAvailable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showReservationButton: true,
  showViewDetails: true,
  isAvailable: true
});

const emit = defineEmits<{
  'reserve': [object: ParkingSpace | Desk];
  'viewDetails': [object: ParkingSpace | Desk];
}>();

// Computed properties
const availabilityStatus = computed(() => {
  if (!props.isAvailable) return 'unavailable';
  if (props.upcomingReservations && props.upcomingReservations.length > 0) {
    const nextReservation = props.upcomingReservations.find(r => r.status === 'active');
    if (nextReservation) {
      const now = new Date();
      const startTime = new Date(nextReservation.startTime);
      const hoursUntilReservation = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilReservation < 2) {
        return 'soon-occupied';
      }
    }
  }
  return 'available';
});

const availabilityText = computed(() => {
  switch (availabilityStatus.value) {
    case 'available':
      return 'Available';
    case 'soon-occupied':
      return 'Occupied Soon';
    case 'unavailable':
      return 'Unavailable';
    default:
      return 'Available';
  }
});

const canReserve = computed(() => {
  return props.isAvailable && availabilityStatus.value === 'available';
});

// Methods
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

const formatNextReservation = (): string => {
  if (!props.upcomingReservations || props.upcomingReservations.length === 0) {
    return '';
  }
  
  const nextReservation = props.upcomingReservations.find(r => r.status === 'active');
  if (!nextReservation) return '';
  
  const startTime = new Date(nextReservation.startTime);
  const now = new Date();
  const isToday = startTime.toDateString() === now.toDateString();
  
  if (isToday) {
    const timeStr = startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `Today at ${timeStr}`;
  } else {
    const dateStr = startTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return dateStr;
  }
};

// Event handlers
const onReserve = () => {
  if (canReserve.value) {
    emit('reserve', props.object);
  }
};

const onViewDetails = () => {
  emit('viewDetails', props.object);
};
</script>

<style scoped>
.object-card {
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

.object-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  padding: 1rem 1.25rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f0f0f0;
}

.object-type-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.type-icon {
  font-size: 1.5rem;
}

.type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-parking {
  background: #e3f2fd;
  color: #1976d2;
}

.type-desk {
  background: #f3e5f5;
  color: #7b1fa2;
}

.availability-status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-available {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-soon-occupied {
  background: #fff3e0;
  color: #ef6c00;
}

.status-unavailable {
  background: #ffebee;
  color: #c62828;
}

.card-content {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.object-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.object-location {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.object-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #555;
  font-size: 0.85rem;
}

.detail-value {
  color: #333;
  font-size: 0.85rem;
  text-align: right;
}

.feature-list,
.equipment-list {
  margin-top: 0.5rem;
}

.feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.feature-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.feature-badge.covered {
  background: #e1f5fe;
  color: #0277bd;
}

.feature-badge.ev-charging {
  background: #f3e5f5;
  color: #7b1fa2;
}

.feature-badge.accessible {
  background: #e8f5e8;
  color: #2e7d32;
}

.equipment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.equipment-tag {
  background: #f0f0f0;
  color: #555;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.equipment-more {
  color: #999;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.card-actions {
  padding: 1rem 1.25rem;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 0.75rem;
}

.reserve-btn,
.view-details-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reserve-btn {
  background: #007bff;
  color: white;
}

.reserve-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.reserve-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
  transform: none;
}

.view-details-btn {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.view-details-btn:hover {
  background: #007bff;
  color: white;
}

.reservation-status {
  padding: 0.75rem 1.25rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.status-time {
  font-size: 0.8rem;
  color: #333;
  font-weight: 600;
}

@media (max-width: 768px) {
  .object-card {
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
    font-size: 1rem;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .detail-value {
    text-align: left;
  }
}
</style>