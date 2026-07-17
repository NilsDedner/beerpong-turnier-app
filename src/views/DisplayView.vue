<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useTournamentStore } from '@/stores/tournament'
import BracketView from '@/components/BracketView.vue'
import ArenaPlan from '@/components/ArenaPlan.vue'
import RecentResults from '@/components/RecentResults.vue'
import NavMenu from '@/components/NavMenu.vue'

const store = useTournamentStore()

type ViewKey = 'arena' | 'main' | 'botr'
const ROTATION: ViewKey[] = ['arena', 'main', 'botr']

const active = ref<ViewKey>('arena')
const autoRotate = ref(true)
let timer: number | undefined

function tick() {
  if (!autoRotate.value) return
  const i = ROTATION.indexOf(active.value)
  active.value = ROTATION[(i + 1) % ROTATION.length]
}

onMounted(() => {
  timer = window.setInterval(tick, 15000)
})
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})

function select(v: ViewKey) {
  active.value = v
  autoRotate.value = false
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Kopf -->
    <header class="flex items-center justify-between gap-3 flex-wrap px-6 py-4 border-b border-neutral-900">
      <div class="flex items-center gap-3">
        <NavMenu />
        <span class="text-3xl">🍺</span>
        <h1 class="font-display text-4xl md:text-5xl tracking-wide text-beer-400">
          {{ store.settings.title }}
        </h1>
      </div>

      <!-- Champions -->
      <div class="flex items-center gap-6 text-right">
        <div v-if="store.champion">
          <div class="text-xs uppercase tracking-widest text-neutral-500">🏆 Champion</div>
          <div class="font-display text-2xl text-green-300">{{ store.champion.name }}</div>
        </div>
        <div v-if="store.botrChampion">
          <div class="text-xs uppercase tracking-widest text-neutral-500">🍺 Best of the Rest</div>
          <div class="font-display text-2xl text-sky-300">{{ store.botrChampion.name }}</div>
        </div>
      </div>
    </header>

    <!-- Ansicht-Umschalter -->
    <div class="flex items-center justify-center gap-2 py-4 flex-wrap">
      <button
        class="px-5 py-2 rounded-full font-display text-xl tracking-wide transition"
        :class="active === 'arena' ? 'bg-purple-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'"
        @click="select('arena')"
      >
        🏓 Tische
      </button>
      <button
        class="px-5 py-2 rounded-full font-display text-xl tracking-wide transition"
        :class="active === 'main' ? 'bg-beer-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'"
        @click="select('main')"
      >
        Championship
      </button>
      <button
        class="px-5 py-2 rounded-full font-display text-xl tracking-wide transition"
        :class="active === 'botr' ? 'bg-sky-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'"
        @click="select('botr')"
      >
        Best of the Rest
      </button>
      <label class="ml-4 flex items-center gap-2 text-sm text-neutral-500 cursor-pointer">
        <input v-model="autoRotate" type="checkbox" class="accent-beer-500" />
        Auto-Wechsel
      </label>
    </div>

    <!-- Inhalt -->
    <main class="flex-1 px-6">
      <div v-if="!store.started" class="h-full flex items-center justify-center text-center">
        <div>
          <div class="text-6xl mb-4">🏓</div>
          <p class="font-display text-4xl tracking-wide text-neutral-400">
            Das Turnier startet gleich …
          </p>
        </div>
      </div>
      <ArenaPlan v-else-if="active === 'arena'" />
      <BracketView v-else :bracket="active" />
    </main>

    <!-- Ticker -->
    <footer class="border-t border-neutral-900 py-4 px-6">
      <div class="text-xs uppercase tracking-widest text-neutral-600 mb-2">Letzte Ergebnisse</div>
      <RecentResults :limit="15" />
      <p v-if="store.started && store.recentResults.length === 0" class="text-neutral-600 text-sm">
        Noch keine Ergebnisse.
      </p>
    </footer>
  </div>
</template>
