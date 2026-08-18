-- Database structure for Mood&More
-- Run this in the Supabase SQL Editor, then run rls-policies.sql
-- Running it twice is safe, every statement checks first

-- The fixed list of moods, ids are chosen by us because the app
-- refers to them by number in frontend/src/lib/moods.js
create table if not exists public.moods (
  id   integer primary key,
  name text    not null unique
);

-- "on conflict do nothing" skips a mood that is already there
insert into public.moods (id, name) values
  (1, 'Happy'),
  (2, 'Energetic'),
  (3, 'Calm'),
  (4, 'Romantic'),
  (5, 'Melancholic'),
  (6, 'Sad'),
  (7, 'Favorites'),
  (8, 'Custom')
on conflict (id) do nothing;

-- Mood 7 is Favorites, it has no card on the home page.
-- Mood 8 is Custom, for the playlists people build track by track with the
-- + button. Neither belongs to a feeling, they are here because mood_id is
-- required and has to point at a real row.

-- One row per saved playlist, the tracks are stored inside the row
-- in the songs column as JSON, there is no separate songs table
create table if not exists public.playlists (
  -- A random id so nobody can guess another user's playlist address
  id uuid primary key default gen_random_uuid(),

  -- "on delete cascade" removes the playlists when the account is deleted
  user_id uuid not null references auth.users (id) on delete cascade,

  -- "references" makes the database refuse a mood that does not exist
  mood_id integer not null references public.moods (id),

  name text not null default 'My playlist',

  -- Example: [{"videoId":"UtF6Jej8yb4","title":"Avicii - The Nights",
  --   "artist":"AviciiOfficialVEVO","duration":"3:11","thumbnail":"https://…"}]
  songs jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);

-- The collection page asks for "my playlists, newest first", without this
-- index the database reads every row to find them
create index if not exists playlists_user_created_idx
  on public.playlists (user_id, created_at desc);

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

-- One row per user. The id is the same id as in auth.users, so other
-- tables can point at this one instead of at the auth schema.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Supabase makes the account in auth.users, which we cannot write to.
-- This function copies the new user into our own profiles table.
-- "security definer" lets it write past the security rules.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Run that function every time somebody signs up
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the email in profiles the same as the one in auth.users,
-- because the trigger above only runs when the account is created
create or replace function public.handle_user_update()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function public.handle_user_update();

-- Accounts that already existed before this table did
insert into public.profiles (id, email, full_name)
select id, email, raw_user_meta_data ->> 'full_name'
from auth.users
on conflict (id) do nothing;

-- Bucket for the profile pictures. "public" means anyone with the
-- address may look at the image, which is what we want for avatars.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Check that it worked, expect 8 moods
select id, name from public.moods order by id;

-- Check the columns of the playlists table
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'playlists'
order by ordinal_position;

-- Expect one row per account that has signed up
select id, email, full_name, avatar_url from public.profiles;

-- Expect is_public to be there, boolean, not null, default false
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'playlists'
  and column_name = 'is_public';

-- Next step: run rls-policies.sql, or anyone can read everyone's playlists
