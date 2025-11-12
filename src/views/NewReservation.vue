<template>
  <div class="new-reservation">
    <ReservationForm />
  </div>
</template>

<script setup lang="ts">
import ReservationForm from '../components/ReservationForm.vue'
</script>

<style scoped>
.new-reservation {
  min-height: 80vh;
  padding: 20px;
}
</style>