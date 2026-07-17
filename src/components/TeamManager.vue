<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTournamentStore } from '@/stores/tournament'

const store = useTournamentStore()

const name = ref('')
const player1 = ref('')
const player2 = ref('')
const busy = ref(false)
const msg = ref<string | null>(null)

const count = computed(() => store.teams.length)
const remaining = computed(() => store.TEAM_COUNT - count.value)
const canStart = computed(() => count.value === store.TEAM_COUNT && !store.started)

async function add() {
  if (!name.value.trim()) return
  busy.value = true
  msg.value = null
  try {
    await store.createTeam(name.value.trim(), player1.value.trim(), player2.value.trim())
    name.value = ''
    player1.value = ''
    player2.value = ''
  } catch (e: any) {
    msg.value = e?.message ?? String(e)
  } finally {
    busy.value = false
  }
}

async function fillDemo() {
  busy.value = true
  msg.value = null
  try {
    await store.generateDemoTeams()
  } catch (e: any) {
    msg.value = e?.message ?? String(e)
  } finally {
    busy.value = false
  }
}

async function start() {
  if (!confirm('Turnier jetzt starten? Die Auslosung wird festgelegt.')) return
  busy.value = true
  msg.value = null
  try {
    await store.drawAndStart()
  } catch (e: any) {
    msg.value = e?.message ?? String(e)
  } finally {
    busy.value = false
  }
}

async function remove(id: string) {
  if (store.started) return
  await store.deleteTeam(id)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Kopf: Zaehler + Aktionen -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <span class="font-display text-3xl tracking-wide text-beer-300">Teams</span>
        <span
          class="ml-3 text-sm px-2.5 py-1 rounded-full"
          :class="count === store.TEAM_COUNT ? 'bg-green-900 text-green-200' : 'bg-neutral-800 text-neutral-300'"
        >
          {{ count }} / {{ store.TEAM_COUNT }}
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-if="!store.started"
          :disabled="busy || remaining <= 0"
          class="btn-secondary"
          @click="fillDemo"
        >
          🎲 Demo-Teams auffüllen
        </button>
        <button
          v-if="!store.started"
          :disabled="busy || !canStart"
          class="btn-primary"
          :title="canStart ? '' : `Noch ${remaining} Team(s) anlegen`"
          @click="start"
        >
          🚀 Auslosen &amp; Turnier starten
        </button>
      </div>
    </div>

    <p v-if="msg" class="text-red-400 text-sm">{{ msg }}</p>

    <p v-if="store.started" class="text-sm text-amber-300 bg-amber-900/30 rounded-lg px-3 py-2">
      Das Turnier läuft bereits — Teams können nicht mehr geändert werden.
      (Neustart über „Einstellungen“.)
    </p>

    <!-- Team anlegen -->
    <form
      v-if="!store.started"
      class="grid sm:grid-cols-[2fr_1.5fr_1.5fr_auto] gap-2 items-end bg-neutral-900 border border-neutral-800 rounded-xl p-4"
      @submit.prevent="add"
    >
      <label class="text-sm">
        <span class="block text-neutral-400 mb-1">Teamname *</span>
        <input v-model="name" class="input" placeholder="z.B. Bierbaronen" required />
      </label>
      <label class="text-sm">
        <span class="block text-neutral-400 mb-1">Spieler 1</span>
        <input v-model="player1" class="input" placeholder="optional" />
      </label>
      <label class="text-sm">
        <span class="block text-neutral-400 mb-1">Spieler 2</span>
        <input v-model="player2" class="input" placeholder="optional" />
      </label>
      <button type="submit" :disabled="busy || !name.trim()" class="btn-primary h-[42px]">
        + Hinzufügen
      </button>
    </form>

    <!-- Team-Liste -->
    <ul class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
      <li
        v-for="(t, i) in store.teams"
        :key="t.id"
        class="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2"
      >
        <span class="text-neutral-500 text-sm w-6 tabular-nums">{{ i + 1 }}.</span>
        <div class="min-w-0 flex-1">
          <div class="font-medium truncate">{{ t.name }}</div>
          <div v-if="t.player1 || t.player2" class="text-xs text-neutral-400 truncate">
            {{ [t.player1, t.player2].filter(Boolean).join(' & ') }}
          </div>
        </div>
        <button
          v-if="!store.started"
          class="text-neutral-500 hover:text-red-400 text-lg leading-none"
          title="Entfernen"
          @click="remove(t.id)"
        >
          ×
        </button>
      </li>
    </ul>
  </div>
</template>
