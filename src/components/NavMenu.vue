<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const open = ref(false)
</script>

<template>
  <div class="relative">
    <button
      class="flex flex-col justify-center items-center gap-1.5 w-11 h-11 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 hover:border-beer-500 transition"
      aria-label="Menü"
      title="Menü"
      @click="open = !open"
    >
      <span class="block w-6 h-0.5 bg-beer-300 rounded"></span>
      <span class="block w-6 h-0.5 bg-beer-300 rounded"></span>
      <span class="block w-6 h-0.5 bg-beer-300 rounded"></span>
    </button>

    <!-- Backdrop zum Schließen -->
    <div v-if="open" class="fixed inset-0 z-40" @click="open = false"></div>

    <!-- Menü -->
    <div
      v-if="open"
      class="absolute left-0 mt-2 z-50 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden"
    >
      <RouterLink to="/display" class="menu-item" @click="open = false">📺 Display</RouterLink>
      <RouterLink to="/regeln" class="menu-item" @click="open = false">📖 Spielregeln</RouterLink>
      <div class="border-t border-neutral-800"></div>
      <RouterLink to="/admin" class="menu-item" @click="open = false">🛠️ Admin</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.menu-item {
  @apply flex items-center gap-2 px-4 py-3 text-neutral-200 hover:bg-neutral-800 transition;
}
</style>
