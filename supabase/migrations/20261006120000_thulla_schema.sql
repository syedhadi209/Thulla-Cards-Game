-- Thulla friends-only schema + light RLS
-- Run this once in Supabase → SQL Editor → New query → Run

create table if not exists public.games (
  id text primary key,
  status text not null default 'waiting',
  host_id uuid not null,
  max_players int not null check (max_players between 3 and 6),
  current_turn uuid,
  turn_number int not null default 0,
  turn_expires_at timestamptz,
  winner_id uuid,
  loser_id uuid,
  public_state jsonb not null default '{}'::jsonb,
  engine jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create table if not exists public.players (
  game_id text not null references public.games (id) on delete cascade,
  user_id uuid not null,
  nickname text not null,
  joined_at timestamptz not null default now(),
  connected boolean not null default true,
  last_seen_at timestamptz not null default now(),
  card_count int not null default 0,
  status text not null default 'active',
  primary key (game_id, user_id)
);

create table if not exists public.hands (
  game_id text not null references public.games (id) on delete cascade,
  user_id uuid not null,
  cards text[] not null default '{}',
  primary key (game_id, user_id)
);

create index if not exists players_user_id_idx on public.players (user_id);

alter table public.games enable row level security;
alter table public.players enable row level security;
alter table public.hands enable row level security;

drop policy if exists "members_select_games" on public.games;
create policy "members_select_games"
  on public.games for select
  to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.game_id = games.id and p.user_id = auth.uid()
    )
  );

drop policy if exists "members_select_players" on public.players;
create policy "members_select_players"
  on public.players for select
  to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.game_id = players.game_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "self_update_presence" on public.players;
create policy "self_update_presence"
  on public.players for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own_hand_select" on public.hands;
create policy "own_hand_select"
  on public.hands for select
  to authenticated
  using (user_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.games;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.players;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.hands;
exception when duplicate_object then null;
end $$;
