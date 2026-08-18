-- Database security rules for Mood&More
-- Run this in the Supabase SQL Editor after schema.sql
-- Running it twice is safe

-- The Vue app talks to the database with the anon key, which is public.
-- Anyone can open devtools and run their own queries, so the .eq() filters
-- in the app are not protection. These rules are, because they live inside
-- the database and apply to everyone.

-- Moods: everyone may read, nobody may change
alter table public.moods enable row level security;

drop policy if exists "anyone can read moods" on public.moods;

create policy "anyone can read moods"
  on public.moods
  for select
  to anon, authenticated
  using (true);

-- No insert, update or delete policy, because no policy means not allowed

-- Playlists: you may only touch your own
alter table public.playlists enable row level security;

drop policy if exists "read own playlists" on public.playlists;
drop policy if exists "create own playlists" on public.playlists;
drop policy if exists "update own playlists" on public.playlists;
drop policy if exists "delete own playlists" on public.playlists;

-- auth.uid() is the id of the user making the request
-- USING decides which rows you are allowed to see or touch
create policy "read own playlists"
  on public.playlists
  for select
  to authenticated
  using (auth.uid() = user_id);

-- WITH CHECK decides what the new row is allowed to look like,
-- without it you could create a playlist owned by somebody else
create policy "create own playlists"
  on public.playlists
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Both are needed here, WITH CHECK stops you from changing user_id
create policy "update own playlists"
  on public.playlists
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own playlists"
  on public.playlists
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Safety net, if the app forgets to send user_id use the current user.
-- A row with no owner can never be read back.
alter table public.playlists
  alter column user_id set default auth.uid();

-- Profiles: you may only see and change your own
alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
drop policy if exists "create own profile" on public.profiles;

create policy "read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- The trigger normally makes the row, this is only a safety net
create policy "create own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

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

-- Note about is_public on playlists: the column records what the owner
-- wants, but it does not open anything up yet. "read own playlists" above
-- still limits every select to your own rows, so a published playlist is
-- for now only visible to you. The policy that lets other people read
-- is_public rows belongs with the change that makes other profiles
-- viewable, and is deliberately not here yet.

-- Profile pictures: anyone may look, you may only change your own.
-- Files are saved as <user id>/avatar.png, so the first folder in the
-- path tells us who owns the picture.
drop policy if exists "avatars are readable" on storage.objects;
drop policy if exists "upload own avatar" on storage.objects;
drop policy if exists "update own avatar" on storage.objects;
drop policy if exists "delete own avatar" on storage.objects;

create policy "avatars are readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "upload own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "update own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "delete own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Check that it worked, all three tables must say true
select relname as table_name, relrowsecurity as rls_on
from pg_class
where relname in ('moods', 'playlists', 'profiles', 'follows')
  and relnamespace = 'public'::regnamespace;

-- Expect 1 policy on moods, 4 on playlists, 3 on profiles and 3 on follows
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('moods', 'playlists', 'profiles', 'follows')
order by tablename, cmd;

-- Best check: log in as user A and note a playlist id, then log in as user B
-- and run "await supabase.from('playlists').select('*')" in the console.
-- User B must only see their own playlists.
