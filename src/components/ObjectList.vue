<template>
  <div class="object-list">
    <div class="header">
      <h3>{{ title }}</h3>
      <div class="controls">
        <div class="filters">
          <button 
            v-for="filter in typeFilters" 
            :key="filter.value"
            @click="activeTypeFilter = filter.value"
            :class="{ active: activeTypeFilter === filter.value }"
            class="filter-btn"
          >
            {{ filter.label }}
          </button>
        </div>
        <button @click="refreshObjects" class="refresh-btn" :disabled="loading">
          🔄 Refresh
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Loading objects...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="loadObjects" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="filteredObjects.length === 0" class="empty">
      <p>No {{ activeTypeFilter === 'all' ? '' : activeTypeFilter }} objects found.</p>
    </div>

    <div v-else>
      <!-- Summary Stats -->
      <div class="stats">
        <div class="stat-card">
          <span class="stat-number">{{ filteredObjects.length }}</span>
          <span class="stat-label">Total Objects</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ availableCount }}</span>
          <span class="stat-label">Available</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ deskCount }}</span>
          <span class="stat-label">Desks</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ parkingCount }}</span>
          <span class="stat-label">Parking</span>
        </div>
      </div>

      <!-- Objects Grid -->
      <div class="objects-grid">
        <div 
          v-for="object in filteredObjects" 
          :key="object.id"
          class="object-card"
          :class="{
            'available': object.isAvailable,
            'unavailable': !object.isAvailable,
            'type-desk': object.type === 'desk',
            'type-parking': object.type === 'parking'
          }"
        >
          <div class="object-header">
            <div class="object-icon">
              {{ getObjectIcon(object.type) }}
            </div>
            <div class="object-id">{{ object.id }}</div>
            <div class="availability-badge" :class="{ available: object.isAvailable }">
              {{ object.isAvailable ? 'Available' : 'Occupied' }}
            </div>
          </div>

          <div class="object-details">
            <div class="location">
              <span class="label">📍</span>
              <span class="value">{{ object.location }}</span>
            </div>

            <div class="object-type">
              <span class="type-badge" :class="object.type">
                {{ object.type.toUpperCase() }}
              </span>
            </div>

            <div v-if="object.metadata && Object.keys(object.metadata).length > 0" class="metadata">
              <div class="metadata-title">Features:</div>
              <div class="features">
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

          <div class="object-actions">
            <button 
              @click="viewReservations(object.id)"
              class="action-btn secondary"
              :disabled="loadingReservations === object.id"
            >
              {{ loadingReservations === object.id ? 'Loading...' : 'View Schedule' }}
            </button>
            
            <button 
              v-if="object.isAvailable"
              @click="$emit('reserve-object', object.id)"
              class="action-btn primary"
            >
              Reserve Now
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reservations Modal -->
    <div v-if="showReservationsModal" class="modal-overlay" @click="closeReservationsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>Reservations for {{ selectedObjectId }}</h4>
          <button @click="closeReservationsModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div v-if="loadingObjectReservations" class="loading">
            Loading reservations...
          </div>
          
          <div v-else-if="objectReservationsError" class="error">
            {{ objectReservationsError }}
          </div>
          
          <div v-else-if="objectReservations.length === 0" class="empty">
            No reservations found for this object.
          </div>
          
          <div v-else class="reservations-list">
            <div 
              v-for="reservation in sortedObjectReservations" 
              :key="reservation.id"
              class="reservation-item"
              :class="reservation.status"
            >
              <div class="reservation-time">
                <div class="start-time">{{ formatDateTime(reservation.startDateTime) }}</div>
                <div class="end-time">{{ formatDateTime(reservation.endDateTime) }}</div>
              </div>
              <div class="reservation-status">
                <span class="status-badge" :class="reservation.status">
                  {{ reservation.status.toUpperCase() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../services/api';
import type { ReservableObject, Reservation } from '../types/reservations';

interface Props {
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: 'Available Objects'
});

// Emit events
defineEmits<{
  'reserve-object': [objectId: string];
}>();

// Component refs and reactive state
const objects = ref<ReservableObject[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const activeTypeFilter = ref<'all' | 'desk' | 'parking'>('all');
const loadingReservations = ref<string | null>(null);

// Modal state
const showReservationsModal = ref(false);
const selectedObjectId = ref<string | null>(null);
const objectReservations = ref<Reservation[]>([]);
const loadingObjectReservations = ref(false);
const objectReservationsError = ref<string | null>(null);

// Filter options
const typeFilters = [
  { value: 'all', label: 'All Objects' },
  { value: 'desk', label: 'Desks' },
  { value: 'parking', label: 'Parking' }
] as const;

// Computed properties
const filteredObjects = computed(() => {
  if (activeTypeFilter.value === 'all') {
    return objects.value;
  }
  return objects.value.filter(obj => obj.type === activeTypeFilter.value);
});

const availableCount = computed(() => {
  return filteredObjects.value.filter(obj => obj.isAvailable).length;
});

const deskCount = computed(() => {
  return filteredObjects.value.filter(obj => obj.type === 'desk').length;
});

const parkingCount = computed(() => {
  return filteredObjects.value.filter(obj => obj.type === 'parking').length;
});

const sortedObjectReservations = computed(() => {
  return [...objectReservations.value].sort((a, b) => {
    return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
  });
});

// Helper functions
const getObjectIcon = (type: string): string => {
  return type === 'desk' ? '🖥️' : '🚗';
};

const getObjectFeatures = (metadata: Record<string, any>): string[] => {
  const features: string[] = [];
  
  if (metadata.hasMonitor) features.push('Monitor Available');
  if (metadata.isHandicapAccessible) features.push('Handicap Accessible');
  if (metadata.floor) features.push(`Floor ${metadata.floor}`);
  if (metadata.zone) features.push(`Zone ${metadata.zone}`);
  if (metadata.level) features.push(`Level ${metadata.level}`);
  
  // Add any other metadata as features
  Object.entries(metadata).forEach(([key, value]) => {
    if (!['hasMonitor', 'isHandicapAccessible', 'floor', 'zone', 'level'].includes(key)) {
      if (typeof value === 'boolean' && value) {
        features.push(key.replace(/([A-Z])/g, ' $1').trim());
      } else if (typeof value === 'string' || typeof value === 'number') {
        features.push(`${key}: ${value}`);
      }
    }
  });
  
  return features;
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// API functions
const loadObjects = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api.getObjects();
    objects.value = response.data || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load objects';
  } finally {
    loading.value = false;
  }
};

const refreshObjects = async () => {
  await loadObjects();
};

const viewReservations = async (objectId: string) => {
  selectedObjectId.value = objectId;
  showReservationsModal.value = true;
  loadingObjectReservations.value = true;
  objectReservationsError.value = null;
  
  try {
    const response = await api.getObjectReservations(objectId);
    objectReservations.value = response.data || [];
  } catch (err) {
    objectReservationsError.value = err instanceof Error ? err.message : 'Failed to load reservations';
  } finally {
    loadingObjectReservations.value = false;
  }
};

const closeReservationsModal = () => {
  showReservationsModal.value = false;
  selectedObjectId.value = null;
  objectReservations.value = [];
  objectReservationsError.value = null;
};

// Lifecycle
onMounted(() => {
  loadObjects();
});

// Expose methods for parent components
defineExpose({
  refresh: loadObjects
});
</script>

<style scoped>
.object-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.header h3 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
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

.refresh-btn {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #218838;
}

.refresh-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
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

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  font-weight: 500;
}

.objects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.object-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.object-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.object-card.available {
  border-left: 4px solid #28a745;
}

.object-card.unavailable {
  border-left: 4px solid #dc3545;
  opacity: 0.8;
}

.object-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.object-icon {
  font-size: 24px;
}

.object-id {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  flex: 1;
  min-width: 0;
}

.availability-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: #f8d7da;
  color: #721c24;
}

.availability-badge.available {
  background: #d4edda;
  color: #155724;
}

.object-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.location {
  display: flex;
  align-items: center;
  gap: 8px;
}

.location .label {
  font-size: 14px;
}

.location .value {
  color: #666;
  font-size: 14px;
}

.object-type {
  display: flex;
  align-items: center;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge.desk {
  background: #e3f2fd;
  color: #1565c0;
}

.type-badge.parking {
  background: #f3e5f5;
  color: #7b1fa2;
}

.metadata {
  border-top: 1px solid #eee;
  padding-top: 12px;
}

.metadata-title {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-tag {
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.object-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 100px;
}

.action-btn.primary {
  background: #007bff;
  color: white;
}

.action-btn.primary:hover {
  background: #0056b3;
}

.action-btn.secondary {
  background: #6c757d;
  color: white;
}

.action-btn.secondary:hover:not(:disabled) {
  background: #545b62;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h4 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 20px;
}

.reservations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reservation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.reservation-item.active {
  border-left: 4px solid #28a745;
}

.reservation-item.cancelled {
  border-left: 4px solid #dc3545;
  opacity: 0.7;
}

.reservation-item.completed {
  border-left: 4px solid #6c757d;
  opacity: 0.7;
}

.reservation-time {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.start-time, .end-time {
  font-size: 14px;
  color: #333;
}

.end-time {
  color: #666;
  font-size: 12px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
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

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls {
    justify-content: center;
  }
  
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .objects-grid {
    grid-template-columns: 1fr;
  }
  
  .object-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-btn {
    min-width: 80px;
  }
}
</style>