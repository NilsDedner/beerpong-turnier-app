<script setup lang="ts">
import { computed } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import type { Bracket, Match } from '@/types'

const props = defineProps<{ bracket: Bracket }>()
const store = useTournamentStore()

interface Column {
  round: number
  label: string
  matches: Match[]
}

const columns = computed<Column[]>(() => {
  const all = store.bracketMatches(props.bracket).filter((m) => m.round !== store.THIRD_PLACE_ROUND)
  const byRound = new Map<number, Match[]>()
  for (const m of all) {
    if (!byRound.has(m.round)) byRound.set(m.round, [])
    byRound.get(m.round)!.push(m)
  }
  return [...byRound.keys()]
    .sort((a, b) => a - b)
    .map((round) => {
      const ms = byRound.get(round)!.sort((a, b) => a.slot - b.slot)
      return { round, label: roundLabel(ms), matches: ms }
    })
})

const thirdPlace = computed(() =>
  store.bracketMatches(props.bracket).find((m) => m.round === store.THIRD_PLACE_ROUND),
)

function roundLabel(ms: Match[]): string {
  // Erste Wort-Gruppe ohne die abschliessende Nummer.
  const base = ms[0]?.label.replace(/\s\d+$/, '') ?? ''
  return base
}

function isWinner(m: Match, side: 'a' | 'b'): boolean {
  const id = side === 'a' ? m.team_a_id : m.team_b_id
  return !!id && m.winner_id === id
}

function isLoser(m: Match, side: 'a' | 'b'): boolean {
  const id = side === 'a' ? m.team_a_id : m.team_b_id
  return !!m.winner_id && !!id && m.winner_id !== id
}
</script>

<template>
  <div class="overflow-x-auto pb-4">
    <div class="flex gap-6 min-w-max">
      <div v-for="col in columns" :key="col.round" class="flex flex-col">
        <div class="text-center font-display text-xl tracking-wide text-neutral-400 mb-3">
          {{ col.label }}
        </div>
        <div class="flex flex-col justify-around flex-1 gap-3 min-w-[190px]">
          <div
            v-for="m in col.matches"
            :key="m.id"
            class="rounded-lg border overflow-hidden text-sm"
            :class="m.status === 'ready' ? 'border-beer-600' : 'border-neutral-800'"
          >
            <div
              class="flex items-center justify-between px-3 py-2 border-b border-neutral-800"
              :class="[
                isWinner(m, 'a') ? 'bg-green-900/60 text-green-100 font-semibold' : 'bg-neutral-900',
                isLoser(m, 'a') ? 'text-neutral-500 line-through' : '',
              ]"
            >
              <span class="truncate">{{ store.teamName(m.team_a_id) || '—' }}</span>
            </div>
            <div
              class="flex items-center justify-between px-3 py-2"
              :class="[
                isWinner(m, 'b') ? 'bg-green-900/60 text-green-100 font-semibold' : 'bg-neutral-900',
                isLoser(m, 'b') ? 'text-neutral-500 line-through' : '',
              ]"
            >
              <span class="truncate">{{ store.teamName(m.team_b_id) || '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Spiel um Platz 3 -->
    <div v-if="thirdPlace" class="mt-4 max-w-[240px]">
      <div class="text-center font-display text-lg tracking-wide text-amber-400 mb-2">
        🥉 Spiel um Platz 3
      </div>
      <div class="rounded-lg border border-neutral-800 overflow-hidden text-sm">
        <div
          class="px-3 py-2 border-b border-neutral-800"
          :class="isWinner(thirdPlace, 'a') ? 'bg-green-900/60 text-green-100 font-semibold' : 'bg-neutral-900'"
        >
          {{ store.teamName(thirdPlace.team_a_id) || '—' }}
        </div>
        <div
          class="px-3 py-2"
          :class="isWinner(thirdPlace, 'b') ? 'bg-green-900/60 text-green-100 font-semibold' : 'bg-neutral-900'"
        >
          {{ store.teamName(thirdPlace.team_b_id) || '—' }}
        </div>
      </div>
    </div>
  </div>
</template>
