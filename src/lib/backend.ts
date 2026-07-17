import { supabase, isConfigured } from '@/lib/supabase'
import type { Match, MatchInsert, Settings, Team } from '@/types'

/** Felder, die beim Anlegen eines Teams gesetzt werden. */
export interface TeamInsert {
  name: string
  player1: string
  player2: string
  seed: number
}

export type TableName = 'teams' | 'matches' | 'settings'

export interface RealtimeEvent {
  table: TableName
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: any
  old?: any
}

/**
 * Datenschicht-Abstraktion. Zwei Implementierungen:
 *  - SupabaseBackend: Cloud + Realtime (getrennte Geraete, produktiv)
 *  - LocalBackend:    localStorage + BroadcastChannel (Offline-/Demo-Modus,
 *                     Sync zwischen Tabs auf demselben Geraet)
 */
export interface Backend {
  readonly kind: 'supabase' | 'local'
  fetchAll(): Promise<{ teams: Team[]; matches: Match[]; settings: Settings }>
  insertTeam(row: TeamInsert): Promise<Team>
  insertTeams(rows: TeamInsert[]): Promise<Team[]>
  updateTeam(id: string, patch: Partial<Team>): Promise<void>
  deleteTeam(id: string): Promise<void>
  insertMatches(rows: MatchInsert[]): Promise<Match[]>
  updateMatch(id: string, patch: Partial<Match>): Promise<Match>
  deleteAllMatches(): Promise<void>
  updateSettings(patch: Partial<Settings>): Promise<Settings>
  subscribe(handler: (e: RealtimeEvent) => void): () => void
}

const DEFAULT_SETTINGS: Settings = {
  id: 1,
  status: 'setup',
  third_place: false,
  title: 'Beer Pong Turnier',
  active_round: 1,
}

// ============================================================
//  Supabase-Backend
// ============================================================

class SupabaseBackend implements Backend {
  readonly kind = 'supabase' as const

  async fetchAll() {
    const [teamsRes, matchesRes, settingsRes] = await Promise.all([
      supabase.from('teams').select('*').order('seed'),
      supabase.from('matches').select('*'),
      supabase.from('settings').select('*').eq('id', 1).single(),
    ])
    if (teamsRes.error) throw teamsRes.error
    if (matchesRes.error) throw matchesRes.error
    if (settingsRes.error) throw settingsRes.error
    return {
      teams: teamsRes.data ?? [],
      matches: matchesRes.data ?? [],
      settings: (settingsRes.data as Settings) ?? DEFAULT_SETTINGS,
    }
  }

  async insertTeam(row: TeamInsert): Promise<Team> {
    const { data, error } = await supabase.from('teams').insert(row).select().single()
    if (error) throw error
    return data
  }

  async insertTeams(rows: TeamInsert[]): Promise<Team[]> {
    const { data, error } = await supabase.from('teams').insert(rows).select()
    if (error) throw error
    return data ?? []
  }

  async updateTeam(id: string, patch: Partial<Team>): Promise<void> {
    const { error } = await supabase.from('teams').update(patch).eq('id', id)
    if (error) throw error
  }

  async deleteTeam(id: string): Promise<void> {
    const { error } = await supabase.from('teams').delete().eq('id', id)
    if (error) throw error
  }

  async insertMatches(rows: MatchInsert[]): Promise<Match[]> {
    const { data, error } = await supabase.from('matches').insert(rows).select()
    if (error) throw error
    return data ?? []
  }

  async updateMatch(id: string, patch: Partial<Match>): Promise<Match> {
    const { data, error } = await supabase.from('matches').update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  }

  async deleteAllMatches(): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) throw error
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const { data, error } = await supabase.from('settings').update(patch).eq('id', 1).select().single()
    if (error) throw error
    return data
  }

  subscribe(handler: (e: RealtimeEvent) => void): () => void {
    const channel = supabase
      .channel('turnier')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, (p) =>
        handler({ table: 'teams', eventType: p.eventType as any, new: p.new, old: p.old }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (p) =>
        handler({ table: 'matches', eventType: p.eventType as any, new: p.new, old: p.old }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (p) =>
        handler({ table: 'settings', eventType: p.eventType as any, new: p.new, old: p.old }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }
}

// ============================================================
//  Local-Backend (localStorage + BroadcastChannel)
// ============================================================

const LS_TEAMS = 'bp_teams'
const LS_MATCHES = 'bp_matches'
const LS_SETTINGS = 'bp_settings'
const BC_NAME = 'bp_turnier'

function uuid(): string {
  return crypto.randomUUID()
}
function nowIso(): string {
  return new Date().toISOString()
}
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write<T>(key: string, val: T): void {
  localStorage.setItem(key, JSON.stringify(val))
}

class LocalBackend implements Backend {
  readonly kind = 'local' as const
  private channel: BroadcastChannel | null = null

  private emit(e: RealtimeEvent) {
    // An andere Tabs senden (BroadcastChannel liefert nicht an den Absender-Tab).
    try {
      new BroadcastChannel(BC_NAME).postMessage(e)
    } catch {
      /* BroadcastChannel evtl. nicht verfuegbar — dann nur lokaler Tab. */
    }
  }

  async fetchAll() {
    const teams = read<Team[]>(LS_TEAMS, []).slice().sort((a, b) => a.seed - b.seed)
    const matches = read<Match[]>(LS_MATCHES, [])
    const settings = read<Settings>(LS_SETTINGS, DEFAULT_SETTINGS)
    return { teams, matches, settings }
  }

  async insertTeam(row: TeamInsert): Promise<Team> {
    const teams = read<Team[]>(LS_TEAMS, [])
    const team: Team = { id: uuid(), created_at: nowIso(), ...row }
    teams.push(team)
    write(LS_TEAMS, teams)
    this.emit({ table: 'teams', eventType: 'INSERT', new: team })
    return team
  }

  async insertTeams(rows: TeamInsert[]): Promise<Team[]> {
    const teams = read<Team[]>(LS_TEAMS, [])
    const created = rows.map((r) => ({ id: uuid(), created_at: nowIso(), ...r }) as Team)
    write(LS_TEAMS, [...teams, ...created])
    for (const t of created) this.emit({ table: 'teams', eventType: 'INSERT', new: t })
    return created
  }

  async updateTeam(id: string, patch: Partial<Team>): Promise<void> {
    const teams = read<Team[]>(LS_TEAMS, [])
    const i = teams.findIndex((t) => t.id === id)
    if (i === -1) return
    teams[i] = { ...teams[i], ...patch }
    write(LS_TEAMS, teams)
    this.emit({ table: 'teams', eventType: 'UPDATE', new: teams[i] })
  }

  async deleteTeam(id: string): Promise<void> {
    const teams = read<Team[]>(LS_TEAMS, [])
    const old = teams.find((t) => t.id === id)
    write(LS_TEAMS, teams.filter((t) => t.id !== id))
    if (old) this.emit({ table: 'teams', eventType: 'DELETE', old })
  }

  async insertMatches(rows: MatchInsert[]): Promise<Match[]> {
    const created = rows.map((r) => ({ id: uuid(), created_at: nowIso(), ...r }) as Match)
    write(LS_MATCHES, created)
    for (const m of created) this.emit({ table: 'matches', eventType: 'INSERT', new: m })
    return created
  }

  async updateMatch(id: string, patch: Partial<Match>): Promise<Match> {
    const matches = read<Match[]>(LS_MATCHES, [])
    const i = matches.findIndex((m) => m.id === id)
    if (i === -1) throw new Error('Match nicht gefunden')
    matches[i] = { ...matches[i], ...patch }
    write(LS_MATCHES, matches)
    this.emit({ table: 'matches', eventType: 'UPDATE', new: matches[i] })
    return matches[i]
  }

  async deleteAllMatches(): Promise<void> {
    const old = read<Match[]>(LS_MATCHES, [])
    write(LS_MATCHES, [])
    for (const m of old) this.emit({ table: 'matches', eventType: 'DELETE', old: m })
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const settings = { ...read<Settings>(LS_SETTINGS, DEFAULT_SETTINGS), ...patch }
    write(LS_SETTINGS, settings)
    this.emit({ table: 'settings', eventType: 'UPDATE', new: settings })
    return settings
  }

  subscribe(handler: (e: RealtimeEvent) => void): () => void {
    this.channel = new BroadcastChannel(BC_NAME)
    this.channel.onmessage = (ev) => handler(ev.data as RealtimeEvent)
    return () => {
      this.channel?.close()
      this.channel = null
    }
  }
}

export const backend: Backend = isConfigured ? new SupabaseBackend() : new LocalBackend()
