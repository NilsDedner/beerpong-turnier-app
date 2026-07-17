<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useTournamentStore } from '@/stores/tournament'

const store = useTournamentStore()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-10 px-6 text-center">
    <div>
      <div class="text-7xl mb-3">🍺🏓</div>
      <h1 class="font-display text-6xl md:text-7xl tracking-wide text-beer-400">
        {{ store.settings.title }}
      </h1>
      <p class="text-neutral-400 mt-2">32 Teams · KO · Best of the Rest</p>
    </div>

    <div class="grid sm:grid-cols-2 gap-6 w-full max-w-2xl">
      <RouterLink
        to="/admin"
        class="group rounded-2xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition p-8 flex flex-col items-center gap-3"
      >
        <span class="text-4xl">🛠️</span>
        <span class="font-display text-3xl tracking-wide text-beer-300">Admin</span>
        <span class="text-sm text-neutral-400">Teams &amp; Ergebnisse verwalten</span>
      </RouterLink>

      <RouterLink
        to="/display"
        class="group rounded-2xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition p-8 flex flex-col items-center gap-3"
      >
        <span class="text-4xl">📺</span>
        <span class="font-display text-3xl tracking-wide text-beer-300">Display</span>
        <span class="text-sm text-neutral-400">Turnierbaum für den Beamer</span>
      </RouterLink>
    </div>
  </div>
</template>
