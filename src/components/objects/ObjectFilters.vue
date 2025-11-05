<template>
  <div class="object-filters">
    <div class="filters-header">
      <h3 class="filters-title">Filters</h3>
      <button v-if="hasActiveFilters" @click="clearAllFilters" class="clear-filters-btn">
        Clear All
      </button>
    </div>

    <div class="filters-content">
      <!-- Type Filter -->
      <div class="filter-section">
        <label class="filter-label">Type</label>
        <div class="filter-options">
          <label class="filter-option">
            <input 
              type="radio" 
              value="" 
              v-model="filters.type"
              @change="emitFilters"
            />
            <span class="option-label">All</span>
          </label>
          <label class="filter-option">
            <input 
              type="radio" 
              value="parking" 
              v-model="filters.type"
              @change="emitFilters"
            />
            <span class="option-label">🅿️ Parking</span>
          </label>
          <label class="filter-option">
            <input 
              type="radio" 
              value="desk" 
              v-model="filters.type"
              @change="emitFilters"
            />
            <span class="option-label">🪑 Desk</span>
          </label>
        </div>
      </div>

      <!-- Location Filter -->
      <div class="filter-section">
        <label class="filter-label">Location</label>
        <select v-model="filters.location" @change="emitFilters" class="filter-select">
          <option value="">All Locations</option>
          <option v-for="location in availableLocations" :key="location" :value="location">
            {{ location }}
          </option>
        </select>
      </div>

      <!-- Status Filter -->
      <div class="filter-section">
        <label class="filter-label">Status</label>
        <div class="filter-options">
          <label class="filter-option">
            <input 
              type="radio" 
              value="" 
              v-model="filters.isActive"
              @change="emitFilters"
            />
            <span class="option-label">All</span>
          </label>
          <label class="filter-option">
            <input 
              type="radio" 
              value="true" 
              v-model="filters.isActive"
              @change="emitFilters"
            />
            <span class="option-label">✅ Active</span>
          </label>
          <label class="filter-option">
            <input 
              type="radio" 
              value="false" 
              v-model="filters.isActive"
              @change="emitFilters"
            />
            <span class="option-label">❌ Inactive</span>
          </label>
        </div>
      </div>

      <!-- Parking Space Specific Filters -->
      <div v-if="showParkingFilters" class="filter-section">
        <label class="filter-label">Parking Features</label>
        <div class="filter-options">
          <label class="filter-option checkbox-option">
            <input 
              type="checkbox" 
              v-model="filters.hasEVCharging"
              @change="emitFilters"
            />
            <span class="option-label">⚡ EV Charging</span>
          </label>
          <label class="filter-option checkbox-option">
            <input 
              type="checkbox" 
              v-model="filters.isCovered"
              @change="emitFilters"
            />
            <span class="option-label">🏠 Covered</span>
          </label>
          <label class="filter-option checkbox-option">
            <input 
              type="checkbox" 
              v-model="filters.isAccessible"
              @change="emitFilters"
            />
            <span class="option-label">♿ Accessible</span>
          </label>
        </div>
      </div>

      <!-- Desk Specific Filters -->
      <div v-if="showDeskFilters" class="filter-section">
        <label class="filter-label">Workspace Type</label>
        <div class="filter-options">
          <label class="filter-option">
            <input 
              type="radio" 
              value="" 
              v-model="filters.workspaceType"
              @change="emitFilters"
            />
            <span class="option-label">All</span>
          </label>
          <label class="filter-option">
            <input 
              type="radio" 
              value="hotdesk" 
              v-model="filters.workspaceType"
              @change="emitFilters"
            />
            <span class="option-label">🔥 Hot Desk</span>
          </label>
          <label class="filter-option">
            <input 
              type="radio" 
              value="dedicated" 
              v-model="filters.workspaceType"
              @change="emitFilters"
            />
            <span class="option-label">🏢 Dedicated</span>
          </label>
          <label class="filter-option">
            <input 
              type="radio" 
              value="meeting_room" 
              v-model="filters.workspaceType"
              @change="emitFilters"
            />
            <span class="option-label">🗣️ Meeting Room</span>
          </label>
        </div>
      </div>

      <div v-if="showDeskFilters" class="filter-section">
        <label class="filter-label">Desk Features</label>
        <div class="filter-options">
          <label class="filter-option checkbox-option">
            <input 
              type="checkbox" 
              v-model="filters.hasWindow"
              @change="emitFilters"
            />
            <span class="option-label">🌅 Window View</span>
          </label>
        </div>
      </div>
    </div>

    <div class="filters-footer">
      <div class="results-count" v-if="resultsCount !== null">
        {{ resultsCount }} {{ resultsCount === 1 ? 'result' : 'results' }} found
      </div>
      <div class="active-filters" v-if="hasActiveFilters">
        <span class="active-filters-label">Active filters:</span>
        <div class="active-filter-tags">
          <span v-if="filters.type" class="filter-tag">
            {{ getFilterLabel('type', filters.type) }}
            <button @click="clearFilter('type')" class="filter-tag-remove">×</button>
          </span>
          <span v-if="filters.location" class="filter-tag">
            {{ getFilterLabel('location', filters.location) }}
            <button @click="clearFilter('location')" class="filter-tag-remove">×</button>
          </span>
          <span v-if="filters.isActive !== null && filters.isActive !== undefined" class="filter-tag">
            {{ getFilterLabel('isActive', filters.isActive) }}
            <button @click="clearFilter('isActive')" class="filter-tag-remove">×</button>
          </span>
          <span v-if="filters.hasEVCharging" class="filter-tag">
            EV Charging
            <button @click="clearFilter('hasEVCharging')" class="filter-tag-remove">×</button>
          </span>
          <span v-if="filters.isCovered" class="filter-tag">
            Covered
            <button @click="clearFilter('isCovered')" class="filter-tag-remove">×</button>
          </span>
          <span v-if="filters.isAccessible" class="filter-tag">
            Accessible
            <button @click="clearFilter('isAccessible')" class="filter-tag-remove">×</button>
          </span>
          <span v-if="filters.workspaceType" class="filter-tag">
            {{ getFilterLabel('workspaceType', filters.workspaceType) }}
            <button @click="clearFilter('workspaceType')" class="filter-tag-remove">×</button>
          </span>
          <span v-if="filters.hasWindow" class="filter-tag">
            Window View
            <button @click="clearFilter('hasWindow')" class="filter-tag-remove">×</button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { ObjectFilters } from '../../services/objects';

interface Props {
  modelValue?: Partial<ObjectFilters>;
  availableLocations?: string[];
  resultsCount?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  availableLocations: () => [],
  resultsCount: null
});

const emit = defineEmits<{
  'update:modelValue': [filters: Partial<ObjectFilters>];
  'change': [filters: Partial<ObjectFilters>];
}>();

const filters = ref<Partial<ObjectFilters>>({
  type: undefined,
  location: '',
  isActive: undefined,
  level: undefined,
  workspaceType: undefined,
  hasEVCharging: undefined,
  hasWindow: undefined,
  isCovered: undefined,
  isAccessible: undefined
});

// Computed properties
const showParkingFilters = computed(() => {
  return !filters.value.type || filters.value.type === 'parking';
});

const showDeskFilters = computed(() => {
  return !filters.value.type || filters.value.type === 'desk';
});

const hasActiveFilters = computed(() => {
  return Object.entries(filters.value).some(([key, value]) => {
    if (key === 'isActive') {
      return value !== undefined && value !== '';
    }
    return value !== undefined && value !== '' && value !== false;
  });
});

// Methods
const emitFilters = () => {
  // Clean up undefined values and empty strings
  const cleanedFilters: any = {};
  
  Object.entries(filters.value).forEach(([key, value]) => {
    if (key === 'isActive') {
      if (value !== undefined && value !== '') {
        cleanedFilters[key] = value === 'true' ? true : value === 'false' ? false : value;
      }
    } else if (value !== undefined && value !== '' && value !== false) {
      cleanedFilters[key] = value;
    }
  });
  
  emit('update:modelValue', cleanedFilters);
  emit('change', cleanedFilters);
};

const clearAllFilters = () => {
  filters.value = {
    type: undefined,
    location: '',
    isActive: undefined,
    level: undefined,
    workspaceType: undefined,
    hasEVCharging: undefined,
    hasWindow: undefined,
    isCovered: undefined,
    isAccessible: undefined
  };
  emitFilters();
};

const clearFilter = (filterKey: keyof ObjectFilters) => {
  if (filterKey === 'isActive') {
    (filters.value as any).isActive = undefined;
  } else if (typeof (filters.value as any)[filterKey] === 'boolean') {
    (filters.value as any)[filterKey] = undefined;
  } else {
    (filters.value as any)[filterKey] = '';
  }
  emitFilters();
};

const getFilterLabel = (key: string, value: any): string => {
  const labelMap: Record<string, Record<string, string>> = {
    type: {
      'parking': 'Parking',
      'desk': 'Desk'
    },
    workspaceType: {
      'hotdesk': 'Hot Desk',
      'dedicated': 'Dedicated',
      'meeting_room': 'Meeting Room'
    },
    isActive: {
      'true': 'Active',
      'false': 'Inactive'
    }
  };
  
  return labelMap[key]?.[value] || value;
};

// Initialize with props
onMounted(() => {
  if (props.modelValue) {
    filters.value = {
      ...filters.value,
      ...props.modelValue
    };
  }
});

// Watch for external model changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    filters.value = {
      ...filters.value,
      ...newValue
    };
  }
}, { deep: true });
</script>

<style scoped>
.object-filters {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.filters-header {
  padding: 1rem 1.25rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.clear-filters-btn {
  padding: 0.25rem 0.75rem;
  background: transparent;
  border: 1px solid #dc3545;
  color: #dc3545;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background: #dc3545;
  color: white;
}

.filters-content {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.filter-option:hover {
  background: #f8f9fa;
}

.filter-option.checkbox-option {
  justify-content: flex-start;
}

.filter-option input[type="radio"],
.filter-option input[type="checkbox"] {
  margin: 0;
}

.option-label {
  font-size: 0.9rem;
  color: #555;
}

.filter-select {
  padding: 0.5rem;
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

.filters-footer {
  padding: 1rem 1.25rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.results-count {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.active-filters {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.active-filters-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.active-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.filter-tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.8rem;
  line-height: 1;
}

.filter-tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .object-filters {
    margin: 0.5rem;
  }
  
  .filters-header {
    padding: 0.75rem 1rem;
  }
  
  .filters-content {
    padding: 0.75rem 1rem;
  }
  
  .filters-footer {
    padding: 0.75rem 1rem;
  }
  
  .filter-options {
    gap: 0.25rem;
  }
  
  .filter-option {
    padding: 0.375rem;
  }
}
</style>