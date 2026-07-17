import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { backend, type RealtimeEvent } from '@/lib/backend'
import { generateBracket, shuffled, TEAM_COUNT, THIRD_PLACE_ROUND } from '@/lib/bracket'
import { assignmentOf, eventRoundOf, roundLayout, LAST_EVENT_ROUND } from '@/lib/tables'
import type { Bracket, Match, Settings, SlotPos, Team } from '@/types'

const DEMO_ADJECTIVES = [
  'Wilde', 'Durstige', 'Goldene', 'Fliegende', 'Rasende', 'Coole', 'Heisse',
  'Betrunkene', 'Zielsichere', 'Legendäre', 'Krasse', 'Magische', 'Feurige',
  'Eisige', 'Schräge', 'Flinke',
]
const DEMO_NOUNS = [
  'Becher', 'Pong-Piraten', 'Bierbaronen', 'Werfer', 'Adler', 'Trinker',
  'Ninjas', 'Wikinger', 'Cowboys', 'Raketen', 'Gladiatoren', 'Bären',
  'Haie', 'Wölfe', 'Drachen', 'Titanen',
]

export const useTournamentStore = defineStore('tournament', () => {
  const teams = ref<Team[]>([])
  const matches = ref<Match[]>([])
  const settings = ref<Settings>({ id: 1, status: 'setup', third_place: false, title: 'Beer Pong Turnier' })
  const loading = ref(true)
  const error = ref<string | null>(null)
  /** 'supabase' = Cloud/Realtime, 'local' = Offline-Fallback (nur dieses Gerät). */
  const backendKind = backend.kind

  let unsubscribe: (() => void) | null = null

  // ---------- Lookups ----------
  const teamById = computed(() => {
    const m = new Map<string, Team>()
    for (const t of teams.value) m.set(t.id, t)
    return m
  })

  function teamName(id: string | null): string {
    if (!id) return ''
    return teamById.value.get(id)?.name ?? '???'
  }

  function findMatch(bracket: Bracket, round: number, slot: number): Match | undefined {
    return matches.value.find((m) => m.bracket === bracket && m.round === round && m.slot === slot)
  }

  const started = computed(() => settings.value.status !== 'setup')

  /** Spielbare Matches (beide Teams stehen, noch nicht entschieden). */
  const playableMatches = computed(() =>
    matches.value
      .filter((m) => m.status === 'ready')
      .sort((a, b) => a.bracket.localeCompare(b.bracket) || a.round - b.round || a.slot - b.slot),
  )

  /** Zuletzt entschiedene Matches (neueste zuerst) — fuer den Ticker. */
  const recentResults = computed(() =>
    matches.value
      .filter((m) => m.status === 'done')
      .slice()
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
  )

  function bracketMatches(bracket: Bracket) {
    return matches.value
      .filter((m) => m.bracket === bracket)
      .sort((a, b) => a.round - b.round || a.slot - b.slot)
  }

  // ---------- Tische & Event-Runden ----------
  function tableNoOf(m: Match): number {
    return assignmentOf(m).tableNo
  }

  /**
   * Ein Match ist "blockiert", wenn in derselben Event-Runde ein Spiel mit
   * niedrigerer Reihenfolge (Welle) noch nicht entschieden ist. So werden in
   * Runde 4 erst beide Championship-Halbfinals gespielt, dann beide BotR-
   * Halbfinals; in Runde 5 erst das BotR-Finale, dann das große Finale.
   */
  function isMatchBlocked(m: Match): boolean {
    const a = assignmentOf(m)
    return matches.value.some((o) => {
      if (o.id === m.id || o.status === 'done') return false
      const b = assignmentOf(o)
      return b.eventRound === a.eventRound && b.sequence < a.sequence
    })
  }

  /** Aktuelle Event-Runde = kleinste Runde mit noch offenen Matches. */
  const currentEventRound = computed(() => {
    const open = matches.value.filter((m) => m.status !== 'done')
    if (!open.length) return matches.value.length ? LAST_EVENT_ROUND : 1
    return Math.min(...open.map((m) => eventRoundOf(m.bracket, m.round)))
  })

  const currentLayout = computed(() => roundLayout(currentEventRound.value))

  /** Steht der Umbau vor der aktuellen Runde noch aus? (noch kein Spiel der Runde entschieden) */
  const rebuildPending = computed(() => {
    const l = currentLayout.value
    if (!l.rebuildBefore) return false
    const anyDone = matches.value.some(
      (m) => m.status === 'done' && eventRoundOf(m.bracket, m.round) === l.eventRound,
    )
    return !anyDone
  })

  /** Matches einer Event-Runde, sortiert nach Tisch dann Reihenfolge. */
  function matchesForEventRound(er: number): Match[] {
    return matches.value
      .filter((m) => eventRoundOf(m.bracket, m.round) === er)
      .sort((a, b) => {
        const aa = assignmentOf(a)
        const bb = assignmentOf(b)
        return aa.tableNo - bb.tableNo || aa.sequence - bb.sequence
      })
  }

  // ---------- Laden + Realtime ----------
  async function init() {
    loading.value = true
    error.value = null
    try {
      const data = await backend.fetchAll()
      teams.value = data.teams
      matches.value = data.matches
      settings.value = data.settings
      subscribe()
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  function upsertLocal<T extends { id: string | number }>(arr: T[], row: T) {
    const i = arr.findIndex((x) => x.id === row.id)
    if (i === -1) arr.push(row)
    else arr[i] = row
  }

  function onRealtime(e: RealtimeEvent) {
    if (e.table === 'teams') {
      if (e.eventType === 'DELETE') teams.value = teams.value.filter((t) => t.id !== e.old?.id)
      else upsertLocal(teams.value, e.new as Team)
    } else if (e.table === 'matches') {
      if (e.eventType === 'DELETE') matches.value = matches.value.filter((m) => m.id !== e.old?.id)
      else upsertLocal(matches.value, e.new as Match)
    } else if (e.table === 'settings') {
      if (e.eventType !== 'DELETE') settings.value = e.new as Settings
    }
  }

  function subscribe() {
    if (unsubscribe) return
    unsubscribe = backend.subscribe(onRealtime)
  }

  function dispose() {
    unsubscribe?.()
    unsubscribe = null
  }

  // ---------- Team-Verwaltung ----------
  async function createTeam(name: string, player1 = '', player2 = '') {
    const seed = teams.value.length + 1
    const team = await backend.insertTeam({ name, player1, player2, seed })
    upsertLocal(teams.value, team)
  }

  async function updateTeam(id: string, patch: Partial<Team>) {
    await backend.updateTeam(id, patch)
    const t = teams.value.find((x) => x.id === id)
    if (t) upsertLocal(teams.value, { ...t, ...patch })
  }

  async function deleteTeam(id: string) {
    await backend.deleteTeam(id)
    teams.value = teams.value.filter((t) => t.id !== id)
  }

  async function generateDemoTeams() {
    const missing = TEAM_COUNT - teams.value.length
    if (missing <= 0) return
    const rows = Array.from({ length: missing }, (_, i) => {
      const idx = teams.value.length + i
      const adj = DEMO_ADJECTIVES[idx % DEMO_ADJECTIVES.length]
      const noun = DEMO_NOUNS[(idx * 7 + 3) % DEMO_NOUNS.length]
      return {
        name: `${adj} ${noun}`,
        player1: `Spieler ${idx * 2 + 1}`,
        player2: `Spieler ${idx * 2 + 2}`,
        seed: idx + 1,
      }
    })
    const created = await backend.insertTeams(rows)
    for (const t of created) upsertLocal(teams.value, t)
  }

  // ---------- Turnier starten ----------
  async function drawAndStart() {
    if (teams.value.length !== TEAM_COUNT) {
      throw new Error(`Es müssen genau ${TEAM_COUNT} Teams angelegt sein (aktuell ${teams.value.length}).`)
    }
    await backend.deleteAllMatches()
    const order = shuffled(teams.value)
    const rows = generateBracket(order, settings.value.third_place)
    matches.value = await backend.insertMatches(rows)
    settings.value = await backend.updateSettings({ status: 'running' })
  }

  async function setThirdPlace(value: boolean) {
    settings.value = await backend.updateSettings({ third_place: value })
  }

  async function resetTournament() {
    await backend.deleteAllMatches()
    matches.value = []
    settings.value = await backend.updateSettings({ status: 'setup' })
  }

  // ---------- Ergebnis eintragen ----------
  async function updateMatch(id: string, patch: Partial<Match>) {
    const updated = await backend.updateMatch(id, patch)
    upsertLocal(matches.value, updated)
  }

  async function placeTeam(bracket: Bracket, round: number, slot: number, pos: SlotPos, teamId: string) {
    const target = findMatch(bracket, round, slot)
    if (!target) return
    const patch: Partial<Match> = pos === 'a' ? { team_a_id: teamId } : { team_b_id: teamId }
    const other = pos === 'a' ? target.team_b_id : target.team_a_id
    // Beide Slots gefuellt -> spielbar. Falls das Spiel schon entschieden war,
    // Status nicht anfassen.
    if (other && target.status !== 'done') patch.status = 'ready'
    await updateMatch(target.id, patch)
  }

  /** Entfernt ein platziertes Team wieder aus einem Zielmatch (fuer Undo). */
  async function clearTeamFromTarget(bracket: Bracket, round: number, slot: number, pos: SlotPos) {
    const target = findMatch(bracket, round, slot)
    if (!target) return
    const patch: Partial<Match> =
      pos === 'a' ? { team_a_id: null } : { team_b_id: null }
    // Zielmatch verliert ein Team -> nicht mehr spielbar, evtl. Sieger loeschen.
    patch.status = 'pending'
    patch.winner_id = null
    await updateMatch(target.id, patch)
  }

  /**
   * Macht ein entschiedenes Match rueckgaengig: Sieger/Verlierer werden aus den
   * Folgematches entfernt, das Match wird wieder spielbar. Nur moeglich, solange
   * kein Folgespiel bereits entschieden ist.
   */
  async function undoMatch(match: Match) {
    if (match.status !== 'done') return
    if (isDownstreamLocked(match)) {
      throw new Error('Zuerst das Folgespiel korrigieren — es ist schon entschieden.')
    }
    if (match.winner_to_round != null) {
      await clearTeamFromTarget(match.winner_to_bracket!, match.winner_to_round, match.winner_to_slot!, match.winner_to_pos!)
    }
    if (match.loser_to_round != null) {
      await clearTeamFromTarget(match.loser_to_bracket!, match.loser_to_round, match.loser_to_slot!, match.loser_to_pos!)
    }
    await updateMatch(match.id, { winner_id: null, status: 'ready' })
  }

  /** Prueft, ob ein Folgematch bereits entschieden ist (dann keine Korrektur mehr). */
  function isDownstreamLocked(match: Match): boolean {
    const targets: Match[] = []
    if (match.winner_to_round != null) {
      const t = findMatch(match.winner_to_bracket!, match.winner_to_round, match.winner_to_slot!)
      if (t) targets.push(t)
    }
    if (match.loser_to_round != null) {
      const t = findMatch(match.loser_to_bracket!, match.loser_to_round, match.loser_to_slot!)
      if (t) targets.push(t)
    }
    return targets.some((t) => t.status === 'done')
  }

  async function setWinner(match: Match, winnerTeamId: string) {
    if (!match.team_a_id || !match.team_b_id) return
    if (match.winner_id === winnerTeamId) return
    if (match.status !== 'done' && isMatchBlocked(match)) {
      throw new Error('Erst die vorherigen Spiele dieser Runde abschließen.')
    }
    if (match.status === 'done' && isDownstreamLocked(match)) {
      throw new Error('Ergebnis kann nicht mehr geändert werden — ein Folgespiel ist bereits entschieden.')
    }
    const loserTeamId = match.team_a_id === winnerTeamId ? match.team_b_id : match.team_a_id

    await updateMatch(match.id, { winner_id: winnerTeamId, status: 'done' })

    if (match.winner_to_round != null) {
      await placeTeam(match.winner_to_bracket!, match.winner_to_round, match.winner_to_slot!, match.winner_to_pos!, winnerTeamId)
    }
    if (match.loser_to_round != null && loserTeamId) {
      await placeTeam(match.loser_to_bracket!, match.loser_to_round, match.loser_to_slot!, match.loser_to_pos!, loserTeamId)
    }
  }

  // ---------- Sieger-Ermittlung fuers Display ----------
  const champion = computed(() => {
    const fin = findMatch('main', 5, 0)
    return fin?.winner_id ? teamById.value.get(fin.winner_id) ?? null : null
  })
  const botrChampion = computed(() => {
    const fin = findMatch('botr', 4, 0)
    return fin?.winner_id ? teamById.value.get(fin.winner_id) ?? null : null
  })

  return {
    // state
    teams, matches, settings, loading, error, backendKind,
    // getters
    teamById, teamName, started, playableMatches, recentResults, champion, botrChampion,
    bracketMatches, findMatch,
    // tables & event rounds
    tableNoOf, isMatchBlocked, isDownstreamLocked, currentEventRound, currentLayout,
    rebuildPending, matchesForEventRound,
    // constants
    TEAM_COUNT, THIRD_PLACE_ROUND,
    // actions
    init, dispose, createTeam, updateTeam, deleteTeam, generateDemoTeams,
    drawAndStart, resetTournament, setThirdPlace, setWinner, undoMatch,
  }
})
