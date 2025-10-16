<template>
  <div :class="['reservation-card', statusClass]">
    <div class="reservation-header">
      <div class="reservation-title">
        <h4>{{ reservation.objectId }}</h4>
        <span class="object-type-badge" :class="typeClass">
          {{ reservation.objectType === 'DESK' ? '🖥️ Desk' : '🚗 Parking' }}
        </span>
      </div>
      <div class="reservation-status">
        <span :class="['status-badge', statusClass]">
          {{ getStatusText(reservation.status) }}
        </span>
      </div>
    </div>

    <div class="reservation-details">
      <div class="time-info">
        <div class="time-item">
          <span class="time-label">Start:</span>
          <span class="time-value">{{ formatDateTime(reservation.startDateTime) }}</span>
        </div>
        <div class="time-item">
          <span class="time-label">End:</span>
          <span class="time-value">{{ formatDateTime(reservation.endDateTime) }}</span>
        </div>
        <div class="duration">
          <span class="duration-label">Duration:</span>
          <span class="duration-value">{{ calculateDuration(reservation.startDateTime, reservation.endDateTime) }}</span>
        </div>
      </div>

      <div v-if="reservation.notes" class="notes">
        <span class="notes-label">Notes:</span>
        <p class="notes-text">{{ reservation.notes }}</p>
      </div>

      <div class="reservation-meta">
        <span class="created-date">
          Created: {{ formatDate(reservation.createdAt) }}
        </span>
        <span v-if="isCurrentlyActive" class="active-indicator">
          🟢 Currently Active
        </span>
        <span v-else-if="isUpcoming" class="upcoming-indicator">
          ⏰ Upcoming
        </span>
      </div>
    </div>

    <div v-if="showActions && canCancel" class="reservation-actions">
      <button 
        @click="handleCancel"
        :disabled="isCancelling"
        class="btn-cancel"
      >
        {{ isCancelling ? 'Cancelling...' : 'Cancel Reservation' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Reservation, ReservationStatus, ReservableObjectType } from '../types/reservations';
import { 
  formatDateTime, 
  formatDate, 
  calculateDuration, 
  isCurrentlyActive as checkIsCurrentlyActive,
  isFuture 
} from '../utils/reservationUtils';

// Props
interface Props {
  reservation: Reservation;
  showActions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
});

// Emits
const emit = defineEmits<{
  cancel: [reservationId: string]
}>();

// State
const isCancelling = ref(false);

// Computed
const statusClass = computed(() => {
  switch (props.reservation.status) {
    case ReservationStatus.ACTIVE:
      return isCurrentlyActive.value ? 'status-current' : 
             isUpcoming.value ? 'status-upcoming' : 'status-past';
    case ReservationStatus.CANCELLED:
      return 'status-cancelled';
    case ReservationStatus.COMPLETED:
      return 'status-completed';
    default:
      return '';
  }
});

const typeClass = computed(() => ({
  'type-desk': props.reservation.objectType === ReservableObjectType.DESK,
  'type-parking': props.reservation.objectType === ReservableObjectType.PARKING_SPACE
}));

const isCurrentlyActive = computed(() => 
  checkIsCurrentlyActive(props.reservation.startDateTime, props.reservation.endDateTime)
);

const isUpcoming = computed(() => 
  isFuture(props.reservation.startDateTime)
);

const canCancel = computed(() => 
  props.reservation.status === ReservationStatus.ACTIVE && 
  isFuture(props.reservation.startDateTime)
);

// Methods
function getStatusText(status: ReservationStatus): string {
  switch (status) {
    case ReservationStatus.ACTIVE:
      if (isCurrentlyActive.value) return 'Active Now';
      if (isUpcoming.value) return 'Confirmed';
      return 'Past';
    case ReservationStatus.CANCELLED:
      return 'Cancelled';
    case ReservationStatus.COMPLETED:
      return 'Completed';
    default:
      return status;
  }
}

async function handleCancel() {
  if (!canCancel.value) return;
  
  isCancelling.value = true;
  try {
    emit('cancel', props.reservation.id);
  } finally {
    isCancelling.value = false;
  }
}
</script>

<style scoped>
.reservation-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border-left: 4px solid #e2e8f0;
  transition: all 0.2s;
}

.reservation-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.reservation-card.status-current {
  border-left-color: #10b981;
  background-color: #f0fdf4;
}

.reservation-card.status-upcoming {
  border-left-color: #3b82f6;
  background-color: #eff6ff;
}

.reservation-card.status-past {
  border-left-color: #6b7280;
  background-color: #f9fafb;
}

.reservation-card.status-cancelled {
  border-left-color: #ef4444;
  background-color: #fef2f2;
}

.reservation-card.status-completed {
  border-left-color: #8b5cf6;
  background-color: #faf5ff;
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.reservation-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.reservation-title h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.object-type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
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

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.status-current {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.status-upcoming {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-badge.status-past {
  background-color: #f3f4f6;
  color: #374151;
}

.status-badge.status-cancelled {
  background-color: #fee2e2;
  color: #dc2626;
}

.status-badge.status-completed {
  background-color: #f3e8ff;
  color: #7c3aed;
}

.reservation-details {
  space-y: 1rem;
}

.time-info {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.time-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.time-item:last-child {
  margin-bottom: 0;
}

.time-label,
.duration-label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.875rem;
}

.time-value,
.duration-value {
  color: #1e293b;
  font-size: 0.875rem;
}

.duration {
  display: flex;
  justify-content: space-between;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
  margin-top: 0.5rem;
}

.notes {
  margin-top: 1rem;
}

.notes-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.notes-text {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0.25rem 0 0 0;
  line-height: 1.5;
}

.reservation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.75rem;
  color: #64748b;
}

.active-indicator {
  color: #059669;
  font-weight: 500;
}

.upcoming-indicator {
  color: #2563eb;
  font-weight: 500;
}

.reservation-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .reservation-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .reservation-meta {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .time-item {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>