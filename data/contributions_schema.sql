-- ==============================================================================
-- CodeCraft: Community Contributions Schema (AI Tools & AI Knowledge)
-- ==============================================================================
-- Run this script in your Supabase Project:
-- Supabase Dashboard -> SQL Editor -> New query -> Paste & Run
-- It is idempotent and safe to execute multiple times.
-- ==============================================================================

-- 1. Create table for tool suggestions / submissions
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

-- Idempotent column additions for existing tables
alter table public.tool_suggestions add column if not exists subcategory text;
alter table public.tool_suggestions add column if not exists admin_notes text;
alter table public.tool_suggestions add column if not exists published_slug text;
alter table public.tool_suggestions add column if not exists updated_at timestamptz default timezone('utc'::text, now());

-- 2. Create table for AI Knowledge submissions (prompts, tricks, shortcuts, techniques, guides)
create table if not exists public.prompt_submissions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    type text default 'prompt' not null check (type in ('prompt', 'trick', 'shortcut', 'slash-command', 'technique', 'guide', 'tip')),
    prompt_content text not null,
    ai_model text not null,
    platform text default 'Universal' not null,
    category text not null,
    use_case text not null,
    use_cases text[] default '{}'::text[] not null,
    tags text[] default '{}'::text[] not null,
    description text not null,
    display_name text not null,
    is_anonymous boolean default false not null,
    status text default 'pending' not null check (status in ('pending', 'approved', 'rejected')),
    admin_notes text,
    published_id text,
    contributor jsonb default '{}'::jsonb not null,
    created_date timestamptz default timezone('utc'::text, now()) not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Idempotent column additions for prompt_submissions
alter table public.prompt_submissions add column if not exists type text default 'prompt';
alter table public.prompt_submissions add column if not exists platform text default 'Universal';
alter table public.prompt_submissions add column if not exists use_cases text[] default '{}'::text[];
alter table public.prompt_submissions add column if not exists published_id text;
alter table public.prompt_submissions add column if not exists contributor jsonb default '{}'::jsonb;
alter table public.prompt_submissions add column if not exists created_date timestamptz default timezone('utc'::text, now());
alter table public.prompt_submissions add column if not exists updated_at timestamptz default timezone('utc'::text, now());

-- 3. Indexes for fast user queries and moderation queue
create index if not exists tool_suggestions_user_idx on public.tool_suggestions(user_id);
create index if not exists tool_suggestions_status_idx on public.tool_suggestions(status, created_at desc);
create index if not exists prompt_submissions_user_idx on public.prompt_submissions(user_id);
create index if not exists prompt_submissions_status_idx on public.prompt_submissions(status, created_at desc);

-- 4. Enable Row Level Security (RLS)
alter table public.tool_suggestions enable row level security;
alter table public.prompt_submissions enable row level security;

-- 5. Row Level Security Policies for Tool Suggestions
-- Users can view their own tool suggestions
drop policy if exists "CodeCraft users view own tool suggestions" on public.tool_suggestions;
create policy "CodeCraft users view own tool suggestions" on public.tool_suggestions
    for select to authenticated using (auth.uid() = user_id);

-- Normal users can only submit with status = 'pending'
drop policy if exists "CodeCraft users create own tool suggestions" on public.tool_suggestions;
create policy "CodeCraft users create own tool suggestions" on public.tool_suggestions
    for insert to authenticated with check (auth.uid() = user_id and status = 'pending');

-- Normal users can only edit their own pending suggestions and cannot self-approve
drop policy if exists "CodeCraft users update pending tool suggestions" on public.tool_suggestions;
create policy "CodeCraft users update pending tool suggestions" on public.tool_suggestions
    for update to authenticated using (auth.uid() = user_id and status = 'pending')
    with check (auth.uid() = user_id and status = 'pending');

-- Normal users can withdraw (delete) their own pending suggestions
drop policy if exists "CodeCraft users delete pending tool suggestions" on public.tool_suggestions;
create policy "CodeCraft users delete pending tool suggestions" on public.tool_suggestions
    for delete to authenticated using (auth.uid() = user_id and status = 'pending');

-- Admins can manage all tool suggestions
drop policy if exists "CodeCraft admins manage all tool suggestions" on public.tool_suggestions;
create policy "CodeCraft admins manage all tool suggestions" on public.tool_suggestions
    for all to authenticated
    using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));

-- 6. Row Level Security Policies for AI Knowledge Submissions
-- Users can view their own submissions
drop policy if exists "CodeCraft users view own prompt submissions" on public.prompt_submissions;
create policy "CodeCraft users view own prompt submissions" on public.prompt_submissions
    for select to authenticated using (auth.uid() = user_id);

-- Normal users can only submit with status = 'pending'
drop policy if exists "CodeCraft users create own prompt submissions" on public.prompt_submissions;
create policy "CodeCraft users create own prompt submissions" on public.prompt_submissions
    for insert to authenticated with check (auth.uid() = user_id and status = 'pending');

-- Normal users can only edit their own pending submissions and cannot self-approve
drop policy if exists "CodeCraft users update pending prompt submissions" on public.prompt_submissions;
create policy "CodeCraft users update pending prompt submissions" on public.prompt_submissions
    for update to authenticated using (auth.uid() = user_id and status = 'pending')
    with check (auth.uid() = user_id and status = 'pending');

-- Normal users can withdraw (delete) their own pending submissions
drop policy if exists "CodeCraft users delete pending prompt submissions" on public.prompt_submissions;
create policy "CodeCraft users delete pending prompt submissions" on public.prompt_submissions
    for delete to authenticated using (auth.uid() = user_id and status = 'pending');

-- Approved prompts are publicly readable on the website
drop policy if exists "CodeCraft approved prompts are publicly readable" on public.prompt_submissions;
create policy "CodeCraft approved prompts are publicly readable" on public.prompt_submissions
    for select using (status = 'approved');

-- Admins can manage all prompt submissions
drop policy if exists "CodeCraft admins manage all prompt submissions" on public.prompt_submissions;
create policy "CodeCraft admins manage all prompt submissions" on public.prompt_submissions
    for all to authenticated
    using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));
