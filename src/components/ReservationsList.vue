<template>
  <div class="reservations-list">
    <h2>My Reservations</h2>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label for="statusFilter">Status:</label>
        <select id="statusFilter" v-model="filters.status" class="form-control">
          <option value="">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active Now</option>
          <option value="past">Past</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="typeFilter">Resource Type:</label>
        <select id="typeFilter" v-model="filters.type" class="form-control">
          <option value="">All Types</option>
          <option value="desk">Desk</option>
          <option value="parking">Parking</option>
        </select>
      </div>

      <div class="filter-group">
        <button @click="refreshReservations" class="btn btn-secondary">
          {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && reservations.length === 0" class="loading">
      Loading reservations...
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- No reservations -->
    <div v-if="!isLoading && filteredReservations.length === 0" class="no-reservations">
      <p>No reservations found.</p>
      <router-link to="/reservations/new" class="btn btn-primary">
        Create Your First Reservation
      </router-link>
    </div>

    <!-- Reservations list -->
    <div v-else class="reservations-grid">
      <div 
        v-for="reservation in filteredReservations" 
        :key="reservation.id"
        class="reservation-card"
        :class="getStatusClass(reservation)"
      >
        <div class="reservation-header">
          <h3>{{ getResourceName(reservation.resourceId) }}</h3>
          <span class="status-badge" :class="getStatusClass(reservation)">
            {{ getReservationStatus(reservation) }}
          </span>
        </div>

        <div class="reservation-details">
          <div class="detail-item">
            <strong>Resource:</strong>
            {{ getResourceDetails(reservation.resourceId) }}
          </div>
          <div class="detail-item">
            <strong>Start:</strong>
            {{ formatDateTime(reservation.startDateTime) }}
          </div>
          <div class="detail-item">
            <strong>End:</strong>
            {{ formatDateTime(reservation.endDateTime) }}
          </div>
          <div class="detail-item">
            <strong>Duration:</strong>
            {{ calculateDuration(reservation.startDateTime, reservation.endDateTime) }}
          </div>
        </div>

        <div class="reservation-actions">
          <button 
            v-if="canEditReservation(reservation)"
            @click="editReservation(reservation)"
            class="btn btn-sm btn-secondary"
          >
            Edit
          </button>
          <button 
            v-if="canCancelReservation(reservation)"
            @click="cancelReservation(reservation)"
            class="btn btn-sm btn-danger"
            :disabled="isCancelling === reservation.id"
          >
            {{ isCancelling === reservation.id ? 'Cancelling...' : 'Cancel' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal (simple inline edit for now) -->
    <div v-if="editingReservation" class="edit-modal">
      <div class="modal-content">
        <h3>Edit Reservation</h3>
        <form @submit.prevent="submitEdit" class="edit-form">
          <div class="form-group">
            <label>Start Date & Time:</label>
            <input
              type="datetime-local"
              v-model="editForm.startDateTime"
              required
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label>End Date & Time:</label>
            <input
              type="datetime-local"
              v-model="editForm.endDateTime"
              required
              class="form-control"
            />
          </div>
          
          <div v-if="editError" class="error-message">
            {{ editError }}
          </div>

          <div class="modal-actions">
            <button type="submit" :disabled="isUpdating" class="btn btn-primary">
              {{ isUpdating ? 'Updating...' : 'Update' }}
            </button>
            <button type="button" @click="cancelEdit" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { callProtectedAPI } from '../services/api'

// Types
interface Resource {
  id: string
  type: 'desk' | 'parking'
  name: string
  location: string
  isActive: boolean
}

interface Reservation {
  id: string
  resourceId: string
  userId: string
  startDateTime: string
  endDateTime: string
  status: 'active' | 'cancelled'
  createdAt: string
}

// Reactive data
const reservations = ref<Reservation[]>([])
const resources = ref<Resource[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const isCancelling = ref('')
const editingReservation = ref<Reservation | null>(null)
const isUpdating = ref(false)
const editError = ref('')

const filters = reactive({
  status: '',
  type: ''
})

const editForm = reactive({
  startDateTime: '',
  endDateTime: ''
})

// Computed properties
const filteredReservations = computed(() => {
  let filtered = reservations.value.filter(r => r.status === 'active')

  // Filter by status
  if (filters.status) {
    const now = new Date()
    filtered = filtered.filter(reservation => {
      const start = new Date(reservation.startDateTime)
      const end = new Date(reservation.endDateTime)
      
      switch (filters.status) {
        case 'upcoming':
          return start > now
        case 'active':
          return start <= now && end >= now
        case 'past':
          return end < now
        default:
          return true
      }
    })
  }

  // Filter by resource type
  if (filters.type) {
    filtered = filtered.filter(reservation => {
      const resource = getResource(reservation.resourceId)
      return resource?.type === filters.type
    })
  }

  // Sort by start date (earliest first)
  return filtered.sort((a, b) => 
    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  )
})

// Methods
const loadReservations = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await callProtectedAPI('reservations')
    if (response.ok) {
      reservations.value = await response.json()
    } else {
      const errorData = await response.json()
      errorMessage.value = errorData.detail || 'Failed to load reservations'
    }
  } catch (error) {
    console.error('Error loading reservations:', error)
    errorMessage.value = 'Network error. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const loadResources = async () => {
  try {
    const response = await callProtectedAPI('resources')
    if (response.ok) {
      resources.value = await response.json()
    }
  } catch (error) {
    console.error('Error loading resources:', error)
  }
}

const refreshReservations = () => {
  loadReservations()
}

const getResource = (resourceId: string): Resource | undefined => {
  return resources.value.find(r => r.id === resourceId)
}

const getResourceName = (resourceId: string): string => {
  const resource = getResource(resourceId)
  return resource ? resource.name : 'Unknown Resource'
}

const getResourceDetails = (resourceId: string): string => {
  const resource = getResource(resourceId)
  return resource ? `${resource.name} (${resource.type}) - ${resource.location}` : 'Unknown Resource'
}

const getReservationStatus = (reservation: Reservation): string => {
  const now = new Date()
  const start = new Date(reservation.startDateTime)
  const end = new Date(reservation.endDateTime)

  if (start > now) return 'Upcoming'
  if (start <= now && end >= now) return 'Active'
  return 'Past'
}

const getStatusClass = (reservation: Reservation): string => {
  const status = getReservationStatus(reservation)
  switch (status) {
    case 'Upcoming':
      return 'status-upcoming'
    case 'Active':
      return 'status-active'
    case 'Past':
      return 'status-past'
    default:
      return ''
  }
}

const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleString()
}

const calculateDuration = (start: string, end: string): string => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  if (diffHours < 1) {
    const diffMinutes = diffMs / (1000 * 60)
    return `${Math.round(diffMinutes)} minutes`
  }
  
  return `${diffHours.toFixed(1)} hours`
}

const canEditReservation = (reservation: Reservation): boolean => {
  const now = new Date()
  const start = new Date(reservation.startDateTime)
  return start > now // Can only edit future reservations
}

const canCancelReservation = (reservation: Reservation): boolean => {
  const now = new Date()
  const end = new Date(reservation.endDateTime)
  return end > now // Can only cancel future/current reservations
}

const editReservation = (reservation: Reservation) => {
  editingReservation.value = reservation
  editError.value = ''
  
  // Convert to datetime-local format
  const start = new Date(reservation.startDateTime)
  const end = new Date(reservation.endDateTime)
  
  editForm.startDateTime = start.toISOString().slice(0, 16)
  editForm.endDateTime = end.toISOString().slice(0, 16)
}

const cancelEdit = () => {
  editingReservation.value = null
  editError.value = ''
  editForm.startDateTime = ''
  editForm.endDateTime = ''
}

const submitEdit = async () => {
  if (!editingReservation.value) return

  editError.value = ''
  isUpdating.value = true

  try {
    const response = await callProtectedAPI(`reservations/${editingReservation.value.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        startDateTime: new Date(editForm.startDateTime).toISOString(),
        endDateTime: new Date(editForm.endDateTime).toISOString()
      })
    })

    if (response.ok) {
      await loadReservations() // Refresh the list
      cancelEdit()
    } else {
      const errorData = await response.json()
      editError.value = errorData.detail || 'Failed to update reservation'
      if (errorData.errors && errorData.errors.length > 0) {
        editError.value += ': ' + errorData.errors.join(', ')
      }
    }
  } catch (error) {
    console.error('Error updating reservation:', error)
    editError.value = 'Network error. Please try again.'
  } finally {
    isUpdating.value = false
  }
}

const cancelReservation = async (reservation: Reservation) => {
  if (!confirm(`Are you sure you want to cancel the reservation for ${getResourceName(reservation.resourceId)}?`)) {
    return
  }

  isCancelling.value = reservation.id

  try {
    const response = await callProtectedAPI(`reservations/${reservation.id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      await loadReservations() // Refresh the list
    } else {
      const errorData = await response.json()
      errorMessage.value = errorData.detail || 'Failed to cancel reservation'
    }
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    errorMessage.value = 'Network error. Please try again.'
  } finally {
    isCancelling.value = ''
  }
}

// Load data on mount
onMounted(() => {
  loadResources()
  loadReservations()
})
</script>

<style scoped>
.reservations-list {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: bold;
  font-size: 14px;
}

.form-control {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.no-reservations {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.reservations-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.reservation-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background-color: white;
  transition: box-shadow 0.2s;
}

.reservation-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reservation-card.status-active {
  border-left: 4px solid #28a745;
}

.reservation-card.status-upcoming {
  border-left: 4px solid #007bff;
}

.reservation-card.status-past {
  border-left: 4px solid #6c757d;
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.reservation-header h3 {
  margin: 0;
  color: #333;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.status-active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.status-upcoming {
  background-color: #cce5ff;
  color: #004085;
}

.status-badge.status-past {
  background-color: #e2e3e5;
  color: #383d41;
}

.reservation-details {
  margin-bottom: 15px;
}

.detail-item {
  margin-bottom: 8px;
  color: #666;
}

.reservation-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

/* Edit Modal */
.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
}

.edit-form .form-group {
  margin-bottom: 15px;
}

.edit-form label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
  
  .reservations-grid {
    grid-template-columns: 1fr;
  }
  
  .reservation-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>