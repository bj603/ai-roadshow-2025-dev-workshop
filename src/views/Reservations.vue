<template>
  <div class="reservations-page">
    <div class="container">
      <header class="page-header">
        <h1>Workspace Reservations</h1>
        <p class="subtitle">Manage your desk and parking space reservations</p>
      </header>

      <!-- Navigation Tabs -->
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'browse' }]"
          @click="activeTab = 'browse'"
        >
          Browse & Reserve
        </button>
        <button 
          :class="['tab', { active: activeTab === 'my-reservations' }]"
          @click="activeTab = 'my-reservations'"
        >
          My Reservations
        </button>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="clearError" class="btn-link">Dismiss</button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading">
        <p>Loading...</p>
      </div>

      <!-- Browse & Reserve Tab -->
      <div v-if="activeTab === 'browse'" class="tab-content">
        <ObjectBrowser 
          @object-selected="handleObjectSelected"
          @reservation-created="handleReservationCreated"
        />
      </div>

      <!-- My Reservations Tab -->
      <div v-if="activeTab === 'my-reservations'" class="tab-content">
        <div class="reservations-section">
          <div class="section-header">
            <h2>Your Reservations</h2>
            <button @click="loadUserReservations" class="btn-secondary">
              Refresh
            </button>
          </div>

          <!-- Upcoming Reservations -->
          <div v-if="upcomingReservations.length > 0" class="reservations-group">
            <h3>Upcoming</h3>
            <div class="reservations-list">
              <ReservationCard
                v-for="reservation in upcomingReservations"
                :key="reservation.id"
                :reservation="reservation"
                :show-actions="true"
                @cancel="handleCancelReservation"
              />
            </div>
          </div>

          <!-- Past/Active Reservations -->
          <div v-if="pastReservations.length > 0" class="reservations-group">
            <h3>Recent & Past</h3>
            <div class="reservations-list">
              <ReservationCard
                v-for="reservation in pastReservations"
                :key="reservation.id"
                :reservation="reservation"
                :show-actions="false"
              />
            </div>
          </div>

          <!-- No Reservations State -->
          <div v-if="reservations.length === 0 && !isLoading" class="empty-state">
            <h3>No Reservations Yet</h3>
            <p>You haven't made any reservations. Start by browsing available desks and parking spaces.</p>
            <button @click="activeTab = 'browse'" class="btn-primary">
              Browse Available Objects
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useReservations } from '../composables/useReservations';
import { ReservableObject, Reservation, ReservationStatus } from '../types/reservations';
import ObjectBrowser from '../components/ObjectBrowser.vue';
import ReservationCard from '../components/ReservationCard.vue';

// State
const activeTab = ref<'browse' | 'my-reservations'>('browse');

// Composable
const {
  reservations,
  isLoading,
  error,
  upcomingReservations,
  loadUserReservations,
  cancelReservation,
  clearError
} = useReservations();

// Computed
const pastReservations = computed(() => {
  const now = new Date();
  return reservations.value
    .filter(res => res.status === ReservationStatus.ACTIVE)
    .filter(res => new Date(res.startDateTime) <= now)
    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());
});

// Event Handlers
function handleObjectSelected(object: ReservableObject) {
  console.log('Object selected:', object);
}

function handleReservationCreated(reservation: Reservation) {
  console.log('Reservation created:', reservation);
  // Switch to my reservations tab to show the new reservation
  activeTab.value = 'my-reservations';
  // Refresh the reservations list
  loadUserReservations();
}

async function handleCancelReservation(reservationId: string) {
  if (confirm('Are you sure you want to cancel this reservation?')) {
    try {
      await cancelReservation(reservationId);
      // Optionally show success message
    } catch (err) {
      console.error('Failed to cancel reservation:', err);
    }
  }
}

// Lifecycle
onMounted(() => {
  loadUserReservations();
});
</script>

<style scoped>
.reservations-page {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin: 0;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0;
}

.tab {
  background: none;
  border: none;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab:hover {
  color: #3b82f6;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message p {
  color: #dc2626;
  margin: 0;
}

.btn-link {
  background: none;
  border: none;
  color: #dc2626;
  text-decoration: underline;
  cursor: pointer;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.reservations-section {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.reservations-group {
  padding: 1.5rem;
}

.reservations-group:not(:last-child) {
  border-bottom: 1px solid #e2e8f0;
}

.reservations-group h3 {
  font-size: 1.125rem;
  font-weight: 500;
  color: #475569;
  margin: 0 0 1rem 0;
}

.reservations-list {
  display: grid;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}
</style>