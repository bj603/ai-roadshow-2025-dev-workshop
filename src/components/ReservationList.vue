<template>
  <div class="reservation-list">
    <div class="header">
      <h3>{{ title }}</h3>
      <div class="filters">
        <button 
          v-for="filter in filters" 
          :key="filter.value"
          @click="activeFilter = filter.value"
          :class="{ active: activeFilter === filter.value }"
          class="filter-btn"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Loading reservations...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="loadReservations" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="filteredReservations.length === 0" class="empty">
      <p>No {{ activeFilter === 'all' ? '' : activeFilter }} reservations found.</p>
    </div>

    <div v-else class="reservations">
      <div 
        v-for="reservation in filteredReservations" 
        :key="reservation.id" 
        class="reservation-card"
        :class="{ 
          'status-active': reservation.status === 'active',
          'status-cancelled': reservation.status === 'cancelled',
          'status-completed': reservation.status === 'completed'
        }"
      >
        <div class="reservation-header">
          <div class="object-info">
            <h4>{{ getObjectInfo(reservation.objectId) }}</h4>
            <span class="object-type">{{ getObjectType(reservation.objectId) }}</span>
          </div>
          <div class="status-badge" :class="reservation.status">
            {{ reservation.status.toUpperCase() }}
          </div>
        </div>

        <div class="reservation-details">
          <div class="time-info">
            <div class="time-slot">
              <span class="label">Start:</span>
              <span class="value">{{ formatDateTime(reservation.startDateTime) }}</span>
            </div>
            <div class="time-slot">
              <span class="label">End:</span>
              <span class="value">{{ formatDateTime(reservation.endDateTime) }}</span>
            </div>
            <div class="duration">
              <span class="label">Duration:</span>
              <span class="value">{{ formatDuration(reservation.startDateTime, reservation.endDateTime) }}</span>
            </div>
          </div>

          <div class="meta-info">
            <div class="created">
              Created: {{ formatDateTime(reservation.createdAt) }}
            </div>
          </div>
        </div>

        <div v-if="reservation.status === 'active'" class="reservation-actions">
          <button 
            @click="cancelReservation(reservation.id)"
            :disabled="cancelling === reservation.id"
            class="cancel-btn"
          >
            {{ cancelling === reservation.id ? 'Cancelling...' : 'Cancel Reservation' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../services/api';
import type { Reservation, ReservableObject } from '../types/reservations';

interface Props {
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: 'My Reservations'
});

// Reactive state
const reservations = ref<Reservation[]>([]);
const objects = ref<ReservableObject[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const cancelling = ref<string | null>(null);
const activeFilter = ref<'all' | 'active' | 'upcoming' | 'completed' | 'cancelled'>('all');

// Filter options
const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const;

// Computed properties
const filteredReservations = computed(() => {
  if (activeFilter.value === 'all') {
    return reservations.value;
  }
  
  if (activeFilter.value === 'upcoming') {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return reservations.value.filter(r => {
      const startTime = new Date(r.startDateTime);
      return r.status === 'active' && startTime >= now && startTime <= next24Hours;
    });
  }
  
  return reservations.value.filter(r => r.status === activeFilter.value);
});

// Helper functions
const getObjectInfo = (objectId: string): string => {
  const object = objects.value.find(obj => obj.id === objectId);
  return object?.location || `Object ${objectId}`;
};

const getObjectType = (objectId: string): string => {
  const object = objects.value.find(obj => obj.id === objectId);
  return object?.type || 'unknown';
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (startDateTime: string, endDateTime: string): string => {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

// API functions
const loadReservations = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api.getReservations();
    reservations.value = response.data || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load reservations';
  } finally {
    loading.value = false;
  }
};

const loadObjects = async () => {
  try {
    const response = await api.getObjects();
    objects.value = response.data || [];
  } catch (err) {
    console.warn('Failed to load objects for display:', err);
  }
};

const cancelReservation = async (reservationId: string) => {
  cancelling.value = reservationId;
  
  try {
    await api.cancelReservation(reservationId);
    // Update the reservation status locally
    const reservation = reservations.value.find(r => r.id === reservationId);
    if (reservation) {
      reservation.status = 'cancelled';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to cancel reservation';
  } finally {
    cancelling.value = null;
  }
};

// Lifecycle
onMounted(() => {
  loadReservations();
  loadObjects();
});

// Expose methods for parent components
defineExpose({
  refresh: loadReservations
});
</script>

<style scoped>
.reservation-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.header h3 {
  margin: 0;
  color: #333;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f5f5f5;
}

.filter-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.error {
  color: #dc3545;
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

.reservations {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reservation-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s;
}

.reservation-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.reservation-card.status-active {
  border-left: 4px solid #28a745;
}

.reservation-card.status-cancelled {
  border-left: 4px solid #dc3545;
  opacity: 0.8;
}

.reservation-card.status-completed {
  border-left: 4px solid #6c757d;
  opacity: 0.8;
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.object-info h4 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 18px;
}

.object-type {
  background: #e9ecef;
  color: #495057;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 500;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.completed {
  background: #d1ecf1;
  color: #0c5460;
}

.reservation-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.time-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.time-slot, .duration {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
}

.value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.meta-info {
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.created {
  font-size: 12px;
  color: #6c757d;
}

.reservation-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #c82333;
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters {
    justify-content: center;
  }
  
  .time-info {
    grid-template-columns: 1fr;
  }
}
</style>