-- ==========================================
-- COMMUNITY FEATURES ARCHITECTURE DRAFT
-- ==========================================
-- This schema prepares the database for future community features:
-- Reviews, Ratings, Comments, Bookmarks, Collections, and Recommendations.

-- 1. USER PROFILES
-- Extends Supabase auth.users with public profile information
create table if not exists public.user_profiles (
    id uuid references auth.users(id) primary key,
    username text unique not null,
    avatar_url text,
    bio text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. REVIEWS & RATINGS
-- Allows users to rate (1-5) and review tools
create table if not exists public.tool_reviews (
    id uuid default gen_random_uuid() primary key,
    tool_slug text not null,
    user_id uuid references public.user_profiles(id) not null,
    rating integer check (rating >= 1 and rating <= 5) not null,
    review_text text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(tool_slug, user_id) -- One review per user per tool
);

-- 3. COMMENTS
-- Nested comments on tools or reviews (using parent_id for threaded replies)
create table if not exists public.comments (
    id uuid default gen_random_uuid() primary key,
    tool_slug text not null,
    user_id uuid references public.user_profiles(id) not null,
    parent_id uuid references public.comments(id), -- Null if top-level comment
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. BOOKMARKS / SAVED TOOLS
-- Users saving tools to their private list
create table if not exists public.saved_tools (
    user_id uuid references public.user_profiles(id) not null,
    tool_slug text not null,
    saved_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, tool_slug)
);

-- 5. USER COLLECTIONS
-- Public or private curated lists of tools created by users
create table if not exists public.collections (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) not null,
    name text not null,
    description text,
    is_public boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Collection items mapping table
create table if not exists public.collection_items (
    collection_id uuid references public.collections(id) on delete cascade not null,
    tool_slug text not null,
    added_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (collection_id, tool_slug)
);

-- 6. RECOMMENDATIONS (Algorithms / Upvotes)
-- Simple upvote system for tools (ProductHunt style)
create table if not exists public.tool_upvotes (
    tool_slug text not null,
    user_id uuid references public.user_profiles(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (tool_slug, user_id)
);
