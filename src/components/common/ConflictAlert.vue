<template>
  <div v-if="show" class="conflict-alert" :class="`alert-${severity}`">
    <div class="alert-icon">
      <span v-if="severity === 'error'">⚠️</span>
      <span v-else-if="severity === 'warning'">⚡</span>
      <span v-else>ℹ️</span>
    </div>
    <div class="alert-content">
      <p class="alert-title">{{ title }}</p>
      <p v-if="message" class="alert-message">{{ message }}</p>
      <slot />
    </div>
    <button v-if="dismissible" @click="dismiss" class="alert-dismiss" aria-label="Dismiss alert">
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  show: boolean;
  title: string;
  message?: string;
  severity?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'warning',
  dismissible: true,
  autoHide: false,
  autoHideDelay: 5000
});

const emit = defineEmits<{
  'dismiss': [];
}>();

const isVisible = ref(props.show);

const dismiss = () => {
  isVisible.value = false;
  emit('dismiss');
};

watch(() => props.show, (newShow) => {
  isVisible.value = newShow;
});

watch(isVisible, (visible) => {
  if (visible && props.autoHide) {
    setTimeout(() => {
      dismiss();
    }, props.autoHideDelay);
  }
});
</script>

<style scoped>
.conflict-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.alert-error {
  background: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.alert-warning {
  background: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}

.alert-info {
  background: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.alert-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  line-height: 1;
  margin-top: 0.1rem;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
}

.alert-message {
  margin: 0;
  opacity: 0.9;
}

.alert-dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.alert-dismiss:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .conflict-alert {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .alert-title {
    font-size: 0.9rem;
  }
  
  .alert-message {
    font-size: 0.85rem;
  }
}
</style>