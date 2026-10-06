-- Improve Realtime delivery for UPDATE events (run once in SQL Editor if needed)
alter table public.games replica identity full;
alter table public.players replica identity full;
alter table public.hands replica identity full;
