<template>
  <div class="reservation-list">
    <div class="list-header">
      <div class="header-content">
        <h2 class="list-title">{{ title }}</h2>
        <div class="header-actions">
          <div class="view-toggle">
            <button
              @click="viewMode = 'list'"
              class="view-btn"
              :class="{ active: viewMode === 'list' }"
            >
              📋 List
            </button>
            <button
              @click="viewMode = 'calendar'"
              class="view-btn"
              :class="{ active: viewMode === 'calendar' }"
            >
              📅 Calendar
            </button>
          </div>
          <div class="filter-controls">
            <select v-model="statusFilter" @change="applyFilters" class="filter-select">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
            <select v-model="typeFilter" @change="applyFilters" class="filter-select">
              <option value="">All Types</option>
              <option value="parking">Parking</option>
              <option value="desk">Desk</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading reservations...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadReservations" class="retry-btn">Try Again</button>
    </div>

    <div v-else-if="filteredReservations.length === 0" class="empty-state">
      <div class="empty-icon">📅</div>
      <h3 class="empty-title">No reservations found</h3>
      <p class="empty-message">{{ getEmptyStateMessage() }}</p>
      <button v-if="showCreateButton" @click="onCreateReservation" class="create-btn">
        Make a Reservation
      </button>
    </div>

    <div v-else class="reservations-content">
      <!-- List View -->
      <div v-if="viewMode === 'list'" class="list-view">
        <div class="reservations-grid">
          <ReservationCard
            v-for="reservation in paginatedReservations"
            :key="reservation.id"
            :reservation="reservation"
            :object-details="getObjectDetails(reservation.objectId) || undefined"
            :show-actions="showActions"
            @cancel="handleCancel"
            @modify="handleModify"
            @view-details="handleViewDetails"
          />
        </div>
      </div>

      <!-- Calendar View -->
      <div v-else-if="viewMode === 'calendar'" class="calendar-view">
        <div class="calendar-container">
          <div class="calendar-header">
            <button @click="previousMonth" class="calendar-nav-btn">‹</button>
            <h3 class="calendar-title">{{ currentMonthYear }}</h3>
            <button @click="nextMonth" class="calendar-nav-btn">›</button>
          </div>
          <div class="calendar-grid">
            <div class="calendar-weekdays">
              <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
            </div>
            <div class="calendar-days">
              <div
                v-for="day in calendarDays"
                :key="day.date"
                class="calendar-day"
                :class="{
                  'other-month': !day.isCurrentMonth,
                  'today': day.isToday,
                  'has-reservations': day.reservations.length > 0
                }"
              >
                <div class="day-number">{{ day.dayNumber }}</div>
                <div class="day-reservations">
                  <div
                    v-for="reservation in day.reservations.slice(0, 3)"
                    :key="reservation.id"
                    class="reservation-dot"
                    :class="`status-${reservation.status}`"
                    :title="getReservationTitle(reservation)"
                  ></div>
                  <div v-if="day.reservations.length > 3" class="more-indicator">
                    +{{ day.reservations.length - 3 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1 && viewMode === 'list'" class="pagination">
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

    <!-- Confirmation Modal -->
    <div v-if="confirmModal.show" class="modal-overlay" @click="closeConfirmModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ confirmModal.title }}</h3>
            <button @click="closeConfirmModal" class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p>{{ confirmModal.message }}</p>
          </div>
          <div class="modal-actions">
            <button @click="closeConfirmModal" class="modal-btn secondary">Cancel</button>
            <button @click="confirmModal.action" class="modal-btn primary">
              {{ confirmModal.confirmText }}
            </button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import ReservationCard from './ReservationCard.vue';
import type { Reservation } from '../../services/reservations';
import type { ParkingSpace, Desk } from '../../services/objects';

interface Props {
  reservations: Reservation[];
  objects?: (ParkingSpace | Desk)[];
  title?: string;
  showActions?: boolean;
  showCreateButton?: boolean;
  isLoading?: boolean;
  error?: string | null;
  itemsPerPage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'My Reservations',
  showActions: true,
  showCreateButton: false,
  isLoading: false,
  error: null,
  itemsPerPage: 6
});

const emit = defineEmits<{
  'load': [];
  'create': [];
  'cancel': [reservation: Reservation];
  'modify': [reservation: Reservation];
  'viewDetails': [reservation: Reservation, object: ParkingSpace | Desk | null | undefined];
}>();

// Reactive data
const viewMode = ref<'list' | 'calendar'>('list');
const statusFilter = ref('');
const typeFilter = ref('');
const currentPage = ref(1);
const currentMonth = ref(new Date());

const confirmModal = ref({
  show: false,
  title: '',
  message: '',
  confirmText: '',
  action: () => {}
});

// Computed properties
const filteredReservations = computed(() => {
  let filtered = [...props.reservations];
  
  if (statusFilter.value) {
    filtered = filtered.filter(r => r.status === statusFilter.value);
  }
  
  if (typeFilter.value) {
    filtered = filtered.filter(r => r.objectType === typeFilter.value);
  }
  
  // Sort by start time (most recent first)
  return filtered.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
});

const paginatedReservations = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage;
  const end = start + props.itemsPerPage;
  return filteredReservations.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredReservations.value.length / props.itemsPerPage);
});

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const currentMonthYear = computed(() => {
  return currentMonth.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
});

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dateStr = date.toISOString().split('T')[0];
    const reservations = filteredReservations.value.filter(r => r.date === dateStr);
    
    days.push({
      date: dateStr,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString(),
      reservations
    });
  }
  
  return days;
});

// Methods
const loadReservations = () => {
  emit('load');
};

const applyFilters = () => {
  currentPage.value = 1;
};

const getObjectDetails = (objectId: string): ParkingSpace | Desk | null => {
  return props.objects?.find(obj => obj.id === objectId) || null;
};

const getEmptyStateMessage = (): string => {
  if (statusFilter.value || typeFilter.value) {
    return 'No reservations match your current filters.';
  }
  return "You haven't made any reservations yet.";
};

const getReservationTitle = (reservation: Reservation): string => {
  const object = getObjectDetails(reservation.objectId);
  const startTime = new Date(reservation.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${object?.name || 'Unknown'} at ${startTime}`;
};

const previousMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1);
};

const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1);
};

// Event handlers
const handleCancel = (reservation: Reservation) => {
  confirmModal.value = {
    show: true,
    title: 'Cancel Reservation',
    message: `Are you sure you want to cancel your reservation for ${getObjectDetails(reservation.objectId)?.name}?`,
    confirmText: 'Cancel Reservation',
    action: () => {
      emit('cancel', reservation);
      closeConfirmModal();
    }
  };
};

const handleModify = (reservation: Reservation) => {
  emit('modify', reservation);
};

const handleViewDetails = (reservation: Reservation, object: ParkingSpace | Desk | null | undefined) => {
  emit('viewDetails', reservation, object);
};

const onCreateReservation = () => {
  emit('create');
};

const closeConfirmModal = () => {
  confirmModal.value.show = false;
};

// Reset page when filters change
watch([statusFilter, typeFilter], () => {
  currentPage.value = 1;
});

// Auto-refresh reservations when component mounts
onMounted(() => {
  if (props.reservations.length === 0 && !props.isLoading) {
    loadReservations();
  }
});
</script>

<style scoped>
.reservation-list {
  width: 100%;
}

.list-header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 1.5rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.list-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-toggle {
  display: flex;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.25rem;
}

.view-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.view-btn.active {
  background: white;
  color: #007bff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-controls {
  display: flex;
  gap: 0.75rem;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #dc3545;
  font-size: 1rem;
  margin-bottom: 1rem;
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

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.empty-message {
  margin: 0 0 1.5rem 0;
  color: #666;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.create-btn {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.reservations-content {
  padding: 1.5rem;
}

.reservations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.calendar-view {
  max-width: 1000px;
  margin: 0 auto;
}

.calendar-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.calendar-nav-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  color: #666;
  transition: all 0.2s;
}

.calendar-nav-btn:hover {
  background: #e9ecef;
  color: #333;
}

.calendar-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.calendar-grid {
  padding: 1rem;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
}

.weekday {
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  color: #666;
  background: #f8f9fa;
  font-size: 0.9rem;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.calendar-day {
  aspect-ratio: 1;
  padding: 0.5rem;
  background: white;
  border: 1px solid #f0f0f0;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.calendar-day:hover {
  background: #f8f9fa;
}

.calendar-day.other-month {
  background: #f9f9f9;
  color: #ccc;
}

.calendar-day.today {
  background: #e3f2fd;
  border-color: #1976d2;
}

.calendar-day.has-reservations {
  border-left: 3px solid #007bff;
}

.day-number {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.calendar-day.other-month .day-number {
  color: #ccc;
}

.day-reservations {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
}

.reservation-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.reservation-dot.status-active {
  background: #28a745;
}

.reservation-dot.status-cancelled {
  background: #dc3545;
}

.reservation-dot.status-expired {
  background: #6c757d;
}

.more-indicator {
  font-size: 0.7rem;
  color: #666;
  font-weight: 500;
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
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 0.9rem;
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
  font-size: 0.9rem;
}

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
  max-width: 400px;
  width: 100%;
  animation: modalSlideIn 0.3s ease-out;
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
  font-size: 1.1rem;
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
  padding: 1.5rem;
}

.modal-body p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.modal-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.primary {
  background: #dc3545;
  color: white;
}

.modal-btn.primary:hover {
  background: #c82333;
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

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .filter-controls {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .reservations-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .calendar-day {
    padding: 0.25rem;
  }
  
  .day-number {
    font-size: 0.8rem;
  }
  
  .modal-content {
    margin: 1rem;
    max-width: none;
  }
}
</style>