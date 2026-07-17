<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useTournamentStore } from '@/stores/tournament'
import TeamManager from '@/components/TeamManager.vue'
import MatchQueue from '@/components/MatchQueue.vue'
import NavMenu from '@/components/NavMenu.vue'

const store = useTournamentStore()

const PASSCODE = (import.meta.env.VITE_ADMIN_PASSCODE as string) || 'beerpong'
const UNLOCK_KEY = 'bp_admin_unlocked'

const unlocked = ref(sessionStorage.getItem(UNLOCK_KEY) === '1')
const codeInput = ref('')
const codeError = ref(false)

function unlock() {
  if (codeInput.value === PASSCODE) {
    unlocked.value = true
    sessionStorage.setItem(UNLOCK_KEY, '1')
    codeError.value = false
  } else {
    codeError.value = true
  }
}

type Tab = 'teams' | 'matches' | 'settings'
const tab = ref<Tab>('teams')

const resetBusy = ref(false)
async function doReset() {
  if (!confirm('Turnier wirklich zurücksetzen? Alle Matches und Ergebnisse werden gelöscht (Teams bleiben erhalten).')) return
  resetBusy.value = true
  try {
    await store.resetTournament()
    tab.value = 'teams'
  } finally {
    resetBusy.value = false
  }
}
</script>

<template>
  <!-- Passcode-Gate -->
  <div v-if="!unlocked" class="min-h-screen flex items-center justify-center px-6">
    <form
      class="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-4 text-center"
      @submit.prevent="unlock"
    >
      <div class="text-4xl">🔒</div>
      <h1 class="font-display text-3xl tracking-wide text-beer-300">Admin-Bereich</h1>
      <p class="text-sm text-neutral-400">Bitte Passcode eingeben.</p>
      <input
        v-model="codeInput"
        type="password"
        class="input text-center"
        placeholder="Passcode"
        autofocus
      />
      <p v-if="codeError" class="text-red-400 text-sm">Falscher Passcode.</p>
      <button type="submit" class="btn-primary w-full">Entsperren</button>
      <RouterLink to="/display" class="block text-xs text-neutral-500 hover:text-neutral-300">← Zum Display</RouterLink>
    </form>
  </div>

  <!-- Admin-Oberflaeche -->
  <div v-else class="max-w-6xl mx-auto px-4 py-6">
    <header class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div class="flex items-center gap-3">
        <NavMenu />
        <h1 class="font-display text-3xl tracking-wide text-beer-400">Admin</h1>
        <span
          class="text-xs px-2 py-1 rounded-full"
          :class="store.started ? 'bg-green-900 text-green-200' : 'bg-neutral-800 text-neutral-300'"
        >
          {{ store.settings.status === 'running' ? 'läuft' : store.settings.status === 'done' ? 'beendet' : 'Setup' }}
        </span>
      </div>
      <RouterLink to="/display" target="_blank" class="btn-secondary text-sm">
        📺 Display öffnen
      </RouterLink>
    </header>

    <div v-if="store.loading" class="text-neutral-400">Lade Daten …</div>
    <div v-else-if="store.error" class="text-red-400">Fehler: {{ store.error }}</div>

    <template v-else>
      <!-- Tabs -->
      <nav class="flex gap-1 mb-6 border-b border-neutral-800">
        <button
          v-for="t in (['teams', 'matches', 'settings'] as Tab[])"
          :key="t"
          class="px-4 py-2 -mb-px border-b-2 font-medium transition"
          :class="tab === t ? 'border-beer-500 text-beer-300' : 'border-transparent text-neutral-400 hover:text-neutral-200'"
          @click="tab = t"
        >
          {{ t === 'teams' ? 'Teams' : t === 'matches' ? 'Ergebnisse' : 'Einstellungen' }}
        </button>
      </nav>

      <TeamManager v-if="tab === 'teams'" />
      <MatchQueue v-else-if="tab === 'matches'" />

      <section v-else class="space-y-6 max-w-xl">
        <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              class="w-5 h-5 accent-beer-500"
              :checked="store.settings.third_place"
              :disabled="store.started"
              @change="store.setThirdPlace(($event.target as HTMLInputElement).checked)"
            />
            <span>
              <span class="font-medium">Spiel um Platz 3</span>
              <span class="block text-sm text-neutral-400">
                In beiden Turnierbäumen (nur vor dem Start änderbar).
              </span>
            </span>
          </label>
        </div>

        <div class="bg-red-950/40 border border-red-900 rounded-xl p-5">
          <h3 class="font-medium text-red-200 mb-1">Turnier zurücksetzen</h3>
          <p class="text-sm text-neutral-400 mb-3">
            Löscht alle Matches und Ergebnisse. Die Teams bleiben erhalten, sodass
            du neu auslosen kannst.
          </p>
          <button class="btn-danger" :disabled="resetBusy || !store.started" @click="doReset">
            Turnier zurücksetzen
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
