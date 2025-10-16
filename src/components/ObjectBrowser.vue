<template>
  <div class="object-browser">
    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filters-header">
        <h2>Browse Available Resources</h2>
      </div>
      
      <div class="filters">
        <div class="filter-group">
          <label for="object-type">Type:</label>
          <select id="object-type" v-model="selectedType" @change="loadObjectsByType">
            <option value="">All Types</option>
            <option value="DESK">Desks</option>
            <option value="PARKING_SPACE">Parking Spaces</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="search">Search:</label>
          <input 
            id="search" 
            type="text" 
            v-model="searchTerm" 
            placeholder="Search by name or location..."
          />
        </div>
      </div>
    </div>

    <!-- Objects Grid -->
    <div class="objects-section">
      <div v-if="isLoading" class="loading">
        Loading objects...
      </div>
      
      <div v-else-if="filteredObjects.length === 0" class="empty-state">
        <h3>No objects found</h3>
        <p>Try adjusting your filters or search terms.</p>
      </div>
      
      <div v-else class="objects-grid">
        <ObjectCard
          v-for="object in filteredObjects"
          :key="object.id"
          :object="object"
          :is-selected="selectedObject?.id === object.id"
          @select="handleSelectObject"
          @reserve="handleReserveObject"
        />
      </div>
    </div>

    <!-- Reservation Form Modal -->
    <div v-if="showReservationForm" class="modal-overlay" @click="closeReservationForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Reserve {{ selectedObject?.name }}</h3>
          <button @click="closeReservationForm" class="close-button">&times;</button>
        </div>
        
        <ReservationForm
          :object="selectedObject!"
          @reservation-created="handleReservationCreated"
          @cancel="closeReservationForm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useReservations } from '../composables/useReservations';
import { ReservableObject, ReservableObjectType, Reservation } from '../types/reservations';
import ObjectCard from './ObjectCard.vue';
import ReservationForm from './ReservationForm.vue';

// Emits
const emit = defineEmits<{
  objectSelected: [object: ReservableObject]
  reservationCreated: [reservation: Reservation]
}>();

// State
const selectedType = ref<string>('');
const searchTerm = ref<string>('');
const showReservationForm = ref(false);

// Composable
const {
  objects,
  selectedObject,
  isLoading,
  loadObjects,
  loadObjectsByType: loadObjectsByTypeAPI,
  selectObject,
  clearSelection
} = useReservations();

// Computed
const filteredObjects = computed(() => {
  let filtered = objects.value;

  // Filter by search term
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(obj => 
      obj.name.toLowerCase().includes(term) ||
      obj.location.toLowerCase().includes(term)
    );
  }

  return filtered;
});

// Methods
async function loadObjectsByType() {
  if (selectedType.value === '') {
    await loadObjects();
  } else {
    await loadObjectsByTypeAPI(selectedType.value as ReservableObjectType);
  }
}

function handleSelectObject(object: ReservableObject) {
  selectObject(object);
  emit('objectSelected', object);
}

function handleReserveObject(object: ReservableObject) {
  selectObject(object);
  showReservationForm.value = true;
}

function closeReservationForm() {
  showReservationForm.value = false;
  clearSelection();
}

function handleReservationCreated(reservation: Reservation) {
  showReservationForm.value = false;
  clearSelection();
  emit('reservationCreated', reservation);
}

// Lifecycle
onMounted(() => {
  loadObjects();
});
</script>

<style scoped>
.object-browser {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filters-section {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.filters-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.filter-group select,
.filter-group input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.objects-section {
  padding: 1.5rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.objects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #374151;
}

@media (max-width: 768px) {
  .filters {
    grid-template-columns: 1fr;
  }
  
  .objects-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    margin: 0;
    border-radius: 0;
    max-height: 100vh;
  }
}
</style>