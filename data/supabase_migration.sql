-- CodeCraft complete Supabase schema.
-- Run this file in the Supabase SQL Editor. It is safe to re-run.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text unique not null,
    avatar_url text,
    bio text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.tool_reviews (
    id uuid default gen_random_uuid() primary key,
    tool_slug text not null,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    rating integer check (rating between 1 and 5) not null,
    review_text text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    unique (tool_slug, user_id)
);

create table if not exists public.comments (
    id uuid default gen_random_uuid() primary key,
    tool_slug text not null,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    parent_id uuid references public.comments(id) on delete cascade,
    content text not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.saved_tools (
    user_id uuid references auth.users(id) on delete cascade not null,
    tool_slug text not null,
    saved_at timestamptz default timezone('utc'::text, now()) not null,
    primary key (user_id, tool_slug)
);

create table if not exists public.collections (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    name text not null,
    description text,
    is_public boolean default true not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.collection_items (
    collection_id uuid references public.collections(id) on delete cascade not null,
    tool_slug text not null,
    added_at timestamptz default timezone('utc'::text, now()) not null,
    primary key (collection_id, tool_slug)
);

create table if not exists public.tool_upvotes (
    tool_slug text not null,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    primary key (tool_slug, user_id)
);

create table if not exists public.analytics_tool_views (
    id uuid default gen_random_uuid() primary key,
    tool_slug text not null,
    viewed_at timestamptz default timezone('utc'::text, now()) not null,
    user_agent text
);

create table if not exists public.analytics_tool_clicks (
    id uuid default gen_random_uuid() primary key,
    tool_slug text not null,
    clicked_at timestamptz default timezone('utc'::text, now()) not null,
    user_agent text
);

create index if not exists tool_reviews_slug_idx on public.tool_reviews(tool_slug);
create index if not exists comments_slug_idx on public.comments(tool_slug);
create index if not exists saved_tools_user_idx on public.saved_tools(user_id);
create index if not exists tool_upvotes_slug_idx on public.tool_upvotes(tool_slug);
create index if not exists analytics_views_slug_idx on public.analytics_tool_views(tool_slug);
create index if not exists analytics_clicks_slug_idx on public.analytics_tool_clicks(tool_slug);

alter table public.user_profiles enable row level security;
alter table public.tool_reviews enable row level security;
alter table public.comments enable row level security;
alter table public.saved_tools enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.tool_upvotes enable row level security;
alter table public.analytics_tool_views enable row level security;
alter table public.analytics_tool_clicks enable row level security;

-- Profiles are displayed next to public reviews/comments; mutations remain owner-only.
drop policy if exists "CodeCraft profiles are publicly readable" on public.user_profiles;
create policy "CodeCraft profiles are publicly readable" on public.user_profiles
    for select using (true);
drop policy if exists "CodeCraft users insert own profile" on public.user_profiles;
create policy "CodeCraft users insert own profile" on public.user_profiles
    for insert to authenticated with check (auth.uid() = id);
drop policy if exists "CodeCraft users update own profile" on public.user_profiles;
create policy "CodeCraft users update own profile" on public.user_profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "CodeCraft users delete own profile" on public.user_profiles;
create policy "CodeCraft users delete own profile" on public.user_profiles
    for delete to authenticated using (auth.uid() = id);

drop policy if exists "CodeCraft reviews are publicly readable" on public.tool_reviews;
create policy "CodeCraft reviews are publicly readable" on public.tool_reviews
    for select using (true);
drop policy if exists "CodeCraft users create own reviews" on public.tool_reviews;
create policy "CodeCraft users create own reviews" on public.tool_reviews
    for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "CodeCraft users update own reviews" on public.tool_reviews;
create policy "CodeCraft users update own reviews" on public.tool_reviews
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "CodeCraft users delete own reviews" on public.tool_reviews;
create policy "CodeCraft users delete own reviews" on public.tool_reviews
    for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "CodeCraft comments are publicly readable" on public.comments;
create policy "CodeCraft comments are publicly readable" on public.comments
    for select using (true);
drop policy if exists "CodeCraft users create own comments" on public.comments;
create policy "CodeCraft users create own comments" on public.comments
    for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "CodeCraft users update own comments" on public.comments;
create policy "CodeCraft users update own comments" on public.comments
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "CodeCraft users delete own comments" on public.comments;
create policy "CodeCraft users delete own comments" on public.comments
    for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "CodeCraft users view own saved tools" on public.saved_tools;
create policy "CodeCraft users view own saved tools" on public.saved_tools
    for select to authenticated using (auth.uid() = user_id);
drop policy if exists "CodeCraft users save own tools" on public.saved_tools;
create policy "CodeCraft users save own tools" on public.saved_tools
    for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "CodeCraft users remove own saved tools" on public.saved_tools;
create policy "CodeCraft users remove own saved tools" on public.saved_tools
    for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "CodeCraft users view own collections" on public.collections;
create policy "CodeCraft users view own collections" on public.collections
    for select to authenticated using (auth.uid() = user_id or is_public = true);
drop policy if exists "CodeCraft users create own collections" on public.collections;
create policy "CodeCraft users create own collections" on public.collections
    for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "CodeCraft users update own collections" on public.collections;
create policy "CodeCraft users update own collections" on public.collections
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "CodeCraft users delete own collections" on public.collections;
create policy "CodeCraft users delete own collections" on public.collections
    for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "CodeCraft users view collection items" on public.collection_items;
create policy "CodeCraft users view collection items" on public.collection_items
    for select to authenticated using (
      exists (select 1 from public.collections c where c.id = collection_id and (c.user_id = auth.uid() or c.is_public = true))
    );
drop policy if exists "CodeCraft users manage own collection items" on public.collection_items;
create policy "CodeCraft users manage own collection items" on public.collection_items
    for all to authenticated using (
      exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
    ) with check (
      exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
    );

drop policy if exists "CodeCraft upvotes are publicly readable" on public.tool_upvotes;
create policy "CodeCraft upvotes are publicly readable" on public.tool_upvotes
    for select using (true);
drop policy if exists "CodeCraft users create own upvotes" on public.tool_upvotes;
create policy "CodeCraft users create own upvotes" on public.tool_upvotes
    for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "CodeCraft users remove own upvotes" on public.tool_upvotes;
create policy "CodeCraft users remove own upvotes" on public.tool_upvotes
    for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "CodeCraft anonymous view inserts" on public.analytics_tool_views;
create policy "CodeCraft anonymous view inserts" on public.analytics_tool_views
    for insert to anon, authenticated with check (true);
drop policy if exists "CodeCraft authenticated view reads" on public.analytics_tool_views;
create policy "CodeCraft authenticated view reads" on public.analytics_tool_views
    for select to authenticated using (true);

drop policy if exists "CodeCraft anonymous click inserts" on public.analytics_tool_clicks;
create policy "CodeCraft anonymous click inserts" on public.analytics_tool_clicks
    for insert to anon, authenticated with check (true);
drop policy if exists "CodeCraft authenticated click reads" on public.analytics_tool_clicks;
create policy "CodeCraft authenticated click reads" on public.analytics_tool_clicks
    for select to authenticated using (true);
