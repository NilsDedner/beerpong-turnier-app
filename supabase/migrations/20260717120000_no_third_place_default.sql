-- Standardmäßig kein Spiel um Platz 3 (passt zum physischen Aufbauplan:
-- Finalrunde = nur BotR-Finale + großes Finale, nacheinander auf einem Tisch).
alter table public.settings alter column third_place set default false;
update public.settings set third_place = false where id = 1;
