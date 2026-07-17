<script setup lang="ts">
import { computed } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import { assignmentOf, tableStatus, type TableStatus } from '@/lib/tables'
import type { Bracket, Match } from '@/types'

const store = useTournamentStore()

interface TableCell {
  no: number
  status: TableStatus | 'off'
  current: Match | null
  next: Match | null
  bracket: Bracket | null
  allDone: boolean
}

const ZONES: { name: string; tables: number[] }[] = [
  { name: 'Arena', tables: [1, 2, 3, 4] },
  { name: 'Mitte', tables: [5, 6, 7, 8, 9, 10] },
  { name: 'Tanzfläche', tables: [11, 12, 13, 14, 15, 16] },
]

const cells = computed<Record<number, TableCell>>(() => {
  const er = store.currentEventRound
  const byTable = new Map<number, Match[]>()
  for (const m of store.matchesForEventRound(er)) {
    const t = assignmentOf(m).tableNo
    if (!byTable.has(t)) byTable.set(t, [])
    byTable.get(t)!.push(m)
  }
  const out: Record<number, TableCell> = {}
  for (let no = 1; no <= 16; no++) {
    const ms = (byTable.get(no) ?? []).sort((a, b) => assignmentOf(a).sequence - assignmentOf(b).sequence)
    const open = ms.filter((m) => m.status !== 'done')
    const current = open[0] ?? null
    out[no] = {
      no,
      status: tableStatus(er, no),
      current,
      next: open[1] ?? null,
      bracket: current?.bracket ?? null,
      allDone: ms.length > 0 && open.length === 0,
    }
  }
  return out
})

function cellClass(c: TableCell): string {
  if (c.status === 'active') {
    if (c.bracket === 'main') return 'border-beer-500 bg-beer-950/30'
    if (c.bracket === 'botr') return 'border-sky-500 bg-sky-950/30'
    return 'border-green-700 bg-green-950/30'
  }
  if (c.status === 'locked') return 'border-red-900 bg-red-950/30 opacity-70'
  if (c.status === 'free') return 'border-sky-800 bg-sky-950/30'
  return 'border-neutral-800 border-dashed bg-neutral-950/40 opacity-40'
}
</script>

<template>
  <div>
    <!-- Kopf: nur Rundenname (keine Umbau-Angaben im Display) -->
    <div class="text-center mb-5">
      <span class="font-display text-4xl tracking-wide text-beer-400">{{ store.currentLayout.name }}</span>
      <div class="text-neutral-400 text-sm mt-0.5">{{ store.currentLayout.plays }}</div>
    </div>

    <!-- Arena-Grundriss (horizontal scrollbar auf kleinen Screens) -->
    <div class="overflow-x-auto pb-2">
    <div class="flex gap-4 md:gap-8 w-max mx-auto px-2">
      <div v-for="zone in ZONES" :key="zone.name" class="flex flex-col">
        <div class="text-center text-xs uppercase tracking-widest text-neutral-500 mb-2">{{ zone.name }}</div>
        <div class="flex flex-col gap-3">
          <div
            v-for="no in zone.tables"
            :key="no"
            class="w-44 md:w-52 rounded-lg border-2 px-3 py-2"
            :class="cellClass(cells[no])"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-neutral-200">Tisch {{ no }}</span>
              <span v-if="cells[no].bracket === 'main'" class="badge bg-beer-500 text-neutral-950">🏆 Championship</span>
              <span v-else-if="cells[no].bracket === 'botr'" class="badge bg-sky-500 text-neutral-950">🍺 Best of Rest</span>
              <span v-else-if="cells[no].status === 'locked'" class="text-[10px] text-red-300">gesperrt</span>
              <span v-else-if="cells[no].status === 'free'" class="text-[10px] text-sky-300">Freies Spiel</span>
              <span v-else-if="cells[no].status === 'off'" class="text-[10px] text-neutral-600">abgebaut</span>
            </div>

            <template v-if="cells[no].status === 'active' && cells[no].current">
              <div class="text-sm leading-tight">
                <div class="truncate font-medium">{{ store.teamName(cells[no].current!.team_a_id) || '—' }}</div>
                <div class="text-neutral-500 text-xs">vs</div>
                <div class="truncate font-medium">{{ store.teamName(cells[no].current!.team_b_id) || '—' }}</div>
                <div v-if="cells[no].next" class="mt-1 text-[10px] text-neutral-500 truncate">
                  danach: {{ store.teamName(cells[no].next!.team_a_id) || '?' }} / {{ store.teamName(cells[no].next!.team_b_id) || '?' }}
                </div>
              </div>
            </template>
            <div v-else-if="cells[no].status === 'active' && cells[no].allDone" class="text-sm text-green-400">✓ fertig</div>
            <div v-else-if="cells[no].status === 'active'" class="text-sm text-neutral-600">frei</div>
            <div v-else-if="cells[no].status === 'free'" class="text-xs text-sky-400/70">für Ausgeschiedene 🍺</div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Legende -->
    <div class="flex items-center justify-center gap-5 mt-6 text-sm text-neutral-400 flex-wrap">
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border-2 border-beer-500 inline-block"></span> Championship</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border-2 border-sky-500 inline-block"></span> Best of the Rest</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border-2 border-sky-800 bg-sky-950/40 inline-block"></span> Freies Spiel</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border-2 border-red-900 bg-red-950/40 inline-block"></span> Gesperrt</span>
    </div>
  </div>
</template>

<style scoped>
.badge {
  @apply text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap;
}
</style>
