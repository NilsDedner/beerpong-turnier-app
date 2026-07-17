<script setup lang="ts">
import { ref } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import type { Match } from '@/types'

const props = defineProps<{ match: Match }>()
const store = useTournamentStore()
const busy = ref(false)
const err = ref<string | null>(null)

async function pick(teamId: string | null) {
  if (!teamId || busy.value) return
  busy.value = true
  err.value = null
  try {
    await store.setWinner(props.match, teamId)
  } catch (e: any) {
    err.value = e?.message ?? String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs uppercase tracking-wide text-neutral-500">{{ match.label }}</span>
      <span
        class="text-[10px] px-1.5 py-0.5 rounded"
        :class="match.bracket === 'main' ? 'bg-beer-900 text-beer-200' : 'bg-sky-900 text-sky-200'"
      >
        {{ match.bracket === 'main' ? 'Championship' : 'Best of the Rest' }}
      </span>
    </div>

    <div class="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
      <button
        class="team-btn"
        :class="match.winner_id === match.team_a_id ? 'is-winner' : ''"
        :disabled="busy"
        @click="pick(match.team_a_id)"
      >
        {{ store.teamName(match.team_a_id) || 'TBD' }}
      </button>

      <div class="flex items-center text-neutral-600 font-display text-xl">vs</div>

      <button
        class="team-btn"
        :class="match.winner_id === match.team_b_id ? 'is-winner' : ''"
        :disabled="busy"
        @click="pick(match.team_b_id)"
      >
        {{ store.teamName(match.team_b_id) || 'TBD' }}
      </button>
    </div>

    <p v-if="err" class="text-red-400 text-xs mt-2">{{ err }}</p>
    <p v-else-if="match.status === 'ready'" class="text-neutral-500 text-xs mt-2 text-center">
      Auf das Sieger-Team tippen
    </p>
  </div>
</template>

<style scoped>
.team-btn {
  @apply rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-3
    font-medium text-neutral-100 hover:border-beer-500 hover:bg-neutral-700
    disabled:opacity-50 transition text-center;
}
.team-btn.is-winner {
  @apply bg-green-800 border-green-600 text-green-50;
}
</style>
