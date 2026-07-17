<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import { roundLayout } from '@/lib/tables'
import MatchCard from './MatchCard.vue'

const store = useTournamentStore()

// Angezeigte Runde (folgt der aktuellen Runde, kann aber zurückgesetzt werden,
// um frühere Runden zu korrigieren).
const viewRound = ref(store.currentEventRound)
watch(
  () => store.currentEventRound,
  (er) => {
    viewRound.value = er
  },
)

const availableRounds = computed(() =>
  Array.from({ length: store.currentEventRound }, (_, i) => i + 1),
)

function roundDone(er: number): boolean {
  const ms = store.matchesForEventRound(er)
  return ms.length > 0 && ms.every((m) => m.status === 'done')
}

const viewLayout = computed(() => roundLayout(viewRound.value))
const roundMatches = computed(() => store.matchesForEventRound(viewRound.value))
const mainMatches = computed(() => roundMatches.value.filter((m) => m.bracket === 'main'))
const botrMatches = computed(() => roundMatches.value.filter((m) => m.bracket === 'botr'))

const showRebuild = computed(
  () => viewRound.value === store.currentEventRound && store.rebuildPending,
)
</script>

<template>
  <div class="space-y-6">
    <div v-if="!store.started" class="text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
      Das Turnier wurde noch nicht gestartet. Lege 32 Teams an und klicke auf
      „Auslosen &amp; Turnier starten“.
    </div>

    <template v-else>
      <!-- Runden-Wahl (auch zum Korrigieren früherer Runden) -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm text-neutral-500">Runde:</span>
        <button
          v-for="er in availableRounds"
          :key="er"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition"
          :class="viewRound === er
            ? 'bg-beer-500 text-neutral-950'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'"
          @click="viewRound = er"
        >
          {{ er }}<span v-if="roundDone(er)"> ✓</span>
        </button>
      </div>

      <!-- Kopf der gewählten Runde -->
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div class="font-display text-2xl tracking-wide text-beer-300">{{ viewLayout.name }}</div>
            <div class="text-sm text-neutral-400">{{ viewLayout.plays }}</div>
          </div>
          <span
            v-if="viewLayout.mode"
            class="text-xs px-2.5 py-1 rounded-full bg-purple-900 text-purple-200"
          >
            {{ viewLayout.mode }}
          </span>
        </div>

        <div
          v-if="showRebuild"
          class="mt-3 flex items-center gap-2 bg-amber-900/40 border border-amber-800 text-amber-200 rounded-lg px-3 py-2 text-sm"
        >
          🔧 <span><strong>Umbau nötig:</strong> {{ viewLayout.rebuildBefore }}</span>
        </div>
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
