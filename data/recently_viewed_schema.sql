-- CodeCraft Recently Viewed / User Tool History Schema Migration
-- Tracks authenticated user tool browsing history with deduplication

create table if not exists public.recently_viewed_tools (
    user_id uuid references auth.users(id) on delete cascade not null,
    tool_slug text not null,
    tool_type text default 'ai_tool' check (tool_type in ('ai_tool', 'builtin_tool')),
    viewed_at timestamptz default timezone('utc'::text, now()) not null,
    primary key (user_id, tool_slug)
);

-- Index for ordering history quickly
create index if not exists recently_viewed_user_viewed_idx on public.recently_viewed_tools(user_id, viewed_at desc);

-- Enable Row Level Security
alter table public.recently_viewed_tools enable row level security;

-- RLS Policies: Authenticated users manage strictly their own history
drop policy if exists "CodeCraft users insert own recently viewed" on public.recently_viewed_tools;
create policy "CodeCraft users insert own recently viewed" on public.recently_viewed_tools
    for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "CodeCraft users select own recently viewed" on public.recently_viewed_tools;
create policy "CodeCraft users select own recently viewed" on public.recently_viewed_tools
    for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "CodeCraft users update own recently viewed" on public.recently_viewed_tools;
create policy "CodeCraft users update own recently viewed" on public.recently_viewed_tools
    for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "CodeCraft users delete own recently viewed" on public.recently_viewed_tools;
create policy "CodeCraft users delete own recently viewed" on public.recently_viewed_tools
    for delete to authenticated
    using (auth.uid() = user_id);

