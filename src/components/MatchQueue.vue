<script setup lang="ts">
import { computed } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import MatchCard from './MatchCard.vue'

const store = useTournamentStore()

const mainMatches = computed(() => store.playableMatches.filter((m) => m.bracket === 'main'))
const botrMatches = computed(() => store.playableMatches.filter((m) => m.bracket === 'botr'))
</script>

<template>
  <div class="space-y-6">
    <div v-if="!store.started" class="text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
      Das Turnier wurde noch nicht gestartet. Lege 32 Teams an und klicke auf
      „Auslosen &amp; Turnier starten“.
    </div>

    <template v-else>
      <div v-if="store.playableMatches.length === 0" class="text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
        Aktuell keine spielbaren Matches — alle offenen Spiele warten auf Ergebnisse
        aus vorherigen Runden. 🍻
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
