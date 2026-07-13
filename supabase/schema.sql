-- Autocross Designer 2: Courses table
-- Run this in the Supabase SQL editor to set up the database

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  creator_token text not null,
  title text not null default 'Untitled Course',
  data jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for listing courses by creator
create index if not exists idx_courses_creator on courses (creator_token, updated_at desc);

-- Index for public course lookups
create index if not exists idx_courses_public on courses (is_public, updated_at desc);

-- Row Level Security
alter table courses enable row level security;

-- Anyone can read public courses
create policy "Public courses are readable by anyone"
  on courses for select
  using (is_public = true);

-- Creator can read all their own courses (including private)
create policy "Creators can read own courses"
  on courses for select
  using (creator_token = current_setting('request.headers')::json->>'x-creator-token');

-- Creator can insert their own courses
create policy "Creators can insert own courses"
  on courses for insert
  with check (creator_token = current_setting('request.headers')::json->>'x-creator-token');

-- Creator can update their own courses
create policy "Creators can update own courses"
  on courses for update
  using (creator_token = current_setting('request.headers')::json->>'x-creator-token');

-- Creator can delete their own courses
create policy "Creators can delete own courses"
  on courses for delete
  using (creator_token = current_setting('request.headers')::json->>'x-creator-token');

-- Auto-update updated_at on changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger courses_updated_at
  before update on courses
  for each row execute function update_updated_at();

-- ============================================================
-- Shared venues — run in SQL editor
-- Venue presets (hazard markers + obstacles per location) that
-- everyone can load; only the shared ops login can write.
--
-- Setup: create the shared ops user in Dashboard -> Authentication
-- -> Add user (email + password), then disable public signups in
-- Auth settings so no one else can become "authenticated".
-- ============================================================

create table if not exists shared_venues (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  map_center jsonb not null,
  map_zoom numeric not null,
  hazard_markers jsonb not null default '[]'::jsonb,
  obstacles jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table shared_venues enable row level security;

-- Role grants — required on projects whose default privileges predate
-- Supabase's current auto-grant behavior. RLS policies apply on top.
grant select on table public.shared_venues to anon, authenticated;
grant insert, update, delete on table public.shared_venues to authenticated;

-- Everyone (signed in or not) can read shared venues
create policy "Shared venues are readable by anyone"
  on shared_venues for select
  to anon, authenticated
  using (true);

-- Only the shared ops login (authenticated) can write
create policy "Ops can insert shared venues"
  on shared_venues for insert
  to authenticated
  with check (true);

create policy "Ops can update shared venues"
  on shared_venues for update
  to authenticated
  using (true);

create policy "Ops can delete shared venues"
  on shared_venues for delete
  to authenticated
  using (true);

create trigger shared_venues_updated_at
  before update on shared_venues
  for each row execute function update_updated_at();
