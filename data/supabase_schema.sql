-- Create table for tracking tool views
create table if not exists public.analytics_tool_views (
    id uuid default gen_random_uuid() primary key,
    tool_slug text not null,
    viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_agent text
);

-- Create table for tracking external link clicks
create table if not exists public.analytics_tool_clicks (
    id uuid default gen_random_uuid() primary key,
    tool_slug text not null,
    clicked_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_agent text
);

-- Enable Row Level Security (RLS)
alter table public.analytics_tool_views enable row level security;
alter table public.analytics_tool_clicks enable row level security;

-- Create policies to allow ANYONE to insert (we want public tracking)
create policy "Allow anonymous inserts on tool views"
on public.analytics_tool_views for insert to anon
with check (true);

create policy "Allow anonymous inserts on tool clicks"
on public.analytics_tool_clicks for insert to anon
with check (true);

-- Create policies to allow ONLY authenticated users to read
create policy "Allow authenticated reads on tool views"
on public.analytics_tool_views for select to authenticated
using (true);

create policy "Allow authenticated reads on tool clicks"
on public.analytics_tool_clicks for select to authenticated
using (true);
