-- ==========================================
-- CODECRAFT: SAVED TOOLS TABLE SCHEMA & RLS
-- ==========================================
-- Execute this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. Create saved_tools table
create table if not exists public.saved_tools (
    user_id uuid references auth.users(id) on delete cascade not null,
    tool_slug text not null,
    saved_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, tool_slug)
);

-- 2. Enable Row Level Security (RLS)
alter table public.saved_tools enable row level security;

-- 3. RLS Policies
-- Allow authenticated users to view their own saved tools
create policy "Users can view own saved tools"
    on public.saved_tools for select
    using (auth.uid() = user_id);

-- Allow authenticated users to save tools for themselves
create policy "Users can insert own saved tools"
    on public.saved_tools for insert
    with check (auth.uid() = user_id);

-- Allow authenticated users to delete their own saved tools
create policy "Users can delete own saved tools"
    on public.saved_tools for delete
    using (auth.uid() = user_id);
