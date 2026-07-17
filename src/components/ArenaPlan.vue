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

// Kleine Becher-Pyramide (3-2-1)
const CUP_ROWS = [3, 2, 1]
</script>

<template>
  <div>
    <!-- Kopf: nur Rundenname (keine Umbau-Angaben im Display) -->
    <div class="text-center mb-5">
      <span class="font-display text-4xl tracking-wide text-beer-400">{{ store.currentLayout.name }}</span>
      <div class="text-neutral-400 text-sm mt-0.5">{{ store.currentLayout.plays }}</div>
    </div>

    <!-- Arena-Grundriss -->
    <div class="flex justify-center gap-4 md:gap-8">
      <div v-for="zone in ZONES" :key="zone.name" class="flex flex-col">
        <div class="text-center text-xs uppercase tracking-widest text-neutral-500 mb-2">{{ zone.name }}</div>
        <div class="flex flex-col gap-3">
          <div
            v-for="no in zone.tables"
            :key="no"
            class="table-cell"
            :class="[
              cells[no].status,
              cells[no].bracket === 'main' ? 'br-main' : '',
              cells[no].bracket === 'botr' ? 'br-botr' : '',
            ]"
          >
            <!-- Kopfzeile: Tisch + Bracket-Markierung -->
            <div class="flex items-center justify-between px-2.5 pt-2">
              <span class="text-xs font-bold text-neutral-200">Tisch {{ no }}</span>
              <span v-if="cells[no].bracket === 'main'" class="badge badge-main">🏆 Championship</span>
              <span v-else-if="cells[no].bracket === 'botr'" class="badge badge-botr">🍺 Best of Rest</span>
              <span v-else-if="cells[no].status === 'locked'" class="text-[10px] text-red-300">gesperrt</span>
              <span v-else-if="cells[no].status === 'free'" class="text-[10px] text-sky-300">Freies Spiel</span>
              <span v-else-if="cells[no].status === 'off'" class="text-[10px] text-neutral-600">abgebaut</span>
            </div>

            <!-- Aktiver Tisch: Beer-Pong-Tisch mit Bechern -->
            <template v-if="cells[no].status === 'active' && cells[no].current">
              <div class="felt mx-2 my-2">
                <div class="cups">
                  <div v-for="(n, ri) in CUP_ROWS" :key="'a' + ri" class="cup-row">
                    <i v-for="c in n" :key="c" class="cup" />
                  </div>
                </div>
                <div class="team-name">{{ store.teamName(cells[no].current!.team_a_id) || '—' }}</div>
                <div class="vs">VS</div>
                <div class="team-name">{{ store.teamName(cells[no].current!.team_b_id) || '—' }}</div>
                <div class="cups">
                  <div v-for="(n, ri) in [...CUP_ROWS].reverse()" :key="'b' + ri" class="cup-row">
                    <i v-for="c in n" :key="c" class="cup" />
                  </div>
                </div>
              </div>
              <div v-if="cells[no].next" class="px-2.5 pb-2 text-[10px] text-neutral-500 truncate">
                danach: {{ store.teamName(cells[no].next!.team_a_id) || '?' }} / {{ store.teamName(cells[no].next!.team_b_id) || '?' }}
              </div>
            </template>

            <div v-else-if="cells[no].status === 'active' && cells[no].allDone" class="px-2.5 py-4 text-center text-green-400 font-medium">
              ✓ fertig
            </div>
            <div v-else-if="cells[no].status === 'active'" class="px-2.5 py-4 text-center text-neutral-600">frei</div>
            <div v-else-if="cells[no].status === 'free'" class="px-2.5 py-4 text-center text-sky-400/70 text-sm">
              🍺 für Ausgeschiedene
            </div>
            <div v-else class="px-2.5 py-4"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legende -->
    <div class="flex items-center justify-center gap-5 mt-6 text-sm text-neutral-400 flex-wrap">
      <span class="flex items-center gap-1.5"><span class="lg lg-main"></span> Championship</span>
      <span class="flex items-center gap-1.5"><span class="lg lg-botr"></span> Best of the Rest</span>
      <span class="flex items-center gap-1.5"><span class="lg lg-free"></span> Freies Spiel</span>
      <span class="flex items-center gap-1.5"><span class="lg lg-locked"></span> Gesperrt</span>
    </div>
  </div>
</template>

<style scoped>
.table-cell {
  @apply w-44 md:w-52 rounded-xl border-2 border-neutral-800 bg-neutral-950 transition;
}
.table-cell.locked {
  @apply border-red-900 bg-red-950/30 opacity-70;
}
.table-cell.free {
  @apply border-sky-800 bg-sky-950/30;
}
.table-cell.off {
  @apply border-dashed border-neutral-800 bg-neutral-950/40 opacity-40;
}
.table-cell.br-main {
  border-color: #f59e0b;
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3), 0 8px 24px -12px rgba(245, 158, 11, 0.4);
}
.table-cell.br-botr {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.3), 0 8px 24px -12px rgba(14, 165, 233, 0.4);
}

.badge {
  @apply text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap;
}
.badge-main {
  @apply bg-beer-500 text-neutral-950;
}
.badge-botr {
  @apply bg-sky-500 text-neutral-950;
}

/* Beer-Pong-Tischfläche */
.felt {
  border-radius: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  background:
    radial-gradient(ellipse at center, rgba(21, 128, 61, 0.35), rgba(6, 40, 20, 0.6)),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0 2px, transparent 2px 10px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.team-name {
  @apply text-sm font-semibold text-neutral-50 truncate leading-tight;
}
.vs {
  @apply text-[10px] text-neutral-400 my-0.5;
}
.cups {
  @apply flex flex-col items-center gap-0.5 my-1;
}
.cup-row {
  @apply flex gap-1 justify-center;
}
.cup {
  width: 9px;
  height: 9px;
  border-radius: 9999px;
  background: radial-gradient(circle at 30% 30%, #fca5a5, #dc2626 60%, #991b1b);
  box-shadow: inset 0 -1px 1px rgba(0, 0, 0, 0.4);
}

.lg {
  @apply w-3 h-3 rounded inline-block border-2;
}
.lg-main { border-color: #f59e0b; }
.lg-botr { border-color: #0ea5e9; }
.lg-free { @apply border-sky-800 bg-sky-950/40; }
.lg-locked { @apply border-red-900 bg-red-950/40; }
</style>
