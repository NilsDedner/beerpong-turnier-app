<script setup lang="ts">
import { computed } from 'vue'
import { useTournamentStore } from '@/stores/tournament'

const props = withDefaults(defineProps<{ limit?: number }>(), { limit: 12 })
const store = useTournamentStore()

const results = computed(() => store.recentResults.slice(0, props.limit))

function loserId(match: { team_a_id: string | null; team_b_id: string | null; winner_id: string | null }) {
  return match.winner_id === match.team_a_id ? match.team_b_id : match.team_a_id
}
</script>

<template>
  <div v-if="results.length" class="w-full overflow-hidden">
    <div class="flex gap-3 w-max animate-marquee">
      <!-- doppelt fuer nahtlose Endlosschleife -->
      <template v-for="pass in 2" :key="pass">
        <div
          v-for="m in results"
          :key="`${pass}-${m.id}`"
          class="flex items-center gap-2 whitespace-nowrap rounded-full bg-neutral-900 border border-neutral-800 px-4 py-2"
        >
          <span
            class="text-[10px] px-1.5 py-0.5 rounded"
            :class="m.bracket === 'main' ? 'bg-beer-900 text-beer-200' : 'bg-sky-900 text-sky-200'"
          >
            {{ m.label }}
          </span>
          <span class="font-semibold text-green-300">{{ store.teamName(m.winner_id) }}</span>
          <span class="text-neutral-500">schlägt</span>
          <span class="text-neutral-400">{{ store.teamName(loserId(m)) }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
