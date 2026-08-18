-- Adds what the profile page needs, on top of a database that already ran
-- schema.sql and rls-policies.sql.
--
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- Running it twice is safe, every statement checks first.
--
-- The same statements are also inside schema.sql and rls-policies.sql, so a
-- database built from scratch with those two files does not need this one.

-- Whether a playlist may be shown on the owner's profile. It defaults to
-- false, so the playlists saved before this column existed stay private
-- until somebody publishes them on purpose.
alter table public.playlists
  add column if not exists is_public boolean not null default false;

-- Who follows who, one row per follow. The pair is the primary key, so the
-- same account cannot follow the same person twice.
create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (follower_id, followee_id),

  -- Following yourself would make the number on your own profile wrong
  constraint follows_not_self check (follower_id <> followee_id)
);

-- The profile page asks "how many people follow me", without this index
-- the database reads every row to count them
create index if not exists follows_followee_idx
  on public.follows (followee_id);

-- Follows: you may read the ones you are part of, and you may only make
-- or undo your own. Reading is limited to rows with your own id in them,
-- so nobody can list somebody else's followers.
alter table public.follows enable row level security;

drop policy if exists "read follows about me" on public.follows;
drop policy if exists "create own follows" on public.follows;
drop policy if exists "delete own follows" on public.follows;

create policy "read follows about me"
  on public.follows
  for select
  to authenticated
  using (auth.uid() = follower_id or auth.uid() = followee_id);

create policy "create own follows"
  on public.follows
  for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "delete own follows"
  on public.follows
  for delete
  to authenticated
  using (auth.uid() = follower_id);

-- Check that it worked.
-- Expect one row: is_public, boolean, default false
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'playlists'
  and column_name = 'is_public';

-- Expect follows with rls_on = true
select relname as table_name, relrowsecurity as rls_on
from pg_class
where relname = 'follows' and relnamespace = 'public'::regnamespace;

-- Expect 3 policies on follows
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'follows'
order by cmd;
