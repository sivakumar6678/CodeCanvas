-- CodeCraft Analytics Schema Migration
-- Unified, lightweight, and privacy-preserving platform analytics table

create table if not exists public.analytics_events (
    id uuid default gen_random_uuid() primary key,
    event_type text not null check (event_type in (
        'tool_view',
        'tool_click',
        'tool_save',
        'tool_review',
        'search',
        'category_view',
        'knowledge_view',
        'knowledge_copy',
        'knowledge_save',
        'contribution'
    )),
    entity_type text,         -- 'tool', 'knowledge', 'search', 'category', 'user'
    entity_id text,           -- tool slug, prompt id, category slug, search query
    metadata jsonb default '{}'::jsonb, -- lightweight non-sensitive metadata (e.g., category, rating, results count)
    user_id uuid references auth.users(id) on delete set null,
    occurred_at timestamptz default timezone('utc'::text, now()) not null
);

-- Performance Indexes
create index if not exists analytics_events_type_occurred_idx on public.analytics_events(event_type, occurred_at desc);
create index if not exists analytics_events_entity_idx on public.analytics_events(entity_type, entity_id);
create index if not exists analytics_events_occurred_idx on public.analytics_events(occurred_at desc);
create index if not exists analytics_events_user_idx on public.analytics_events(user_id);

-- Enable Row Level Security
alter table public.analytics_events enable row level security;

-- Analytics writes must run through the service role or admin-only paths.
drop policy if exists "CodeCraft analytics events are insertable" on public.analytics_events;
create policy "CodeCraft analytics events are insertable" on public.analytics_events
    for insert to authenticated
    with check (
        exists (
            select 1 from public.user_profiles
            where user_profiles.id = auth.uid()
              and user_profiles.role = 'admin'
        )
    );

-- Only Studio Administrators can read all analytics events
drop policy if exists "CodeCraft admin reads analytics events" on public.analytics_events;
create policy "CodeCraft admin reads analytics events" on public.analytics_events
    for select
    using (
        exists (
            select 1 from public.user_profiles
            where user_profiles.id = auth.uid()
            and (user_profiles.role = 'admin' or auth.jwt() ->> 'email' = any(string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',')))
        )
    );

-- Legacy tool analytics are private to Studio administrators.
drop policy if exists "CodeCraft authenticated view reads" on public.analytics_tool_views;
drop policy if exists "CodeCraft admins read view analytics" on public.analytics_tool_views;
create policy "CodeCraft admins read view analytics" on public.analytics_tool_views
    for select to authenticated using (
      exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
    );

drop policy if exists "CodeCraft authenticated click reads" on public.analytics_tool_clicks;
drop policy if exists "CodeCraft admins read click analytics" on public.analytics_tool_clicks;
create policy "CodeCraft admins read click analytics" on public.analytics_tool_clicks
    for select to authenticated using (
      exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
    );
