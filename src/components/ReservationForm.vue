<template>
  <div class="reservation-form">
    <h2>Create New Reservation</h2>
    
    <form @submit.prevent="submitReservation" class="form">
      <div class="form-group">
        <label for="resource">Resource:</label>
        <select
          id="resource"
          v-model="formData.resourceId"
          required
          class="form-control"
        >
          <option value="">Select a resource...</option>
          <option 
            v-for="resource in resources" 
            :key="resource.id" 
            :value="resource.id"
          >
            {{ resource.name }} ({{ resource.type }}) - {{ resource.location }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="startDate">Start Date:</label>
        <input
          id="startDate"
          type="date"
          v-model="formData.startDate"
          required
          class="form-control"
          :min="minDate"
        />
      </div>

      <div class="form-group">
        <label for="startTime">Start Time:</label>
        <input
          id="startTime"
          type="time"
          v-model="formData.startTime"
          required
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="endDate">End Date:</label>
        <input
          id="endDate"
          type="date"
          v-model="formData.endDate"
          required
          class="form-control"
          :min="formData.startDate || minDate"
        />
      </div>

      <div class="form-group">
        <label for="endTime">End Time:</label>
        <input
          id="endTime"
          type="time"
          v-model="formData.endTime"
          required
          class="form-control"
        />
      </div>

      <div v-if="errorMessage" class="error-message">
        <p>{{ errorMessage }}</p>
        <ul v-if="validationErrors.length > 0">
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="isSubmitting" class="btn btn-primary">
          {{ isSubmitting ? 'Creating...' : 'Create Reservation' }}
        </button>
        <button type="button" @click="resetForm" class="btn btn-secondary">
          Reset
        </button>
      </div>
    </form>

    <div v-if="formData.resourceId && checkingAvailability" class="availability-info">
      <p>Checking availability...</p>
    </div>

    <div v-if="availabilityInfo && !checkingAvailability" class="availability-info">
      <h3>Current Reservations for {{ selectedResource?.name }}</h3>
      <div v-if="availabilityInfo.reservations.length === 0" class="no-reservations">
        No reservations found for the selected date.
      </div>
      <div v-else>
        <div 
          v-for="reservation in availabilityInfo.reservations" 
          :key="reservation.id"
          class="reservation-slot"
        >
          {{ formatDateTime(reservation.startDateTime) }} - {{ formatDateTime(reservation.endDateTime) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
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
  startDateTime: string
  endDateTime: string
  userId: string
}

interface AvailabilityInfo {
  resource: Resource
  reservations: Reservation[]
  date: string
  reservationCount: number
}

// Reactive data
const resources = ref<Resource[]>([])
const isSubmitting = ref(false)
const errorMessage = ref('')
const validationErrors = ref<string[]>([])
const successMessage = ref('')
const checkingAvailability = ref(false)
const availabilityInfo = ref<AvailabilityInfo | null>(null)

const formData = reactive({
  resourceId: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: ''
})

// Computed properties
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const selectedResource = computed(() => {
  return resources.value.find(r => r.id === formData.resourceId)
})

// Methods
const loadResources = async () => {
  try {
    const response = await callProtectedAPI('resources')
    if (response.ok) {
      resources.value = await response.json()
    } else {
      errorMessage.value = 'Failed to load resources'
    }
  } catch (error) {
    console.error('Error loading resources:', error)
    errorMessage.value = 'Failed to load resources'
  }
}

const checkAvailability = async () => {
  if (!formData.resourceId || !formData.startDate) return

  checkingAvailability.value = true
  try {
    const response = await callProtectedAPI(`reservations/availability/${formData.resourceId}?date=${formData.startDate}`)
    if (response.ok) {
      availabilityInfo.value = await response.json()
    }
  } catch (error) {
    console.error('Error checking availability:', error)
  } finally {
    checkingAvailability.value = false
  }
}

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString)
  return date.toLocaleString()
}

const submitReservation = async () => {
  // Clear previous messages
  errorMessage.value = ''
  validationErrors.value = []
  successMessage.value = ''

  // Client-side validation
  if (!formData.resourceId || !formData.startDate || !formData.startTime || 
      !formData.endDate || !formData.endTime) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }

  // Create DateTime strings
  const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString()
  const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`).toISOString()

  // Check if end is after start
  if (new Date(endDateTime) <= new Date(startDateTime)) {
    errorMessage.value = 'End time must be after start time'
    return
  }

  isSubmitting.value = true

  try {
    const response = await callProtectedAPI('reservations', {
      method: 'POST',
      body: JSON.stringify({
        resourceId: formData.resourceId,
        startDateTime,
        endDateTime
      })
    })

    if (response.ok) {
      const reservation = await response.json()
      successMessage.value = `Reservation created successfully! ID: ${reservation.id}`
      resetForm()
      await checkAvailability() // Refresh availability
    } else {
      const errorData = await response.json()
      errorMessage.value = errorData.detail || 'Failed to create reservation'
      if (errorData.errors) {
        validationErrors.value = errorData.errors
      }
    }
  } catch (error) {
    console.error('Error creating reservation:', error)
    errorMessage.value = 'Network error. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  formData.resourceId = ''
  formData.startDate = ''
  formData.startTime = ''
  formData.endDate = ''
  formData.endTime = ''
  errorMessage.value = ''
  validationErrors.value = []
  successMessage.value = ''
  availabilityInfo.value = null
}

// Auto-fill end date when start date changes
watch(() => formData.startDate, (newDate) => {
  if (newDate && !formData.endDate) {
    formData.endDate = newDate
  }
  checkAvailability()
})

// Check availability when resource changes
watch(() => formData.resourceId, () => {
  checkAvailability()
})

// Load resources on component mount
onMounted(() => {
  loadResources()
})
</script>

<style scoped>
.reservation-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.error-message ul {
  margin: 5px 0 0 20px;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.availability-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #e9ecef;
  border-radius: 4px;
}

.availability-info h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.no-reservations {
  color: #6c757d;
  font-style: italic;
}

.reservation-slot {
  background-color: #fff3cd;
  color: #856404;
  padding: 8px;
  margin: 5px 0;
  border-radius: 4px;
  border-left: 4px solid #ffc107;
}
</style>