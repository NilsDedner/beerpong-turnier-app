<script setup lang="ts">
import { computed } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import MatchCard from './MatchCard.vue'

const store = useTournamentStore()

// Alle noch offenen Matches der aktuellen Event-Runde (auch die, die auf ihren
// Tisch warten), sortiert nach Tisch. So sieht der Admin die Reihenfolge.
const roundMatches = computed(() =>
  store
    .matchesForEventRound(store.currentEventRound)
    .filter((m) => m.status !== 'done'),
)
const mainMatches = computed(() => roundMatches.value.filter((m) => m.bracket === 'main'))
const botrMatches = computed(() => roundMatches.value.filter((m) => m.bracket === 'botr'))
</script>

<template>
  <div class="space-y-6">
    <div v-if="!store.started" class="text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
      Das Turnier wurde noch nicht gestartet. Lege 32 Teams an und klicke auf
      „Auslosen &amp; Turnier starten“.
    </div>

    <template v-else>
      <!-- Kopf: aktuelle Runde -->
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div class="font-display text-2xl tracking-wide text-beer-300">
              {{ store.currentLayout.name }}
            </div>
            <div class="text-sm text-neutral-400">{{ store.currentLayout.plays }}</div>
          </div>
          <span
            v-if="store.currentLayout.mode"
            class="text-xs px-2.5 py-1 rounded-full bg-purple-900 text-purple-200"
          >
            {{ store.currentLayout.mode }}
          </span>
        </div>

        <!-- Umbau-Hinweis -->
        <div
          v-if="store.rebuildPending"
          class="mt-3 flex items-center gap-2 bg-amber-900/40 border border-amber-800 text-amber-200 rounded-lg px-3 py-2 text-sm"
        >
          🔧 <span><strong>Umbau nötig:</strong> {{ store.currentLayout.rebuildBefore }}</span>
        </div>
      </div>

      <div v-if="roundMatches.length === 0" class="text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
        Aktuell keine offenen Matches — warten auf Ergebnisse aus vorherigen Runden. 🍻
      </div>

      <section v-if="mainMatches.length">
        <h3 class="font-display text-2xl tracking-wide text-beer-300 mb-3">
          Championship <span class="text-neutral-500 text-base">({{ mainMatches.length }})</span>
        </h3>
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <MatchCard v-for="m in mainMatches" :key="m.id" :match="m" />
        </div>
      </section>

      <section v-if="botrMatches.length">
        <h3 class="font-display text-2xl tracking-wide text-sky-300 mb-3">
          Best of the Rest <span class="text-neutral-500 text-base">({{ botrMatches.length }})</span>
        </h3>
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <MatchCard v-for="m in botrMatches" :key="m.id" :match="m" />
        </div>
      </section>
    </template>
  </div>
</template>
