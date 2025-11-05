<template>
  <div class="time-slot-picker">
    <div class="date-section">
      <label for="date">Select Date:</label>
      <input
        id="date"
        type="date"
        :min="minDate"
        :max="maxDate"
        v-model="selectedDate"
        @change="onDateChange"
        class="date-input"
      />
    </div>

    <div class="time-section">
      <div class="time-input-group">
        <div class="time-input">
          <label for="start-time">Start Time:</label>
          <select
            id="start-time"
            v-model="selectedStartTime"
            @change="onStartTimeChange"
            class="time-select"
          >
            <option value="">Select start time</option>
            <option v-for="time in availableStartTimes" :key="time" :value="time">
              {{ formatTime(time) }}
            </option>
          </select>
        </div>

        <div class="time-input">
          <label for="end-time">End Time:</label>
          <select
            id="end-time"
            v-model="selectedEndTime"
            @change="onEndTimeChange"
            class="time-select"
            :disabled="!selectedStartTime"
          >
            <option value="">Select end time</option>
            <option v-for="time in availableEndTimes" :key="time" :value="time">
              {{ formatTime(time) }}
            </option>
          </select>
        </div>
      </div>

      <div class="duration-info" v-if="selectedStartTime && selectedEndTime">
        <p class="duration-text">
          Duration: {{ duration }} ({{ durationInHours }} hours)
        </p>
      </div>
    </div>

    <div v-if="hasConflict" class="conflict-alert">
      <p class="alert-message">
        ⚠️ This time slot conflicts with an existing reservation.
      </p>
    </div>

    <div class="quick-presets" v-if="!readonly">
      <label>Quick Select:</label>
      <div class="preset-buttons">
        <button
          v-for="preset in timePresets"
          :key="preset.label"
          @click="selectPreset(preset)"
          class="preset-btn"
          :class="{ active: isPresetSelected(preset) }"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

interface TimePreset {
  label: string;
  start: string;
  end: string;
  duration: string;
}

interface Props {
  modelValue?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  minDate?: string;
  maxDate?: string;
  readonly?: boolean;
  excludedSlots?: Array<{
    startTime: string;
    endTime: string;
  }>;
  onConflictCheck?: (date: string, startTime: string, endTime: string) => Promise<boolean>;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  excludedSlots: () => []
});

const emit = defineEmits<{
  'update:modelValue': [value: { date: string; startTime: string; endTime: string }];
  'change': [value: { date: string; startTime: string; endTime: string }];
}>();

// Reactive data
const selectedDate = ref(props.modelValue?.date || '');
const selectedStartTime = ref(props.modelValue?.startTime || '');
const selectedEndTime = ref(props.modelValue?.endTime || '');
const hasConflict = ref(false);

// Generate time slots in 30-minute increments
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 6; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const allTimeSlots = generateTimeSlots();

// Time presets for common booking patterns
const timePresets: TimePreset[] = [
  { label: 'Morning (9-12)', start: '09:00', end: '12:00', duration: '3h' },
  { label: 'Afternoon (13-17)', start: '13:00', end: '17:00', duration: '4h' },
  { label: 'Full Day (9-17)', start: '09:00', end: '17:00', duration: '8h' },
  { label: 'Short (2h)', start: '09:00', end: '11:00', duration: '2h' },
  { label: 'Evening (18-20)', start: '18:00', end: '20:00', duration: '2h' }
];

// Computed properties
const minDate = computed(() => {
  if (props.minDate) return props.minDate;
  return new Date().toISOString().split('T')[0];
});

const maxDate = computed(() => {
  if (props.maxDate) return props.maxDate;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  return maxDate.toISOString().split('T')[0];
});

const availableStartTimes = computed(() => {
  if (!selectedDate.value) return allTimeSlots;
  
  // Filter out excluded slots for the selected date
  const excludedTimes = props.excludedSlots.map(slot => slot.startTime);
  return allTimeSlots.filter(time => !excludedTimes.includes(time));
});

const availableEndTimes = computed(() => {
  if (!selectedStartTime.value) return [];
  
  const startIndex = allTimeSlots.indexOf(selectedStartTime.value);
  if (startIndex === -1) return [];
  
  // End time must be at least 1 hour after start time and not exceed 8 hours
  const minEndIndex = startIndex + 2; // +2 = 1 hour (30 min increments)
  const maxEndIndex = Math.min(startIndex + 16, allTimeSlots.length - 1); // +16 = 8 hours
  
  return allTimeSlots.slice(minEndIndex, maxEndIndex + 1);
});

const duration = computed(() => {
  if (!selectedStartTime.value || !selectedEndTime.value) return '';
  
  const start = new Date(`1970-01-01T${selectedStartTime.value}:00`);
  const end = new Date(`1970-01-01T${selectedEndTime.value}:00`);
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  }
  
  const hours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
});

const durationInHours = computed(() => {
  if (!selectedStartTime.value || !selectedEndTime.value) return 0;
  
  const start = new Date(`1970-01-01T${selectedStartTime.value}:00`);
  const end = new Date(`1970-01-01T${selectedEndTime.value}:00`);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
});

// Methods
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const selectPreset = (preset: TimePreset) => {
  if (props.readonly) return;
  
  selectedDate.value = minDate.value;
  selectedStartTime.value = preset.start;
  selectedEndTime.value = preset.end;
  emitChange();
};

const isPresetSelected = (preset: TimePreset): boolean => {
  return selectedStartTime.value === preset.start && 
         selectedEndTime.value === preset.end;
};

const onDateChange = () => {
  if (props.readonly) return;
  selectedStartTime.value = '';
  selectedEndTime.value = '';
  hasConflict.value = false;
  emitChange();
};

const onStartTimeChange = () => {
  if (props.readonly) return;
  selectedEndTime.value = '';
  hasConflict.value = false;
  emitChange();
};

const onEndTimeChange = () => {
  if (props.readonly) return;
  checkForConflicts();
  emitChange();
};

const checkForConflicts = async () => {
  if (!props.onConflictCheck || !selectedDate.value || !selectedStartTime.value || !selectedEndTime.value) {
    hasConflict.value = false;
    return;
  }
  
  try {
    hasConflict.value = await props.onConflictCheck(selectedDate.value, selectedStartTime.value, selectedEndTime.value);
  } catch (error) {
    console.error('Error checking conflicts:', error);
    hasConflict.value = false;
  }
};

const emitChange = () => {
  const value = {
    date: selectedDate.value,
    startTime: selectedStartTime.value,
    endTime: selectedEndTime.value
  };
  
  emit('update:modelValue', value);
  emit('change', value);
};

// Watch for external model changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedDate.value = newValue.date || '';
    selectedStartTime.value = newValue.startTime || '';
    selectedEndTime.value = newValue.endTime || '';
  }
}, { deep: true });

// Initialize with props
onMounted(() => {
  if (props.modelValue) {
    selectedDate.value = props.modelValue.date || '';
    selectedStartTime.value = props.modelValue.startTime || '';
    selectedEndTime.value = props.modelValue.endTime || '';
  }
});
</script>

<style scoped>
.time-slot-picker {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.date-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-section label,
.time-input-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.date-input,
.time-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;
}

.date-input:focus,
.time-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.time-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-input-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.time-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.duration-info {
  padding: 0.75rem;
  background: #e8f5e8;
  border: 1px solid #c3e6c3;
  border-radius: 6px;
  text-align: center;
}

.duration-text {
  margin: 0;
  font-weight: 600;
  color: #2d5a2d;
}

.conflict-alert {
  padding: 0.75rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  text-align: center;
}

.alert-message {
  margin: 0;
  color: #856404;
  font-weight: 600;
}

.quick-presets {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quick-presets label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preset-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.preset-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

@media (max-width: 768px) {
  .time-input-group {
    grid-template-columns: 1fr;
  }
  
  .preset-buttons {
    justify-content: center;
  }
  
  .time-slot-picker {
    padding: 1rem;
  }
}
</style>