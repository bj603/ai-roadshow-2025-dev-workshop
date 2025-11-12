<template>
  <div class="reservations">
    <ReservationsList />
  </div>
</template>

<script setup lang="ts">
import ReservationsList from '../components/ReservationsList.vue'
</script>

<style scoped>
.reservations {
  min-height: 80vh;
  padding: 20px;
}
</style>