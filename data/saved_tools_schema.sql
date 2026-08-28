-- CODECRAFT: SAVED TOOLS TABLE, INDEX, AND OWNER-ONLY RLS
-- Run this idempotent script in the Supabase SQL Editor.

create table if not exists public.saved_tools (
    user_id uuid references auth.users(id) on delete cascade not null,
    tool_slug text not null,
    saved_at timestamptz default timezone('utc'::text, now()) not null,
    primary key (user_id, tool_slug)
);

-- The composite primary key prevents duplicate saves. This index supports
-- a user's saved-tools list ordered by newest save first.
create index if not exists saved_tools_user_saved_at_idx
    on public.saved_tools(user_id, saved_at desc);

alter table public.saved_tools enable row level security;

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
