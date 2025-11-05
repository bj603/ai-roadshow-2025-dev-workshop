<template>
  <div class="admin-objects-view">
    <div class="view-header">
      <h1 class="page-title">Manage Objects</h1>
      <p class="page-subtitle">Admin interface for managing parking spaces and workspaces</p>
    </div>

    <div class="view-content">
      <div class="content-container">
        <div class="admin-controls">
          <button @click="refreshData" class="refresh-btn">🔄 Refresh</button>
          <button @click="showCreateModal = true" class="create-btn">➕ Add New Object</button>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading objects...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p class="error-message">{{ error }}</p>
          <button @click="refreshData" class="retry-btn">Try Again</button>
        </div>

        <div v-else class="objects-admin">
          <div class="admin-tabs">
            <button
              @click="selectedTab = 'parking'"
              class="tab-btn"
              :class="{ active: selectedTab === 'parking' }"
            >
              🅿️ Parking Spaces ({{ parkingCount }})
            </button>
            <button
              @click="selectedTab = 'desk'"
              class="tab-btn"
              :class="{ active: selectedTab === 'desk' }"
            >
              🪑 Workspaces ({{ deskCount }})
            </button>
          </div>

          <div class="tab-content">
            <div v-if="selectedTab === 'parking'" class="objects-list">
              <ObjectCard
                v-for="object in parkingObjects"
                :key="object.id"
                :object="object"
                :show-admin-actions="true"
                @edit="handleEdit"
                @delete="handleDelete"
              />
            </div>

            <div v-if="selectedTab === 'desk'" class="objects-list">
              <ObjectCard
                v-for="object in deskObjects"
                :key="object.id"
                :object="object"
                :show-admin-actions="true"
                @edit="handleEdit"
                @delete="handleDelete"
              />
            </div>
          </div>
        </div>

        <!-- Analytics Section -->
        <div v-if="analytics" class="analytics-section">
          <h2>Usage Analytics</h2>
          <div class="analytics-grid">
            <div class="analytics-card">
              <h3>Total Objects</h3>
              <p class="analytics-value">{{ analytics.totalObjects }}</p>
            </div>
            <div class="analytics-card">
              <h3>Active Objects</h3>
              <p class="analytics-value">{{ analytics.activeObjects }}</p>
            </div>
            <div class="analytics-card">
              <h3>Utilization Rate</h3>
              <p class="analytics-value">{{ analytics.utilizationRate }}%</p>
            </div>
            <div class="analytics-card">
              <h3>Parking Spaces</h3>
              <p class="analytics-value">{{ analytics.parkingSpaces }}</p>
            </div>
            <div class="analytics-card">
              <h3>Workspaces</h3>
              <p class="analytics-value">{{ analytics.desks }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ObjectCard from '../components/objects/ObjectCard.vue';
import type { ParkingSpace, Desk } from '../services/objects';
import type { ObjectAnalytics } from '../services/objects';
import { objectsService } from '../services/objects';

// Reactive data
const objects = ref<(ParkingSpace | Desk)[]>([]);
const analytics = ref<ObjectAnalytics | null>(null);
const isLoading = ref(false);
const error = ref('');
const showCreateModal = ref(false);
const selectedTab = ref<'parking' | 'desk'>('parking');

// Computed properties
const parkingObjects = computed(() => 
  objects.value.filter(obj => obj.type === 'parking')
);

const deskObjects = computed(() => 
  objects.value.filter(obj => obj.type === 'desk')
);

const parkingCount = computed(() => parkingObjects.value.length);
const deskCount = computed(() => deskObjects.value.length);

// Methods
const loadObjects = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    objects.value = await objectsService.getObjects();
  } catch (err) {
    console.error('Error loading objects:', err);
    error.value = 'Failed to load objects. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const loadAnalytics = async () => {
  try {
    analytics.value = await objectsService.getAnalytics();
  } catch (err) {
    console.error('Error loading analytics:', err);
  }
};

const refreshData = async () => {
  await Promise.all([
    loadObjects(),
    loadAnalytics()
  ]);
};

const handleEdit = (object: ParkingSpace | Desk) => {
  // Implementation for edit object
  console.log('Edit object:', object);
};

const handleDelete = async (object: ParkingSpace | Desk) => {
  if (confirm(`Are you sure you want to delete ${object.name}?`)) {
    try {
      await objectsService.deleteObject(object.id);
      await refreshData();
      console.log('Object deleted successfully!');
    } catch (err) {
      console.error('Error deleting object:', err);
      error.value = 'Failed to delete object. Please try again.';
    }
  }
};

// Initialize
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.admin-objects-view {
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

.admin-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: flex-end;
}

.refresh-btn,
.create-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn {
  background: #6c757d;
  color: white;
}

.refresh-btn:hover {
  background: #545b62;
}

.create-btn {
  background: #28a745;
  color: white;
}

.create-btn:hover {
  background: #218838;
}

.loading-state,
.error-state {
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

.admin-tabs {
  display: flex;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
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
  background: #007bff;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #f8f9fa;
  color: #007bff;
}

.tab-content {
  min-height: 400px;
}

.objects-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.analytics-section {
  margin-top: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.analytics-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.analytics-card {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.analytics-card h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.analytics-value {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #007bff;
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
  
  .admin-controls {
    justify-content: stretch;
    flex-direction: column;
  }
  
  .admin-tabs {
    flex-direction: column;
  }
  
  .objects-list {
    grid-template-columns: 1fr;
  }
  
  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>