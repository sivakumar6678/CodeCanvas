-- ==============================================================================
-- CodeCraft: User Profiles & Personalization Schema
-- ==============================================================================
-- Run this entire script in your Supabase Project:
-- Supabase Dashboard -> SQL Editor -> New query -> Paste & Run
-- It is idempotent and safe to run multiple times.
-- ==============================================================================

-- 1. Create table if not exists
create table if not exists public.user_profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text unique not null,
    avatar_url text,
    avatar_id text,
    bio text,
    role text,
    experience_level text,
    interests text[] default '{}'::text[],
    technologies text[] default '{}'::text[],
    goals text[] default '{}'::text[],
    preferred_pricing text default 'any',
    preferred_platforms text[] default '{}'::text[],
    onboarding_completed boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Idempotent column additions for existing tables
alter table public.user_profiles add column if not exists avatar_url text;
alter table public.user_profiles add column if not exists avatar_id text;
alter table public.user_profiles add column if not exists bio text;
alter table public.user_profiles add column if not exists role text;
alter table public.user_profiles add column if not exists experience_level text;
alter table public.user_profiles add column if not exists interests text[] default '{}'::text[];
alter table public.user_profiles add column if not exists technologies text[] default '{}'::text[];
alter table public.user_profiles add column if not exists goals text[] default '{}'::text[];
alter table public.user_profiles add column if not exists preferred_pricing text default 'any';
alter table public.user_profiles add column if not exists preferred_platforms text[] default '{}'::text[];
alter table public.user_profiles add column if not exists onboarding_completed boolean default false;
alter table public.user_profiles add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 3. Enable Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- 4. Row Level Security Policies
-- Public read access allows community display of usernames/avatars for comments & reviews
drop policy if exists "Authenticated users can view profiles" on public.user_profiles;
drop policy if exists "CodeCraft profiles are publicly readable" on public.user_profiles;
create policy "CodeCraft profiles are publicly readable"
    on public.user_profiles for select
    using (true);

-- User insert access restricted to own user ID
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "CodeCraft users insert own profile" on public.user_profiles;
create policy "CodeCraft users insert own profile"
    on public.user_profiles for insert to authenticated
    with check (auth.uid() = id);

-- User update access restricted to own user ID
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "CodeCraft users update own profile" on public.user_profiles;
create policy "CodeCraft users update own profile"
    on public.user_profiles for update to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- User delete access restricted to own user ID
drop policy if exists "Users can delete own profile" on public.user_profiles;
drop policy if exists "CodeCraft users delete own profile" on public.user_profiles;
create policy "CodeCraft users delete own profile"
    on public.user_profiles for delete to authenticated
    using (auth.uid() = id);

-- 5. Automatic Profile Provisioning Trigger for New Auth Users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, username, avatar_url, avatar_id, bio)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'User_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'avatar_id', new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(new.raw_user_meta_data->>'avatar_id', ''),
    ''
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Reload PostgREST Schema Cache
-- Notifies PostgREST to reload its schema cache so newly added columns
-- (like experience_level, role, interests, avatar_id) are recognized immediately without server restart.
notify pgrst, 'reload schema';

