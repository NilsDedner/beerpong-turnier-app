<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import type { Match } from '@/types'

const props = defineProps<{ match: Match }>()
const store = useTournamentStore()
const busy = ref(false)
const err = ref<string | null>(null)

const tableNo = computed(() => store.tableNoOf(props.match))
const done = computed(() => props.match.status === 'done')
const blocked = computed(() => !done.value && store.isMatchBlocked(props.match))
// Bei fertigen Spielen: Korrektur möglich, solange kein Folgespiel entschieden ist.
const locked = computed(() => done.value && store.isDownstreamLocked(props.match))

async function pick(teamId: string | null) {
  if (!teamId || busy.value || blocked.value || locked.value) return
  if (teamId === props.match.winner_id) return
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

async function undo() {
  if (busy.value || locked.value) return
  busy.value = true
  err.value = null
  try {
    await store.undoMatch(props.match)
  } catch (e: any) {
    err.value = e?.message ?? String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div
    class="rounded-xl p-3 border"
    :class="[
      done ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-900 border-neutral-800',
      blocked ? 'opacity-60' : '',
      match.bracket === 'main' ? 'border-l-4 border-l-beer-500' : 'border-l-4 border-l-sky-500',
    ]"
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
        :class="match.winner_id === match.team_a_id ? 'is-winner' : done ? 'is-loser' : ''"
        :disabled="busy || blocked || locked"
        @click="pick(match.team_a_id)"
      >
        {{ store.teamName(match.team_a_id) || 'TBD' }}
      </button>

      <div class="flex items-center text-neutral-600 font-display text-xl">vs</div>

      <button
        class="team-btn"
        :class="match.winner_id === match.team_b_id ? 'is-winner' : done ? 'is-loser' : ''"
        :disabled="busy || blocked || locked"
        @click="pick(match.team_b_id)"
      >
        {{ store.teamName(match.team_b_id) || 'TBD' }}
      </button>
    </div>

    <p v-if="err" class="text-red-400 text-xs mt-2">{{ err }}</p>

    <!-- Fertig: Korrektur-Zeile -->
    <div v-else-if="done" class="flex items-center justify-between mt-2">
      <span v-if="locked" class="text-xs text-neutral-600">🔒 Folgespiel läuft – nicht änderbar</span>
      <span v-else class="text-xs text-neutral-500">anderes Team antippen zum Korrigieren</span>
      <button
        v-if="!locked"
        class="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-40"
        :disabled="busy"
        @click="undo"
      >
        ↩ Rückgängig
      </button>
    </div>

    <p v-else-if="blocked" class="text-amber-400 text-xs mt-2 text-center">
      ⏳ Wartet — vorherige Spiele dieser Runde laufen noch
    </p>
    <p v-else class="text-neutral-500 text-xs mt-2 text-center">
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
.team-btn.is-loser {
  @apply text-neutral-500 line-through;
}
</style>
