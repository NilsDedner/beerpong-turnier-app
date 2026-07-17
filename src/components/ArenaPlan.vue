<script setup lang="ts">
import { computed } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import { assignmentOf, tableStatus, type TableStatus } from '@/lib/tables'
import type { Match } from '@/types'

const store = useTournamentStore()

interface TableCell {
  no: number
  status: TableStatus | 'off'
  current: Match | null
  next: Match | null
  allDone: boolean
}

// Physische Zonen aus dem Aufbauplan.
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
    out[no] = {
      no,
      status: tableStatus(er, no),
      current: open[0] ?? null,
      next: open[1] ?? null,
      allDone: ms.length > 0 && open.length === 0,
    }
  }
  return out
})

function cellClass(c: TableCell): string {
  switch (c.status) {
    case 'active':
      return 'border-green-500 bg-green-950/50'
    case 'locked':
      return 'border-red-800 bg-red-950/40 opacity-70'
    case 'free':
      return 'border-sky-700 bg-sky-950/40'
    default:
      return 'border-neutral-800 border-dashed bg-neutral-950 opacity-40'
  }
}
</script>

<template>
  <div>
    <!-- Kopf: Runde + Modus -->
    <div class="flex items-center justify-center gap-3 mb-4 flex-wrap">
      <span class="font-display text-3xl tracking-wide text-beer-400">{{ store.currentLayout.name }}</span>
      <span class="text-neutral-400">{{ store.currentLayout.plays }}</span>
      <span
        v-if="store.currentLayout.mode"
        class="text-sm px-3 py-1 rounded-full bg-purple-900 text-purple-200"
      >
        {{ store.currentLayout.mode }}
      </span>
    </div>

    <!-- Umbau-Banner -->
    <div
      v-if="store.rebuildPending"
      class="max-w-2xl mx-auto mb-5 flex items-center justify-center gap-3 bg-amber-900/50 border border-amber-700 text-amber-100 rounded-xl px-4 py-3 text-lg"
    >
      🔧 <span><strong>Umbau:</strong> {{ store.currentLayout.rebuildBefore }}</span>
    </div>

    <!-- Arena-Grundriss -->
    <div class="flex justify-center gap-4 md:gap-8">
      <div v-for="zone in ZONES" :key="zone.name" class="flex flex-col">
        <div class="text-center text-xs uppercase tracking-widest text-neutral-500 mb-2">
          {{ zone.name }}
        </div>
        <div class="flex flex-col gap-3">
          <div
            v-for="no in zone.tables"
            :key="no"
            class="w-40 md:w-48 rounded-lg border-2 px-3 py-2 transition"
            :class="cellClass(cells[no])"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-neutral-300">Tisch {{ no }}</span>
              <span v-if="cells[no].status === 'locked'" class="text-[10px] text-red-300">gesperrt</span>
              <span v-else-if="cells[no].status === 'free'" class="text-[10px] text-sky-300">Freies Spiel</span>
              <span v-else-if="cells[no].status === 'off'" class="text-[10px] text-neutral-600">abgebaut</span>
            </div>

            <!-- Aktives Match -->
            <template v-if="cells[no].status === 'active'">
              <div v-if="cells[no].current" class="text-sm leading-tight">
                <div class="truncate font-medium">{{ store.teamName(cells[no].current!.team_a_id) || '—' }}</div>
                <div class="text-neutral-500 text-xs">vs</div>
                <div class="truncate font-medium">{{ store.teamName(cells[no].current!.team_b_id) || '—' }}</div>
                <div v-if="cells[no].next" class="mt-1 text-[10px] text-neutral-500 truncate">
                  danach: {{ store.teamName(cells[no].next!.team_a_id) || '?' }} / {{ store.teamName(cells[no].next!.team_b_id) || '?' }}
                </div>
              </div>
              <div v-else-if="cells[no].allDone" class="text-sm text-green-400">✓ fertig</div>
              <div v-else class="text-sm text-neutral-600">frei</div>
            </template>
            <div v-else-if="cells[no].status === 'free'" class="text-xs text-sky-400/70">
              für Ausgeschiedene 🍺
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legende -->
    <div class="flex items-center justify-center gap-5 mt-6 text-sm text-neutral-400">
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border-2 border-green-500 bg-green-950/50 inline-block"></span> Aktiv</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border-2 border-red-800 bg-red-950/40 inline-block"></span> Gesperrt</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border-2 border-sky-700 bg-sky-950/40 inline-block"></span> Freies Spiel</span>
    </div>
  </div>
</template>
