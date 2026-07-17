<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import { roundLayout } from '@/lib/tables'
import MatchCard from './MatchCard.vue'

const store = useTournamentStore()

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

const openMatches = computed(() => roundMatches.value.filter((m) => m.status !== 'done'))
const doneMatches = computed(() => roundMatches.value.filter((m) => m.status === 'done'))

const openMain = computed(() => openMatches.value.filter((m) => m.bracket === 'main'))
const openBotr = computed(() => openMatches.value.filter((m) => m.bracket === 'botr'))

const showRebuild = computed(
  () => viewRound.value === store.currentEventRound && store.rebuildPending,
)

// Fertige Spiele sind standardmäßig eingeklappt – außer die Runde ist komplett
// gespielt (Korrektur-Ansicht), dann direkt sichtbar.
const showDone = ref(false)
const doneVisible = computed(() => openMatches.value.length === 0 || showDone.value)
watch([viewRound, () => openMatches.value.length], () => {
  showDone.value = false
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="!store.started" class="text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
      Das Turnier wurde noch nicht gestartet. Lege 32 Teams an und klicke auf
      „Auslosen &amp; Turnier starten“.
    </div>

    <template v-else>
      <!-- Runden-Wahl -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm text-neutral-500">Runde:</span>
        <button
          v-for="er in availableRounds"
          :key="er"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition"
          :class="viewRound === er ? 'bg-beer-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'"
          @click="viewRound = er"
        >
          {{ er }}<span v-if="roundDone(er)"> ✓</span>
        </button>
      </div>

      <!-- Kopf -->
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

      <!-- Nächste Runde starten -->
      <button
        v-if="viewRound === store.currentEventRound && store.currentRoundComplete && store.hasNextRound"
        class="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 text-neutral-950 font-display text-2xl tracking-wide py-4 transition"
        @click="store.startNextRound()"
      >
        🏁 Nächste Runde starten
      </button>
      <div
        v-else-if="viewRound === store.currentEventRound && store.currentRoundComplete && !store.hasNextRound"
        class="w-full text-center rounded-xl bg-green-900/40 border border-green-800 text-green-200 font-display text-2xl tracking-wide py-4"
      >
        🏆 Turnier beendet
      </div>

      <!-- Offene Spiele -->
      <section v-if="openMain.length">
        <h3 class="font-display text-2xl tracking-wide text-beer-300 mb-3">
          Championship <span class="text-neutral-500 text-base">({{ openMain.length }})</span>
        </h3>
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <MatchCard v-for="m in openMain" :key="m.id" :match="m" />
        </div>
      </section>

      <section v-if="openBotr.length">
        <h3 class="font-display text-2xl tracking-wide text-sky-300 mb-3">
          Best of the Rest <span class="text-neutral-500 text-base">({{ openBotr.length }})</span>
        </h3>
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <MatchCard v-for="m in openBotr" :key="m.id" :match="m" />
        </div>
      </section>

      <p
        v-if="openMatches.length === 0 && doneMatches.length && viewRound === store.currentEventRound"
        class="text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center"
      >
        Alle Spiele dieser Runde sind gespielt. 🍻
      </p>

      <!-- Bereits gespielte Spiele (eingeklappt) -->
      <section v-if="doneMatches.length" class="pt-2">
        <button
          v-if="openMatches.length > 0"
          class="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 transition mb-3"
          @click="showDone = !showDone"
        >
          <span class="text-lg">{{ doneVisible ? '▾' : '▸' }}</span>
          <span class="font-medium">✓ Bereits gespielt ({{ doneMatches.length }})</span>
        </button>
        <h3 v-else class="font-display text-xl tracking-wide text-neutral-400 mb-3">
          ✓ Bereits gespielt ({{ doneMatches.length }})
        </h3>

        <div v-if="doneVisible" class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <MatchCard v-for="m in doneMatches" :key="m.id" :match="m" />
        </div>
      </section>
    </template>
  </div>
</template>
