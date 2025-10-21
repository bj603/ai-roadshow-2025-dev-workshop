<template>
  <div class="reservation-management">
    <h2>My Reservations</h2>
    
    <!-- Loading state -->
    <div v-if="loading" class="loading">Loading reservations...</div>
    
    <!-- Error state -->
    <div v-if="error" class="error">{{ error }}</div>
    
    <!-- Reservations list -->
    <div v-if="!loading && !error" class="reservations-container">
      <!-- Create new reservation section -->
      <div class="create-section">
        <h3>Make a Reservation</h3>
        <form @submit.prevent="createReservation" class="reservation-form">
          <div class="form-group">
            <label for="objectSelect">Select Object:</label>
            <select id="objectSelect" v-model="newReservation.objectId" required>
              <option value="">Choose a desk or parking space...</option>
              <option v-for="obj in objects" :key="obj.id" :value="obj.id">
                {{ obj.name }} - {{ obj.location }} ({{ obj.type }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="startDateTime">Start Date & Time:</label>
            <input 
              id="startDateTime" 
              type="datetime-local" 
              v-model="newReservation.startDateTime" 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="endDateTime">End Date & Time:</label>
            <input 
              id="endDateTime" 
              type="datetime-local" 
              v-model="newReservation.endDateTime" 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="notes">Notes (optional):</label>
            <textarea id="notes" v-model="newReservation.notes" rows="3"></textarea>
          </div>
          
          <button type="submit" :disabled="creating" class="btn-primary">
            {{ creating ? 'Creating...' : 'Create Reservation' }}
          </button>
        </form>
      </div>
      
      <!-- Existing reservations -->
      <div class="reservations-list">
        <h3>Current Reservations ({{ reservations.length }})</h3>
        
        <div v-if="reservations.length === 0" class="no-reservations">
          No active reservations found.
        </div>
        
        <div v-for="reservation in reservations" :key="reservation.id" class="reservation-card">
          <div class="reservation-header">
            <h4>{{ getObjectName(reservation.objectId) }}</h4>
            <span :class="['status', reservation.status]">{{ reservation.status }}</span>
          </div>
          
          <div class="reservation-details">
            <p><strong>Start:</strong> {{ formatDateTime(reservation.startDateTime) }}</p>
            <p><strong>End:</strong> {{ formatDateTime(reservation.endDateTime) }}</p>
            <p v-if="reservation.notes"><strong>Notes:</strong> {{ reservation.notes }}</p>
          </div>
          
          <div class="reservation-actions" v-if="reservation.status === 'active'">
            <button @click="cancelReservation(reservation.id)" class="btn-danger">
              Cancel Reservation
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  api, 
  type Reservation, 
  type ReservableObject, 
  type CreateReservationRequest 
} from '../services/api';

// Reactive state
const loading = ref(true);
const creating = ref(false);
const error = ref('');
const reservations = ref<Reservation[]>([]);
const objects = ref<ReservableObject[]>([]);

// Form data
const newReservation = ref<CreateReservationRequest>({
  objectId: '',
  startDateTime: '',
  endDateTime: '',
  notes: ''
});

// Fetch data on component mount
onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    // Load reservations and objects in parallel
    const [reservationsData, objectsData] = await Promise.all([
      api.getReservations(),
      api.getReservableObjects()
    ]);
    
    reservations.value = reservationsData;
    objects.value = objectsData;
  } catch (err: any) {
    error.value = err.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
};

const createReservation = async () => {
  try {
    creating.value = true;
    error.value = '';
    
    await api.createReservation(newReservation.value);
    
    // Reset form
    newReservation.value = {
      objectId: '',
      startDateTime: '',
      endDateTime: '',
      notes: ''
    };
    
    // Reload reservations
    await loadData();
  } catch (err: any) {
    error.value = err.message || 'Failed to create reservation';
  } finally {
    creating.value = false;
  }
};

const cancelReservation = async (id: string) => {
  if (!confirm('Are you sure you want to cancel this reservation?')) {
    return;
  }
  
  try {
    await api.cancelReservation(id);
    await loadData();
  } catch (err: any) {
    error.value = err.message || 'Failed to cancel reservation';
  }
};

const getObjectName = (objectId: string): string => {
  const object = objects.value.find(obj => obj.id === objectId);
  return object ? `${object.name} (${object.location})` : 'Unknown Object';
};

const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return date.toLocaleString();
};
</script>

<style scoped>
.reservation-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  margin: 20px 0;
}

.error {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.reservations-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .reservations-container {
    grid-template-columns: 1fr;
  }
}

.create-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.reservation-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.reservations-list {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.no-reservations {
  text-align: center;
  color: #6c757d;
  padding: 40px;
}

.reservation-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.reservation-header h4 {
  margin: 0;
  color: #333;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status.active {
  background-color: #d4edda;
  color: #155724;
}

.status.cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.reservation-details p {
  margin: 5px 0;
  color: #666;
}

.reservation-actions {
  margin-top: 10px;
  text-align: right;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-danger:hover {
  background-color: #c82333;
}
</style>