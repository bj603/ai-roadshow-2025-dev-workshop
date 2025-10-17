<template>
  <div class="reservations-container">
    <div class="header">
      <div class="nav-left">
        <h1>Workspace Reservations</h1>
        <router-link to="/welcome" class="nav-link">← Back to Welcome</router-link>
      </div>
      <div class="user-info">
        <span>Welcome, {{ user?.name }}</span>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </div>

    <div class="content">
      <!-- Create New Reservation Section -->
      <div class="section">
        <h2>Make a Reservation</h2>
        
        <form @submit.prevent="createReservation" class="reservation-form">
          <div class="form-group">
            <label for="objectType">Type:</label>
            <select 
              id="objectType" 
              v-model="selectedType" 
              @change="loadObjects"
              required
            >
              <option value="">Select type</option>
              <option value="DESK">Desk</option>
              <option value="PARKING_SPACE">Parking Space</option>
            </select>
          </div>

          <div class="form-group" v-if="objects.length > 0">
            <label for="object">Choose Location:</label>
            <select 
              id="object" 
              v-model="newReservation.objectId" 
              required
            >
              <option value="">Select location</option>
              <option 
                v-for="obj in objects" 
                :key="obj.id" 
                :value="obj.id"
              >
                {{ obj.name }} - {{ obj.location }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startDate">Date:</label>
              <input 
                id="startDate"
                type="date" 
                v-model="reservationDate" 
                :min="today"
                required
              />
            </div>

            <div class="form-group">
              <label for="startTime">Start Time:</label>
              <input 
                id="startTime"
                type="time" 
                v-model="startTime" 
                required
              />
            </div>

            <div class="form-group">
              <label for="duration">Duration (hours):</label>
              <select id="duration" v-model="duration" required>
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="4">4 hours</option>
                <option value="8">8 hours</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description (optional):</label>
            <textarea 
              id="description"
              v-model="newReservation.description" 
              rows="2"
              placeholder="Purpose of reservation..."
            ></textarea>
          </div>

          <div class="form-actions">
            <button 
              type="button" 
              @click="checkAvailability" 
              :disabled="!canCheckAvailability"
              class="check-btn"
            >
              Check Availability
            </button>
            
            <button 
              type="submit" 
              :disabled="!isAvailable || loading"
              class="submit-btn"
            >
              {{ loading ? 'Creating...' : 'Make Reservation' }}
            </button>
          </div>
        </form>

        <!-- Availability Status -->
        <div v-if="availabilityChecked" class="availability-status">
          <div v-if="isAvailable" class="available">
            ✅ Time slot is available!
          </div>
          <div v-else class="unavailable">
            ❌ Time slot is not available. Please choose a different time.
          </div>
        </div>

        <!-- Error Messages -->
        <div v-if="error" class="error">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="success">
          {{ successMessage }}
        </div>
      </div>

      <!-- My Reservations Section -->
      <div class="section">
        <h2>My Reservations</h2>
        
        <div v-if="reservations.length === 0" class="no-reservations">
          No reservations yet.
        </div>
        
        <div v-else class="reservations-list">
          <div 
            v-for="reservation in reservations" 
            :key="reservation.id"
            class="reservation-card"
          >
            <div class="reservation-info">
              <h3>{{ getObjectName(reservation.objectId) }}</h3>
              <p class="location">{{ getObjectLocation(reservation.objectId) }}</p>
              <p class="datetime">
                {{ formatDateTime(reservation.startDateTime) }} - 
                {{ formatTime(reservation.endDateTime) }}
              </p>
              <p v-if="reservation.description" class="description">
                {{ reservation.description }}
              </p>
            </div>
            <div class="reservation-actions">
              <button 
                @click="cancelReservation(reservation.id)"
                class="cancel-btn"
                :disabled="loading"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api, type ReservableObject, type Reservation, type User } from '../services/api';

const router = useRouter();

// Reactive data
const user = ref<User | null>(null);
const objects = ref<ReservableObject[]>([]);
const reservations = ref<Reservation[]>([]);
const selectedType = ref<'DESK' | 'PARKING_SPACE' | ''>('');
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const availabilityChecked = ref(false);
const isAvailable = ref(false);

// Form data
const newReservation = ref({
  objectId: '',
  description: ''
});

const reservationDate = ref(new Date().toISOString().split('T')[0]);
const startTime = ref('09:00');
const duration = ref(2);

// Computed properties
const today = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const canCheckAvailability = computed(() => {
  return newReservation.value.objectId && reservationDate.value && startTime.value;
});

// Helper functions
const getObjectName = (objectId: string): string => {
  const obj = objects.value.find(o => o.id === objectId);
  return obj?.name || 'Unknown';
};

const getObjectLocation = (objectId: string): string => {
  const obj = objects.value.find(o => o.id === objectId);
  return obj?.location || 'Unknown';
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const clearMessages = () => {
  error.value = '';
  successMessage.value = '';
  availabilityChecked.value = false;
};

// API functions
const loadProfile = async () => {
  try {
    user.value = await api.getProfile();
  } catch (err) {
    error.value = 'Failed to load profile';
    console.error(err);
  }
};

const loadObjects = async () => {
  if (!selectedType.value) return;
  
  try {
    clearMessages();
    objects.value = await api.getReservableObjects(selectedType.value);
    newReservation.value.objectId = '';
  } catch (err) {
    error.value = 'Failed to load objects';
    console.error(err);
  }
};

const loadReservations = async () => {
  try {
    reservations.value = await api.getReservations();
    
    // Load all objects to display names/locations in reservations
    const allObjects = await api.getReservableObjects();
    objects.value = [...objects.value, ...allObjects.filter(obj => 
      !objects.value.some(existing => existing.id === obj.id)
    )];
  } catch (err) {
    error.value = 'Failed to load reservations';
    console.error(err);
  }
};

const checkAvailability = async () => {
  if (!canCheckAvailability.value) return;
  
  try {
    clearMessages();
    loading.value = true;
    
    const startDateTime = new Date(`${reservationDate.value}T${startTime.value}`).toISOString();
    const durationMinutes = duration.value * 60;
    
    const result = await api.checkAvailability(
      newReservation.value.objectId,
      startDateTime,
      undefined,
      durationMinutes
    );
    
    isAvailable.value = result.isAvailable;
    availabilityChecked.value = true;
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to check availability';
  } finally {
    loading.value = false;
  }
};

const createReservation = async () => {
  if (!isAvailable.value) {
    error.value = 'Please check availability first';
    return;
  }
  
  try {
    loading.value = true;
    clearMessages();
    
    const startDateTime = new Date(`${reservationDate.value}T${startTime.value}`).toISOString();
    const durationMinutes = duration.value * 60;
    
    await api.createReservation({
      objectId: newReservation.value.objectId,
      startDateTime,
      duration: durationMinutes,
      description: newReservation.value.description
    });
    
    successMessage.value = 'Reservation created successfully!';
    
    // Reset form
    newReservation.value = { objectId: '', description: '' };
    reservationDate.value = '';
    startTime.value = '09:00';
    duration.value = 2;
    selectedType.value = '';
    objects.value = [];
    availabilityChecked.value = false;
    isAvailable.value = false;
    
    // Reload reservations
    await loadReservations();
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create reservation';
  } finally {
    loading.value = false;
  }
};

const cancelReservation = async (id: string) => {
  if (!confirm('Are you sure you want to cancel this reservation?')) return;
  
  try {
    loading.value = true;
    await api.cancelReservation(id);
    successMessage.value = 'Reservation cancelled successfully!';
    await loadReservations();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to cancel reservation';
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

// Initialize component
onMounted(() => {
  loadProfile();
  loadReservations();
});
</script>

<style scoped>
.reservations-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.nav-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header h1 {
  margin: 0;
  color: #333;
}

.nav-link {
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #c82333;
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.section {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.reservation-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.form-actions {
  display: flex;
  gap: 15px;
}

.check-btn,
.submit-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.check-btn {
  background: #6c757d;
  color: white;
}

.check-btn:hover:not(:disabled) {
  background: #5a6268;
}

.submit-btn {
  background: #007bff;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.check-btn:disabled,
.submit-btn:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.availability-status {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  font-weight: 500;
}

.available {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.unavailable {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.error {
  margin-top: 15px;
  padding: 10px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.success {
  margin-top: 15px;
  padding: 10px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
}

.no-reservations {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 40px 20px;
}

.reservations-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.reservation-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #f8f9fa;
}

.reservation-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.reservation-info p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.location {
  font-weight: 500;
}

.datetime {
  font-family: monospace;
}

.description {
  font-style: italic;
}

.cancel-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover:not(:disabled) {
  background: #c82333;
}

.cancel-btn:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .reservation-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>