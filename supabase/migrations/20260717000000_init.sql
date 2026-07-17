-- ============================================================
--  Beer Pong Turnier-App  ·  Supabase Schema
--  Im Supabase SQL-Editor ausfuehren (Project -> SQL -> New query).
--  Idempotent: kann bei Bedarf erneut ausgefuehrt werden.
-- ============================================================

-- ---------- Tabellen ----------

create table if not exists public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  player1    text default '',
  player2    text default '',
  seed       int  default 0,
  created_at timestamptz default now()
);

create table if not exists public.matches (
  id                 uuid primary key default gen_random_uuid(),
  bracket            text not null check (bracket in ('main', 'botr')),
  round              int  not null,           -- 1 = erste Runde des jeweiligen Baums
  slot               int  not null,           -- Position innerhalb der Runde (0-basiert)
  label              text default '',          -- z.B. "Viertelfinale 2", "Finale"
  team_a_id          uuid references public.teams(id) on delete set null,
  team_b_id          uuid references public.teams(id) on delete set null,
  winner_id          uuid references public.teams(id) on delete set null,
  status             text not null default 'pending' check (status in ('pending','ready','done')),
  -- Fortschritts-Zeiger (auf slot des Zielmatches im jeweiligen Baum)
  winner_to_bracket  text,
  winner_to_round    int,
  winner_to_slot     int,
  winner_to_pos      text check (winner_to_pos in ('a','b')),
  loser_to_bracket   text,
  loser_to_round     int,
  loser_to_slot      int,
  loser_to_pos       text check (loser_to_pos in ('a','b')),
  created_at         timestamptz default now()
);

create index if not exists matches_lookup_idx
  on public.matches (bracket, round, slot);

create table if not exists public.settings (
  id          int primary key default 1,
  status      text not null default 'setup' check (status in ('setup','running','done')),
  third_place boolean not null default true,
  title       text default 'Beer Pong Turnier',
  constraint settings_singleton check (id = 1)
);

insert into public.settings (id) values (1)
  on conflict (id) do nothing;

-- ---------- Row Level Security ----------
-- Party-Tool: Lesen und Schreiben fuer alle (anon) offen.
-- Der Schreibschutz passiert client-seitig ueber den Admin-Passcode.

alter table public.teams    enable row level security;
alter table public.matches  enable row level security;
alter table public.settings enable row level security;

do $$
begin
  -- teams
  if not exists (select 1 from pg_policies where tablename='teams' and policyname='teams_all') then
    create policy teams_all on public.teams for all using (true) with check (true);
  end if;
  -- matches
  if not exists (select 1 from pg_policies where tablename='matches' and policyname='matches_all') then
    create policy matches_all on public.matches for all using (true) with check (true);
  end if;
  -- settings
  if not exists (select 1 from pg_policies where tablename='settings' and policyname='settings_all') then
    create policy settings_all on public.settings for all using (true) with check (true);
  end if;
end $$;

-- ---------- Realtime ----------
-- Aenderungen an diesen Tabellen werden per WebSocket gepusht.

do $$
begin
  begin
    alter publication supabase_realtime add table public.teams;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.matches;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.settings;
  exception when duplicate_object then null;
  end;
end $$;

-- Vollstaendige Zeilendaten bei UPDATE/DELETE mitschicken (fuer Realtime-Diffs)
alter table public.teams    replica identity full;
alter table public.matches  replica identity full;
alter table public.settings replica identity full;
