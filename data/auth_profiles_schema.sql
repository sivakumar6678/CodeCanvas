-- CodeCraft authentication profile table and row-level security.
-- Apply this in the Supabase SQL editor before using profile editing/registration.

create table if not exists public.user_profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text unique not null,
    avatar_url text,
    bio text,
    role text,
    experience_level text,
    interests text[] default '{}'::text[],
    technologies text[] default '{}'::text[],
    goals text[] default '{}'::text[],
    preferred_pricing text,
    preferred_platforms text[] default '{}'::text[],
    onboarding_completed boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_profiles add column if not exists role text;
alter table public.user_profiles add column if not exists experience_level text;
alter table public.user_profiles add column if not exists interests text[] default '{}'::text[];
alter table public.user_profiles add column if not exists technologies text[] default '{}'::text[];
alter table public.user_profiles add column if not exists goals text[] default '{}'::text[];
alter table public.user_profiles add column if not exists preferred_pricing text;
alter table public.user_profiles add column if not exists preferred_platforms text[] default '{}'::text[];
alter table public.user_profiles add column if not exists onboarding_completed boolean default false;

alter table public.user_profiles enable row level security;

drop policy if exists "Authenticated users can view profiles" on public.user_profiles;
create policy "Authenticated users can view profiles"
    on public.user_profiles for select to authenticated
    using (true);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
    on public.user_profiles for insert to authenticated
    with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
    on public.user_profiles for update to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.user_profiles;
create policy "Users can delete own profile"
    on public.user_profiles for delete to authenticated
    using (auth.uid() = id);
