<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import type { Match } from '@/types'

const props = defineProps<{ match: Match }>()
const store = useTournamentStore()
const busy = ref(false)
const err = ref<string | null>(null)

const tableNo = computed(() => store.tableNoOf(props.match))
const blocked = computed(() => props.match.status !== 'done' && store.isTableBlocked(props.match))

async function pick(teamId: string | null) {
  if (!teamId || busy.value || blocked.value) return
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
  <div
    class="bg-neutral-900 border rounded-xl p-3"
    :class="blocked ? 'border-neutral-800 opacity-60' : 'border-neutral-800'"
  >
    <div class="flex items-center justify-between mb-2 gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-800 text-beer-300 whitespace-nowrap">
          🏓 Tisch {{ tableNo }}
        </span>
        <span class="text-xs uppercase tracking-wide text-neutral-500 truncate">{{ match.label }}</span>
      </div>
      <span
        class="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
        :class="match.bracket === 'main' ? 'bg-beer-900 text-beer-200' : 'bg-sky-900 text-sky-200'"
      >
        {{ match.bracket === 'main' ? 'Championship' : 'Best of the Rest' }}
      </span>
    </div>

    <div class="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
      <button
        class="team-btn"
        :class="match.winner_id === match.team_a_id ? 'is-winner' : ''"
        :disabled="busy || blocked"
        @click="pick(match.team_a_id)"
      >
        {{ store.teamName(match.team_a_id) || 'TBD' }}
      </button>

      <div class="flex items-center text-neutral-600 font-display text-xl">vs</div>

      <button
        class="team-btn"
        :class="match.winner_id === match.team_b_id ? 'is-winner' : ''"
        :disabled="busy || blocked"
        @click="pick(match.team_b_id)"
      >
        {{ store.teamName(match.team_b_id) || 'TBD' }}
      </button>
    </div>

    <p v-if="err" class="text-red-400 text-xs mt-2">{{ err }}</p>
    <p v-else-if="blocked" class="text-amber-400 text-xs mt-2 text-center">
      ⏳ Wartet — vorheriges Spiel an Tisch {{ tableNo }} läuft noch
    </p>
    <p v-else-if="match.status === 'ready'" class="text-neutral-500 text-xs mt-2 text-center">
      Auf das Sieger-Team tippen
    </p>
  </div>
</template>

<style scoped>
.team-btn {
  @apply rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-3
    font-medium text-neutral-100 hover:border-beer-500 hover:bg-neutral-700
    disabled:opacity-50 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-800
    transition text-center;
}
.team-btn.is-winner {
  @apply bg-green-800 border-green-600 text-green-50;
}
</style>
