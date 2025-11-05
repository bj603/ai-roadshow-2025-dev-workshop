<template>
  <div class="reservations-page">
    <div class="page-header">
      <h1>Workspace Reservations</h1>
      <p class="page-subtitle">Manage your desk and parking space reservations</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
        class="tab-btn"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Create Reservation Tab -->
      <div v-if="activeTab === 'create'" class="tab-panel">
        <CreateReservation 
          @reservation-created="onReservationCreated"
        />
      </div>

      <!-- My Reservations Tab -->
      <div v-if="activeTab === 'my-reservations'" class="tab-panel">
        <ReservationList 
          ref="reservationListRef"
          title="My Reservations"
        />
      </div>

      <!-- Browse Objects Tab -->
      <div v-if="activeTab === 'browse'" class="tab-panel">
        <ObjectList 
          ref="objectListRef"
          title="Available Objects"
          @reserve-object="onReserveObject"
        />
      </div>
    </div>

    <!-- Quick Actions Floating Panel -->
    <div v-if="showQuickActions" class="quick-actions">
      <div class="quick-actions-header">
        <h4>Quick Actions</h4>
        <button @click="showQuickActions = false" class="close-quick-actions">×</button>
      </div>
      
      <div class="quick-actions-content">
        <button @click="quickReserveDesk" class="quick-action-btn desk">
          🖥️ Reserve Desk
        </button>
        <button @click="quickReserveParking" class="quick-action-btn parking">
          🚗 Reserve Parking
        </button>
        <button @click="viewUpcomingReservations" class="quick-action-btn upcoming">
          📅 Upcoming
        </button>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button 
      v-if="!showQuickActions"
      @click="showQuickActions = true"
      class="fab"
      title="Quick Actions"
    >
      ⚡
    </button>

    <!-- Success/Error Messages -->
    <div v-if="message.text" :class="['message', message.type]" class="global-message">
      {{ message.text }}
      <button @click="clearMessage" class="close-message">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import CreateReservation from '../components/CreateReservation.vue';
import ReservationList from '../components/ReservationList.vue';
import ObjectList from '../components/ObjectList.vue';

// Reactive state
const activeTab = ref<'create' | 'my-reservations' | 'browse'>('create');
const showQuickActions = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

// Component refs
const reservationListRef = ref<InstanceType<typeof ReservationList>>();
const objectListRef = ref<InstanceType<typeof ObjectList>>();

// Tab configuration
const tabs = [
  {
    id: 'create',
    label: 'Create Reservation',
    icon: '➕'
  },
  {
    id: 'my-reservations',
    label: 'My Reservations',
    icon: '📋'
  },
  {
    id: 'browse',
    label: 'Browse Objects',
    icon: '🔍'
  }
] as const;

// Event handlers
const onReservationCreated = (reservationId: string) => {
  showMessage(`Reservation ${reservationId} created successfully!`, 'success');
  
  // Refresh the reservations list if it exists
  reservationListRef.value?.refresh();
  
  // Switch to my reservations tab to show the new reservation
  setTimeout(() => {
    activeTab.value = 'my-reservations';
  }, 1500);
};

const onReserveObject = (objectId: string) => {
  // Switch to create reservation tab and pre-select the object
  activeTab.value = 'create';
  
  // Show a message to guide the user
  showMessage(`Ready to reserve ${objectId}. Please select your preferred time.`, 'success');
  
  // Note: In a more advanced implementation, we could pass the objectId 
  // to the CreateReservation component to pre-select it
};

const quickReserveDesk = () => {
  activeTab.value = 'create';
  showQuickActions.value = false;
  showMessage('Quick desk reservation - select your preferred time slot', 'success');
};

const quickReserveParking = () => {
  activeTab.value = 'create';
  showQuickActions.value = false;
  showMessage('Quick parking reservation - select your preferred time slot', 'success');
};

const viewUpcomingReservations = () => {
  activeTab.value = 'my-reservations';
  showQuickActions.value = false;
  showMessage('Showing your upcoming reservations', 'success');
};

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = { text, type };
  
  // Auto-clear success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      clearMessage();
    }, 5000);
  }
};

const clearMessage = () => {
  message.value = { text: '', type: '' };
};

// Handle clicking outside quick actions to close it
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  const quickActionsEl = document.querySelector('.quick-actions');
  const fabEl = document.querySelector('.fab');
  
  if (showQuickActions.value && 
      quickActionsEl && 
      !quickActionsEl.contains(target) &&
      fabEl && 
      !fabEl.contains(target)) {
    showQuickActions.value = false;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  
  // Set initial tab based on URL hash if present
  const hash = window.location.hash.replace('#', '');
  if (hash && ['create', 'my-reservations', 'browse'].includes(hash)) {
    activeTab.value = hash as typeof activeTab.value;
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Update URL hash when tab changes
const updateUrlHash = (tabId: string) => {
  window.location.hash = tabId;
};

// Watch for tab changes
import { watch } from 'vue';
watch(activeTab, (newTab) => {
  updateUrlHash(newTab);
});
</script>

<style scoped>
.reservations-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.page-header h1 {
  margin: 0 0 10px 0;
  font-size: 36px;
  font-weight: 600;
}

.page-subtitle {
  margin: 0;
  font-size: 18px;
  opacity: 0.9;
}

.tab-navigation {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 4px;
  background: white;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 120px;
}

.tab-btn:hover {
  background: #f8f9fa;
}

.tab-btn.active {
  background: #007bff;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,123,255,0.3);
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.tab-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.tab-panel {
  padding: 30px;
  min-height: 600px;
}

/* Quick Actions Floating Panel */
.quick-actions {
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  padding: 0;
  z-index: 1000;
  min-width: 200px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.quick-actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.quick-actions-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-quick-actions {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
}

.quick-actions-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.quick-action-btn.desk {
  background: #e3f2fd;
  color: #1565c0;
}

.quick-action-btn.desk:hover {
  background: #bbdefb;
}

.quick-action-btn.parking {
  background: #f3e5f5;
  color: #7b1fa2;
}

.quick-action-btn.parking:hover {
  background: #e1bee7;
}

.quick-action-btn.upcoming {
  background: #e8f5e8;
  color: #2e7d32;
}

.quick-action-btn.upcoming:hover {
  background: #c8e6c9;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,123,255,0.4);
  transition: all 0.3s;
  z-index: 999;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0,123,255,0.5);
}

/* Global Messages */
.global-message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1001;
  max-width: 400px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.close-message {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: inherit;
  opacity: 0.7;
}

.close-message:hover {
  opacity: 1;
}

/* Responsive Design */
@media (max-width: 768px) {
  .reservations-page {
    padding: 10px;
  }
  
  .page-header {
    padding: 30px 15px;
    margin-bottom: 20px;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .page-subtitle {
    font-size: 16px;
  }
  
  .tab-navigation {
    flex-direction: column;
    max-width: none;
    margin-bottom: 20px;
  }
  
  .tab-btn {
    flex-direction: row;
    justify-content: center;
    min-width: auto;
  }
  
  .tab-panel {
    padding: 20px 15px;
    min-height: 400px;
  }
  
  .quick-actions {
    bottom: 70px;
    right: 10px;
    left: 10px;
    min-width: auto;
  }
  
  .fab {
    bottom: 10px;
    right: 10px;
  }
  
  .global-message {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .tab-btn .tab-label {
    font-size: 12px;
  }
  
  .tab-icon {
    font-size: 16px;
  }
}
</style>