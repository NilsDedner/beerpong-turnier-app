import type { Bracket, MatchInsert, SlotPos, Team } from '@/types'

/** Sonder-Rundennummer fuer das Spiel um Platz 3. */
export const THIRD_PLACE_ROUND = 90

export const TEAM_COUNT = 32

interface RoundDef {
  round: number
  matches: number
  label: string
}

/** Championship-Baum: 32 -> 16 -> 8 -> 4 -> 2 -> Sieger */
const MAIN_ROUNDS: RoundDef[] = [
  { round: 1, matches: 16, label: 'Runde 1' },
  { round: 2, matches: 8, label: 'Achtelfinale' },
  { round: 3, matches: 4, label: 'Viertelfinale' },
  { round: 4, matches: 2, label: 'Halbfinale' },
  { round: 5, matches: 1, label: 'Finale' },
]

/** Best of the Rest: 16 Verlierer der Runde 1 -> 8 -> 4 -> 2 -> Sieger */
const BOTR_ROUNDS: RoundDef[] = [
  { round: 1, matches: 8, label: 'BotR Runde 1' },
  { round: 2, matches: 4, label: 'BotR Viertelfinale' },
  { round: 3, matches: 2, label: 'BotR Halbfinale' },
  { round: 4, matches: 1, label: 'BotR Finale' },
]

function pos(slot: number): SlotPos {
  return slot % 2 === 0 ? 'a' : 'b'
}

function labelFor(base: string, matches: number, slot: number): string {
  return matches > 1 ? `${base} ${slot + 1}` : base
}

function emptyMatch(bracket: Bracket, round: number, slot: number, label: string): MatchInsert {
  return {
    bracket,
    round,
    slot,
    label,
    team_a_id: null,
    team_b_id: null,
    winner_id: null,
    status: 'pending',
    winner_to_bracket: null,
    winner_to_round: null,
    winner_to_slot: null,
    winner_to_pos: null,
    loser_to_bracket: null,
    loser_to_round: null,
    loser_to_slot: null,
    loser_to_pos: null,
  }
}

/** Baut die Matches eines einzelnen Single-Elim-Baums inkl. Sieger-Zeigern. */
function buildRounds(
  bracket: Bracket,
  rounds: RoundDef[],
  thirdPlace: boolean,
  thirdPlaceLabel: string,
): MatchInsert[] {
  const out: MatchInsert[] = []
  const maxRound = rounds[rounds.length - 1].round

  for (const rd of rounds) {
    for (let slot = 0; slot < rd.matches; slot++) {
      const m = emptyMatch(bracket, rd.round, slot, labelFor(rd.label, rd.matches, slot))
      if (rd.round !== maxRound) {
        // Sieger wandert eine Runde weiter, in Match floor(slot/2).
        m.winner_to_bracket = bracket
        m.winner_to_round = rd.round + 1
        m.winner_to_slot = Math.floor(slot / 2)
        m.winner_to_pos = pos(slot)
      }
      out.push(m)
    }
  }

  if (thirdPlace) {
    const semi = rounds.find((r) => r.matches === 2)
    if (semi) {
      out.push(emptyMatch(bracket, THIRD_PLACE_ROUND, 0, thirdPlaceLabel))
      // Verlierer der beiden Halbfinals spielen um Platz 3.
      for (const m of out) {
        if (m.bracket === bracket && m.round === semi.round) {
          m.loser_to_bracket = bracket
          m.loser_to_round = THIRD_PLACE_ROUND
          m.loser_to_slot = 0
          m.loser_to_pos = pos(m.slot)
        }
      }
    }
  }

  return out
}

/**
 * Erzeugt alle Match-Zeilen fuer Championship + Best of the Rest.
 * `orderedTeams` bestimmt die Auslosung: Team[2s] und Team[2s+1] treffen in
 * Runde-1-Match `slot s` aufeinander. Erwartet genau TEAM_COUNT Teams.
 */
export function generateBracket(orderedTeams: Team[], thirdPlace: boolean): MatchInsert[] {
  const main = buildRounds('main', MAIN_ROUNDS, thirdPlace, 'Spiel um Platz 3')
  const botr = buildRounds('botr', BOTR_ROUNDS, thirdPlace, 'BotR Spiel um Platz 3')

  for (const m of main) {
    if (m.round !== 1) continue
    // Verlierer der ersten Runde faellt ins Best-of-the-Rest.
    m.loser_to_bracket = 'botr'
    m.loser_to_round = 1
    m.loser_to_slot = Math.floor(m.slot / 2)
    m.loser_to_pos = pos(m.slot)
    // Auslosung in die erste Runde eintragen.
    m.team_a_id = orderedTeams[m.slot * 2]?.id ?? null
    m.team_b_id = orderedTeams[m.slot * 2 + 1]?.id ?? null
    if (m.team_a_id && m.team_b_id) m.status = 'ready'
  }

  return [...main, ...botr]
}

/** Fisher-Yates-Shuffle (nicht mutierend). */
export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
