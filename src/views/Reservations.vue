<template>
  <div class="reservations-view">
    <div class="view-header">
      <h1 class="page-title">My Reservations</h1>
      <p class="page-subtitle">Manage your workspace and parking reservations</p>
    </div>

    <div class="view-content">
      <div class="content-container">
        <ReservationList
          :reservations="reservations"
          :objects="objects"
          :is-loading="isLoading"
          :error="error"
          title="My Reservations"
          :show-actions="true"
          :show-create-button="true"
          @load="loadReservations"
          @create="handleCreateReservation"
          @cancel="handleCancelReservation"
          @modify="handleModifyReservation"
          @view-details="handleViewDetails"
        />
      </div>
    </div>

    <!-- Create Reservation Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Create New Reservation</h2>
          <button @click="closeCreateModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="reservation-tabs">
            <button
              @click="selectedTab = 'parking'"
              class="tab-btn"
              :class="{ active: selectedTab === 'parking' }"
            >
              🅿️ Parking Spaces
            </button>
            <button
              @click="selectedTab = 'desk'"
              class="tab-btn"
              :class="{ active: selectedTab === 'desk' }"
            >
              🪑 Workspaces
            </button>
          </div>
          <div class="tab-content">
            <ReservationForm
              :object-type="selectedTab"
              @submit="handleReservationSubmit"
              @cancel="closeCreateModal"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Reservation Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Reservation Details</h2>
          <button @click="closeDetailsModal" class="modal-close">×</button>
        </div>
        <div class="modal-body" v-if="selectedReservation">
          <div class="reservation-details">
            <div class="details-section">
              <h3>Reservation Information</h3>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Object:</span>
                  <span class="detail-value">{{ selectedObject?.name || 'Unknown' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Type:</span>
                  <span class="detail-value">{{ selectedReservation.objectType }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">{{ formatDate(selectedReservation.date) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">{{ formatTimeRange(selectedReservation.startTime, selectedReservation.endTime) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value" :class="`status-${selectedReservation.status}`">
                    {{ formatStatus(selectedReservation.status) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Confirmation:</span>
                  <span class="detail-value confirmation-code">{{ getConfirmationCode(selectedReservation.id) }}</span>
                </div>
              </div>
            </div>

            <div class="details-section" v-if="selectedObject">
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
              </div>
            </div>

            <div class="modal-actions">
              <button @click="closeDetailsModal" class="modal-btn secondary">Close</button>
              <button 
                v-if="canModifyReservation(selectedReservation)"
                @click="handleModifyFromDetails"
                class="modal-btn primary"
              >
                Modify Reservation
              </button>
              <button 
                v-if="canCancelReservation(selectedReservation)"
                @click="handleCancelFromDetails"
                class="modal-btn danger"
              >
                Cancel Reservation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ReservationList from '../components/reservations/ReservationList.vue';
import ReservationForm from '../components/reservations/ReservationForm.vue';
import type { Reservation } from '../services/reservations';
import type { ParkingSpace, Desk } from '../services/objects';
import type { CreateReservationRequest } from '../services/reservations';
import { reservationsService } from '../services/reservations';

// Reactive data
const reservations = ref<Reservation[]>([]);
const objects = ref<(ParkingSpace | Desk)[]>([]);
const isLoading = ref(false);
const error = ref('');

const showCreateModal = ref(false);
const showDetailsModal = ref(false);
const selectedTab = ref<'parking' | 'desk'>('parking');
const selectedReservation = ref<Reservation | null>(null);
const selectedObject = ref<ParkingSpace | Desk | null | undefined>(undefined);

// Methods
const loadReservations = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    const [reservationsData, objectsData] = await Promise.all([
      reservationsService.getUserReservations(),
      // Load objects to show details
      fetchObjects()
    ]);
    
    reservations.value = reservationsData;
    objects.value = objectsData;
  } catch (err) {
    console.error('Error loading reservations:', err);
    error.value = 'Failed to load reservations. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const fetchObjects = async (): Promise<(ParkingSpace | Desk)[]> => {
  // This would typically be a service call
  // For now, we'll return empty array
  return [];
};

const handleCreateReservation = () => {
  showCreateModal.value = true;
};

const handleReservationSubmit = async (reservation: CreateReservationRequest) => {
  try {
    await reservationsService.createReservation(reservation);
    closeCreateModal();
    await loadReservations();
    console.log('Reservation created successfully!');
  } catch (err) {
    console.error('Error creating reservation:', err);
    error.value = 'Failed to create reservation. Please try again.';
  }
};

const handleCancelReservation = async (reservation: Reservation) => {
  try {
    await reservationsService.cancelReservation(reservation.id);
    await loadReservations();
    console.log('Reservation cancelled successfully!');
  } catch (err) {
    console.error('Error cancelling reservation:', err);
    error.value = 'Failed to cancel reservation. Please try again.';
  }
};

const handleModifyReservation = (reservation: Reservation) => {
  // Implementation for modify reservation
  console.log('Modify reservation:', reservation);
};

const handleViewDetails = (reservation: Reservation, object: ParkingSpace | Desk | null | undefined) => {
  selectedReservation.value = reservation;
  selectedObject.value = object;
  showDetailsModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedReservation.value = null;
  selectedObject.value = null;
};

const handleModifyFromDetails = () => {
  if (selectedReservation.value) {
    handleModifyReservation(selectedReservation.value);
    closeDetailsModal();
  }
};

const handleCancelFromDetails = async () => {
  if (selectedReservation.value) {
    await handleCancelReservation(selectedReservation.value);
    closeDetailsModal();
  }
};

const canModifyReservation = (reservation: Reservation): boolean => {
  return reservationsService.canBeCancelled(reservation) && reservation.status === 'active';
};

const canCancelReservation = (reservation: Reservation): boolean => {
  return reservationsService.canBeCancelled(reservation);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTimeRange = (startTime: string, endTime: string): string => {
  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

const formatStatus = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
};

const getConfirmationCode = (reservationId: string): string => {
  return reservationId.split('-').pop()?.toUpperCase() || reservationId.slice(-6).toUpperCase();
};

// Initialize
onMounted(() => {
  loadReservations();
});
</script>

<style scoped>
.reservations-view {
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

.content-container {
  max-width: 1200px;
  margin: 0 auto;
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

.reservation-tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  color: #666;
}

.tab-btn.active {
  background: white;
  color: #007bff;
  border-bottom: 2px solid #007bff;
}

.tab-content {
  padding: 2rem;
}

.reservation-details {
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

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

.status-active {
  color: #28a745 !important;
}

.status-cancelled {
  color: #dc3545 !important;
}

.status-expired {
  color: #6c757d !important;
}

.confirmation-code {
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  font-size: 0.9rem;
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

.modal-btn.danger {
  background: #dc3545;
  color: white;
}

.modal-btn.danger:hover {
  background: #c82333;
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
  
  .modal-content,
  .modal-content.large {
    margin: 0.5rem;
    max-width: none;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .reservation-details {
    padding: 1rem;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .reservation-tabs {
    flex-direction: column;
  }
  
  .tab-content {
    padding: 1rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>