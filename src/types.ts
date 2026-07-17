export type Bracket = 'main' | 'botr'
export type MatchStatus = 'pending' | 'ready' | 'done'
export type SlotPos = 'a' | 'b'
export type TournamentStatus = 'setup' | 'running' | 'done'

export interface Team {
  id: string
  name: string
  player1: string
  player2: string
  seed: number
  created_at?: string
}

export interface Match {
  id: string
  bracket: Bracket
  round: number
  slot: number
  label: string
  team_a_id: string | null
  team_b_id: string | null
  winner_id: string | null
  status: MatchStatus
  winner_to_bracket: Bracket | null
  winner_to_round: number | null
  winner_to_slot: number | null
  winner_to_pos: SlotPos | null
  loser_to_bracket: Bracket | null
  loser_to_round: number | null
  loser_to_slot: number | null
  loser_to_pos: SlotPos | null
  created_at?: string
}

export interface Settings {
  id: number
  status: TournamentStatus
  third_place: boolean
  title: string
}

/** Match-Zeile ohne DB-generierte Felder — fuer Inserts. */
export type MatchInsert = Omit<Match, 'id' | 'created_at'>
