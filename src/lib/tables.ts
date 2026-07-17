import { THIRD_PLACE_ROUND } from '@/lib/bracket'
import type { Bracket, Match } from '@/types'

/**
 * Physischer Tisch-/Arena-Aufbauplan (aus "Tisch Aufbau.drawio").
 *
 * 16 Tische, deren Nutzung sich pro Event-Runde ändert. Championship-Runde N
 * und Best-of-the-Rest-Runde N−1 laufen in derselben Event-Runde (BotR startet
 * eine Runde versetzt, weil es die Erstrunden-Verlierer aufnimmt).
 *
 *  Event-Runde 1 : Championship R1 (16)                        → Tische 1–16
 *  Event-Runde 2 : Achtelfinale (8) + BotR R1 (8)              → Tische 1–16
 *  Event-Runde 3 : Viertelfinale (4) + BotR VF (4)            → Tische 5–12
 *    ── Umbau in Zweitischmodus ──
 *  Event-Runde 4 : Halbfinale (2) + BotR HF (2), nacheinander → Tische 1–2
 *    ── Umbau auf einen Tisch ──
 *  Event-Runde 5 : erst BotR-Finale, dann großes Finale       → Tisch 1
 */

export const TABLE_COUNT = 16
export const LAST_EVENT_ROUND = 5

const range = (a: number, b: number): number[] =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i)

/** Event-Runde eines Bracket-Matches. */
export function eventRoundOf(bracket: Bracket, round: number): number {
  if (round === THIRD_PLACE_ROUND) return LAST_EVENT_ROUND
  // Championship: Runde N -> Event-Runde N. BotR: Runde N -> Event-Runde N+1.
  return bracket === 'main' ? round : round + 1
}

export interface TableAssignment {
  eventRound: number
  tableNo: number
  /** Reihenfolge auf demselben Tisch (0 = zuerst). Nur in Runde 4/5 relevant. */
  sequence: number
}

/** Ordnet einem Match Event-Runde, Tischnummer und Reihenfolge zu. */
export function assignmentOf(m: Match): TableAssignment {
  const er = eventRoundOf(m.bracket, m.round)
  const main = m.bracket === 'main'

  if (er === 1) return { eventRound: 1, tableNo: m.slot + 1, sequence: 0 }

  if (er === 2) {
    // Achtelfinale (main R2) -> 1–8, BotR R1 -> 9–16
    return { eventRound: 2, tableNo: main ? m.slot + 1 : m.slot + 9, sequence: 0 }
  }

  if (er === 3) {
    // Viertelfinale (main R3) -> 5–8, BotR VF -> 9–12
    return { eventRound: 3, tableNo: main ? 5 + m.slot : 9 + m.slot, sequence: 0 }
  }

  if (er === 4) {
    // Zweitischmodus: Championship-Halbfinals auf Tisch 1 (nacheinander),
    // BotR-Halbfinals auf Tisch 2 (nacheinander).
    return { eventRound: 4, tableNo: main ? 1 : 2, sequence: m.slot }
  }

  // Event-Runde 5, ein Tisch: erst BotR-Finale, dann großes Finale.
  if (m.round === THIRD_PLACE_ROUND) {
    return { eventRound: 5, tableNo: 1, sequence: main ? 3 : 2 }
  }
  return { eventRound: 5, tableNo: 1, sequence: main ? 1 : 0 }
}

export type TableStatus = 'active' | 'locked' | 'free'

export interface RoundLayout {
  eventRound: number
  name: string
  /** Was in dieser Event-Runde gespielt wird. */
  plays: string
  /** Umbau-Modus, falls die Arena umgebaut ist. */
  mode: string | null
  /** Hinweis auf den Umbau, der VOR dieser Runde nötig ist. */
  rebuildBefore: string | null
  active: number[]
  locked: number[]
  free: number[]
}

const LAYOUTS: Record<number, RoundLayout> = {
  1: {
    eventRound: 1, name: 'Runde 1', plays: 'Championship – Runde 1',
    mode: null, rebuildBefore: null,
    active: range(1, 16), locked: [], free: [],
  },
  2: {
    eventRound: 2, name: 'Runde 2', plays: 'Achtelfinale + Best of the Rest R1',
    mode: null, rebuildBefore: null,
    active: range(1, 16), locked: [], free: [],
  },
  3: {
    eventRound: 3, name: 'Runde 3', plays: 'Viertelfinale + BotR Viertelfinale',
    mode: null, rebuildBefore: null,
    active: range(5, 12), locked: range(1, 4), free: range(13, 16),
  },
  4: {
    eventRound: 4, name: 'Runde 4 · Halbfinale', plays: 'Halbfinale + BotR Halbfinale',
    mode: 'Zweitischmodus', rebuildBefore: 'Arena in den Zweitischmodus umbauen',
    active: [1, 2], locked: [], free: range(5, 8),
  },
  5: {
    eventRound: 5, name: 'Runde 5 · Finale', plays: 'BotR-Finale, dann großes Finale',
    mode: 'Ein-Tisch-Modus', rebuildBefore: 'Arena auf einen Tisch umbauen',
    active: [1], locked: [], free: [],
  },
}

export function roundLayout(eventRound: number): RoundLayout {
  return LAYOUTS[eventRound] ?? LAYOUTS[1]
}

/** Status eines Tisches in einer Event-Runde (grün/rot/blau, sonst abgebaut). */
export function tableStatus(eventRound: number, tableNo: number): TableStatus | 'off' {
  const l = roundLayout(eventRound)
  if (l.active.includes(tableNo)) return 'active'
  if (l.locked.includes(tableNo)) return 'locked'
  if (l.free.includes(tableNo)) return 'free'
  return 'off'
}
