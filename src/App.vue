<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useTournamentStore } from '@/stores/tournament'

const store = useTournamentStore()

onMounted(() => store.init())
onBeforeUnmount(() => store.dispose())
</script>

<template>
  <div class="min-h-full">
    <!-- Hinweis auf den lokalen Offline-Modus (kein Supabase konfiguriert) -->
    <div
      v-if="store.backendKind === 'local'"
      class="bg-sky-900/80 text-sky-50 text-sm px-4 py-2 text-center"
    >
      🖥️ Lokaler Modus — Daten liegen nur in diesem Browser, Sync nur zwischen Tabs
      auf diesem Gerät. Für getrennte Geräte in
      <code class="font-mono">.env</code> Supabase eintragen (siehe
      <code class="font-mono">README.md</code>).
    </div>

    <router-view />
  </div>
</template>
