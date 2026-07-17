-- Organisator-gesteuerte "aktive Runde": Display und Admin zeigen diese Runde,
-- der Admin schaltet per Button auf die nächste Runde weiter (z.B. nach Umbau).
alter table public.settings add column if not exists active_round int not null default 1;
