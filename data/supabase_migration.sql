-- CodeCraft complete Supabase schema.
-- Run this file in the Supabase SQL Editor. It is safe to re-run.

create extension if not exists pgcrypto;

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
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.user_profiles add column if not exists role text;
alter table public.user_profiles add column if not exists experience_level text;
alter table public.user_profiles add column if not exists interests text[] default '{}'::text[];
alter table public.user_profiles add column if not exists technologies text[] default '{}'::text[];
alter table public.user_profiles add column if not exists goals text[] default '{}'::text[];
alter table public.user_profiles add column if not exists preferred_pricing text;
alter table public.user_profiles add column if not exists preferred_platforms text[] default '{}'::text[];
alter table public.user_profiles add column if not exists onboarding_completed boolean default false;

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

create table if not exists public.tool_suggestions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    tool_name text not null,
    website_url text not null,
    category text not null,
    subcategory text,
    description text not null,
    pricing text not null,
    tags text[] default '{}'::text[] not null,
    recommendation_reason text not null,
    display_name text not null,
    is_anonymous boolean default false not null,
    status text default 'pending' not null check (status in ('pending', 'approved', 'rejected')),
    admin_notes text,
    published_slug text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.prompt_submissions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    type text default 'prompt' not null check (type in ('prompt', 'trick', 'slash-command', 'technique')),
    prompt_content text not null,
    ai_model text not null,
    category text not null,
    use_case text not null,
    use_cases text[] default '{}'::text[] not null,
    tags text[] default '{}'::text[] not null,
    description text not null,
    display_name text not null,
    is_anonymous boolean default false not null,
    status text default 'pending' not null check (status in ('pending', 'approved', 'rejected')),
    admin_notes text,
    contributor jsonb default '{}'::jsonb not null,
    created_date timestamptz default timezone('utc'::text, now()) not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.prompt_submissions add column if not exists type text default 'prompt';
alter table public.prompt_submissions add column if not exists use_cases text[] default '{}'::text[] not null;
alter table public.prompt_submissions add column if not exists contributor jsonb default '{}'::jsonb not null;
alter table public.prompt_submissions add column if not exists created_date timestamptz default timezone('utc'::text, now()) not null;

create table if not exists public.saved_prompts (
    user_id uuid references auth.users(id) on delete cascade not null,
    prompt_id uuid references public.prompt_submissions(id) on delete cascade not null,
    saved_at timestamptz default timezone('utc'::text, now()) not null,
    primary key (user_id, prompt_id)
);

create table if not exists public.analytics_prompt_events (
    id uuid default gen_random_uuid() primary key,
    prompt_id uuid references public.prompt_submissions(id) on delete cascade not null,
    event_type text not null check (event_type in ('view', 'copy', 'save')),
    user_id uuid references auth.users(id) on delete set null,
    occurred_at timestamptz default timezone('utc'::text, now()) not null,
    user_agent text
);

create index if not exists tool_reviews_slug_idx on public.tool_reviews(tool_slug);
create index if not exists comments_slug_idx on public.comments(tool_slug);
create index if not exists saved_tools_user_idx on public.saved_tools(user_id);
create index if not exists saved_tools_user_saved_at_idx on public.saved_tools(user_id, saved_at desc);
create index if not exists tool_upvotes_slug_idx on public.tool_upvotes(tool_slug);
create index if not exists analytics_views_slug_idx on public.analytics_tool_views(tool_slug);
create index if not exists analytics_clicks_slug_idx on public.analytics_tool_clicks(tool_slug);
create index if not exists tool_suggestions_user_idx on public.tool_suggestions(user_id);
create index if not exists tool_suggestions_status_idx on public.tool_suggestions(status, created_at desc);
create index if not exists prompt_submissions_user_idx on public.prompt_submissions(user_id);
create index if not exists prompt_submissions_status_idx on public.prompt_submissions(status, created_at desc);
create index if not exists saved_prompts_user_idx on public.saved_prompts(user_id, saved_at desc);
create index if not exists prompt_events_idx on public.analytics_prompt_events(prompt_id, event_type);

alter table public.user_profiles enable row level security;
alter table public.tool_reviews enable row level security;
alter table public.comments enable row level security;
alter table public.saved_tools enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.tool_upvotes enable row level security;
alter table public.analytics_tool_views enable row level security;
alter table public.analytics_tool_clicks enable row level security;
alter table public.tool_suggestions enable row level security;
alter table public.prompt_submissions enable row level security;
alter table public.saved_prompts enable row level security;
alter table public.analytics_prompt_events enable row level security;

drop policy if exists "CodeCraft users view own tool suggestions" on public.tool_suggestions;
create policy "CodeCraft users view own tool suggestions" on public.tool_suggestions
    for select to authenticated using (auth.uid() = user_id);
drop policy if exists "CodeCraft users create own tool suggestions" on public.tool_suggestions;
create policy "CodeCraft users create own tool suggestions" on public.tool_suggestions
    for insert to authenticated with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "CodeCraft users update pending tool suggestions" on public.tool_suggestions;
create policy "CodeCraft users update pending tool suggestions" on public.tool_suggestions
    for update to authenticated using (auth.uid() = user_id and status = 'pending')
    with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "CodeCraft users delete pending tool suggestions" on public.tool_suggestions;
create policy "CodeCraft users delete pending tool suggestions" on public.tool_suggestions
    for delete to authenticated using (auth.uid() = user_id and status = 'pending');

drop policy if exists "CodeCraft users view own prompt submissions" on public.prompt_submissions;
create policy "CodeCraft users view own prompt submissions" on public.prompt_submissions
    for select to authenticated using (auth.uid() = user_id);
drop policy if exists "CodeCraft users create own prompt submissions" on public.prompt_submissions;
create policy "CodeCraft users create own prompt submissions" on public.prompt_submissions
    for insert to authenticated with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "CodeCraft users update pending prompt submissions" on public.prompt_submissions;
create policy "CodeCraft users update pending prompt submissions" on public.prompt_submissions
    for update to authenticated using (auth.uid() = user_id and status = 'pending')
    with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "CodeCraft users delete pending prompt submissions" on public.prompt_submissions;
create policy "CodeCraft users delete pending prompt submissions" on public.prompt_submissions
    for delete to authenticated using (auth.uid() = user_id and status = 'pending');

drop policy if exists "CodeCraft users view own saved prompts" on public.saved_prompts;
create policy "CodeCraft users view own saved prompts" on public.saved_prompts
    for select to authenticated using (auth.uid() = user_id);
drop policy if exists "CodeCraft users save own prompts" on public.saved_prompts;
create policy "CodeCraft users save own prompts" on public.saved_prompts
    for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.prompt_submissions p where p.id = prompt_id and p.status = 'approved'));
drop policy if exists "CodeCraft users remove own prompts" on public.saved_prompts;
create policy "CodeCraft users remove own prompts" on public.saved_prompts
    for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "CodeCraft approved prompts are publicly readable" on public.prompt_submissions;
create policy "CodeCraft approved prompts are publicly readable" on public.prompt_submissions
    for select using (status = 'approved');

drop policy if exists "CodeCraft prompt events are insertable" on public.analytics_prompt_events;
create policy "CodeCraft prompt events are insertable" on public.analytics_prompt_events
    for insert to anon, authenticated with check (true);
drop policy if exists "CodeCraft authenticated prompt event reads" on public.analytics_prompt_events;
create policy "CodeCraft authenticated prompt event reads" on public.analytics_prompt_events
    for select to authenticated using (true);

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
drop policy if exists "Users can view own saved tools" on public.saved_tools;
create policy "CodeCraft users view own saved tools" on public.saved_tools
    for select to authenticated using (auth.uid() = user_id);
drop policy if exists "CodeCraft users save own tools" on public.saved_tools;
drop policy if exists "Users can insert own saved tools" on public.saved_tools;
create policy "CodeCraft users save own tools" on public.saved_tools
    for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "CodeCraft users remove own saved tools" on public.saved_tools;
drop policy if exists "Users can delete own saved tools" on public.saved_tools;
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
