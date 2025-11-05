<template>
  <div class="objects-view">
    <div class="view-header">
      <h1 class="page-title">Available Spaces</h1>
      <p class="page-subtitle">Browse and reserve parking spaces and work areas</p>
    </div>

    <div class="view-content">
      <div class="content-layout">
        <!-- Filters Sidebar -->
        <div class="filters-sidebar">
          <ObjectFilters
            v-model="filters"
            :available-locations="availableLocations"
            :results-count="filteredObjects.length"
            @change="onFiltersChange"
          />
        </div>

        <!-- Objects Grid -->
        <div class="objects-main">
          <div class="main-header">
            <div class="view-controls">
              <div class="type-tabs">
                <button
                  @click="selectedType = ''"
                  class="type-tab"
                  :class="{ active: selectedType === '' }"
                >
                  All Types
                </button>
                <button
                  @click="selectedType = 'parking'"
                  class="type-tab"
                  :class="{ active: selectedType === 'parking' }"
                >
                  🅿️ Parking
                </button>
                <button
                  @click="selectedType = 'desk'"
                  class="type-tab"
                  :class="{ active: selectedType === 'desk' }"
                >
                  🪑 Desks
                </button>
              </div>
            </div>
            
            <div class="view-options">
              <div class="view-mode-toggle">
                <button
                  @click="viewMode = 'grid'"
                  class="view-mode-btn"
                  :class="{ active: viewMode === 'grid' }"
                >
                  ⊞ Grid
                </button>
                <button
                  @click="viewMode = 'list'"
                  class="view-mode-btn"
                  :class="{ active: viewMode === 'list' }"
                >
                  ☰ List
                </button>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading available spaces...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <p class="error-message">{{ error }}</p>
            <button @click="loadObjects" class="retry-btn">Try Again</button>
          </div>

          <!-- No Results -->
          <div v-else-if="filteredObjects.length === 0" class="no-results">
            <div class="no-results-icon">🔍</div>
            <h3 class="no-results-title">No spaces found</h3>
            <p class="no-results-message">
              Try adjusting your filters or search criteria to find available spaces.
            </p>
          </div>

          <!-- Objects Grid/List -->
          <div v-else>
            <div v-if="viewMode === 'grid'" class="objects-grid">
              <ObjectCard
                v-for="object in paginatedObjects"
                :key="object.id"
                :object="object"
                :upcoming-reservations="getUpcomingReservations(object.id)"
                :show-reservation-button="true"
                @reserve="handleReserve"
                @view-details="handleViewDetails"
              />
            </div>

            <div v-else class="objects-list">
              <div
                v-for="object in paginatedObjects"
                :key="object.id"
                class="list-item"
              >
                <ObjectCard
                  :object="object"
                  :upcoming-reservations="getUpcomingReservations(object.id)"
                  :show-reservation-button="true"
                  @reserve="handleReserve"
                  @view-details="handleViewDetails"
                />
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="pagination">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                Previous
              </button>
              <span class="pagination-info">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reservation Modal -->
    <div v-if="showReservationModal" class="modal-overlay" @click="closeReservationModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Make a Reservation</h2>
          <button @click="closeReservationModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <ReservationForm
            :initial-object="selectedObject"
            :object-type="selectedObject?.type"
            @submit="handleReservationSubmit"
            @cancel="closeReservationModal"
          />
        </div>
      </div>
    </div>

    <!-- Object Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ selectedObject?.name }}</h2>
          <button @click="closeDetailsModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedObject" class="object-details">
            <div class="details-section">
              <h3>Location Details</h3>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">{{ selectedObject.location }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Capacity:</span>
                  <span class="detail-value">{{ selectedObject.capacity }} {{ selectedObject.capacity === 1 ? 'person' : 'people' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value" :class="{ 'text-success': selectedObject.isActive, 'text-muted': !selectedObject.isActive }">
                    {{ selectedObject.isActive ? 'Available' : 'Unavailable' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Parking Space Details -->
            <div v-if="selectedObject.type === 'parking'" class="details-section">
              <h3>Parking Features</h3>
              <div class="features-grid">
                <div class="feature-item">
                  <span class="feature-label">Level:</span>
                  <span class="feature-value">Floor {{ (selectedObject as ParkingSpace).level }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Spot Number:</span>
                  <span class="feature-value">{{ (selectedObject as ParkingSpace).spotNumber }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Covered:</span>
                  <span class="feature-value">{{ (selectedObject as ParkingSpace).isCovered ? 'Yes' : 'No' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">EV Charging:</span>
                  <span class="feature-value">{{ (selectedObject as ParkingSpace).isEVCharging ? 'Available' : 'Not Available' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Accessible:</span>
                  <span class="feature-value">{{ (selectedObject as ParkingSpace).isAccessible ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </div>

            <!-- Desk Details -->
            <div v-else class="details-section">
              <h3>Workspace Details</h3>
              <div class="features-grid">
                <div class="feature-item">
                  <span class="feature-label">Type:</span>
                  <span class="feature-value">{{ formatWorkspaceType((selectedObject as Desk).workspaceType) }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Max Occupants:</span>
                  <span class="feature-value">{{ (selectedObject as Desk).maxOccupants || selectedObject.capacity }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Window View:</span>
                  <span class="feature-value">{{ (selectedObject as Desk).hasWindow ? 'Yes' : 'No' }}</span>
                </div>
                <div v-if="(selectedObject as Desk).equipment?.length" class="feature-item full-width">
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

            <div class="modal-actions">
              <button @click="closeDetailsModal" class="modal-btn secondary">Close</button>
              <button 
                v-if="selectedObject.isActive" 
                @click="reserveFromDetails"
                class="modal-btn primary"
              >
                Reserve This Space
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import ObjectCard from '../components/objects/ObjectCard.vue';
import ObjectFilters from '../components/objects/ObjectFilters.vue';
import ReservationForm from '../components/reservations/ReservationForm.vue';
import type { ParkingSpace, Desk, ObjectFilters as IObjectFilters } from '../services/objects';
import type { CreateReservationRequest } from '../services/reservations';
import { objectsService } from '../services/objects';
import { reservationsService } from '../services/reservations';

interface Props {
  initialType?: 'parking' | 'desk';
}

const props = withDefaults(defineProps<Props>(), {
  initialType: undefined
});

const emit = defineEmits<{
  'reservationCreated': [reservation: CreateReservationRequest];
}>();

// Reactive data
const objects = ref<(ParkingSpace | Desk)[]>([]);
const reservations = ref<any[]>([]);
const filters = ref<IObjectFilters>({});
const selectedType = ref<string>(props.initialType || '');
const viewMode = ref<'grid' | 'list'>('grid');
const currentPage = ref(1);
const itemsPerPage = ref(12);

const selectedObject = ref<ParkingSpace | Desk | null>(null);
const showReservationModal = ref(false);
const showDetailsModal = ref(false);

const isLoading = ref(false);
const error = ref('');

// Computed properties
const availableLocations = computed(() => {
  const locations = new Set(objects.value.map(obj => obj.location));
  return Array.from(locations).sort();
});

const filteredObjects = computed(() => {
  let filtered = [...objects.value];
  
  // Type filter
  if (selectedType.value) {
    filtered = filtered.filter(obj => obj.type === selectedType.value);
  }
  
  // Apply additional filters
  Object.entries(filters.value).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      filtered = filtered.filter(obj => {
        switch (key) {
          case 'type':
            return obj.type === value;
          case 'location':
            return obj.location.includes(value as string);
          case 'isActive':
            return obj.isActive === value;
          case 'level':
            return obj.type === 'parking' && (obj as ParkingSpace).level === value;
          case 'workspaceType':
            return obj.type === 'desk' && (obj as Desk).workspaceType === value;
          case 'hasEVCharging':
            return obj.type === 'parking' && (obj as ParkingSpace).isEVCharging === value;
          case 'hasWindow':
            return obj.type === 'desk' && (obj as Desk).hasWindow === value;
          case 'isCovered':
            return obj.type === 'parking' && (obj as ParkingSpace).isCovered === value;
          case 'isAccessible':
            return obj.type === 'parking' && (obj as ParkingSpace).isAccessible === value;
          default:
            return true;
        }
      });
    }
  });
  
  return filtered;
});

const paginatedObjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredObjects.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredObjects.value.length / itemsPerPage.value);
});

// Methods
const loadObjects = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    const userFilters: IObjectFilters = {};
    if (selectedType.value) {
      userFilters.type = selectedType.value as 'parking' | 'desk';
    }
    
    objects.value = await objectsService.getObjects(userFilters);
  } catch (err) {
    console.error('Error loading objects:', err);
    error.value = 'Failed to load available spaces. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const loadReservations = async () => {
  try {
    reservations.value = await reservationsService.getUserReservations();
  } catch (err) {
    console.error('Error loading reservations:', err);
  }
};

const getUpcomingReservations = (objectId: string) => {
  return reservations.value.filter(res => 
    res.objectId === objectId && 
    res.status === 'active' &&
    new Date(res.startTime) > new Date()
  );
};

const onFiltersChange = (newFilters: IObjectFilters) => {
  filters.value = newFilters;
  currentPage.value = 1;
};

const handleReserve = (object: ParkingSpace | Desk) => {
  selectedObject.value = object;
  showReservationModal.value = true;
};

const handleViewDetails = (object: ParkingSpace | Desk) => {
  selectedObject.value = object;
  showDetailsModal.value = true;
};

const closeReservationModal = () => {
  showReservationModal.value = false;
  selectedObject.value = null;
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedObject.value = null;
};

const reserveFromDetails = () => {
  closeDetailsModal();
  handleReserve(selectedObject.value!);
};

const handleReservationSubmit = async (reservation: CreateReservationRequest) => {
  try {
    await reservationsService.createReservation(reservation);
    closeReservationModal();
    
    // Refresh reservations to show the new one
    await loadReservations();
    
    // Emit success event
    emit('reservationCreated', reservation);
    
    // Show success message (you could add a toast notification here)
    console.log('Reservation created successfully!');
  } catch (err) {
    console.error('Error creating reservation:', err);
    // Show error message
    error.value = 'Failed to create reservation. Please try again.';
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

// Watch for type changes
watch(selectedType, () => {
  loadObjects();
});

// Initialize
onMounted(async () => {
  await Promise.all([
    loadObjects(),
    loadReservations()
  ]);
});
</script>

<style scoped>
.objects-view {
  min-height: 100vh;
  background: #f8f9fa;
}

.view-header {
  background: white;
  padding: 2rem;
  border-bottom: 1px solid #e9ecef;
  text-align: center;
}

.page-title {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
}

.page-subtitle {
  margin: 0;
  font-size: 1.1rem;
  color: #666;
}

.view-content {
  padding: 2rem;
}

.content-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.filters-sidebar {
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.objects-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.type-tabs {
  display: flex;
  gap: 0.5rem;
}

.type-tab {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.type-tab:hover {
  border-color: #007bff;
  color: #007bff;
}

.type-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.view-mode-toggle {
  display: flex;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.25rem;
}

.view-mode-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.view-mode-btn.active {
  background: white;
  color: #007bff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-state,
.error-state,
.no-results {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #dc3545;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #0056b3;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.no-results-title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.no-results-message {
  margin: 0;
  color: #666;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

.objects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.objects-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-item {
  width: 100%;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #666;
  font-weight: 500;
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

.modal-content.large {
  max-width: 1000px;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close:hover {
  background: #f8f9fa;
}

.modal-body {
  padding: 0;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

.object-details {
  padding: 1.5rem;
}

.details-section {
  margin-bottom: 2rem;
}

.details-section:last-child {
  margin-bottom: 0;
}

.details-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.details-grid,
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.feature-item.full-width {
  grid-column: 1 / -1;
}

.detail-item,
.feature-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label,
.feature-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.detail-value,
.feature-value {
  color: #333;
  font-weight: 500;
}

.text-success {
  color: #28a745 !important;
}

.text-muted {
  color: #6c757d !important;
}

.equipment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.equipment-tag {
  background: #f8f9fa;
  color: #495057;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #e9ecef;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.modal-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.primary {
  background: #007bff;
  color: white;
}

.modal-btn.primary:hover {
  background: #0056b3;
}

.modal-btn.secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.modal-btn.secondary:hover {
  background: #6c757d;
  color: white;
}

@media (max-width: 1024px) {
  .content-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .filters-sidebar {
    position: static;
    order: 2;
  }
  
  .objects-main {
    order: 1;
  }
  
  .main-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .type-tabs {
    justify-content: center;
  }
  
  .objects-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .view-header {
    padding: 1.5rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .view-content {
    padding: 1rem;
  }
  
  .main-header {
    padding: 1rem;
  }
  
  .type-tabs {
    flex-wrap: wrap;
  }
  
  .objects-grid {
    grid-template-columns: 1fr;
  }
  
  .details-grid,
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content,
  .modal-content.large {
    margin: 0.5rem;
    max-width: none;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .object-details {
    padding: 1rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>