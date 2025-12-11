-- Supabase Schema for Pronto App
-- Run this in your Supabase SQL editor

-- User profiles table
create table if not exists public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  first_name text not null,
  phone text not null,
  safe_word text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safety contacts table
create table if not exists public.safety_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text not null,
  relationship text not null,
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scheduled calls table
create table if not exists public.scheduled_calls (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  scheduled_time timestamp with time zone not null,
  status text default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.user_profiles enable row level security;
alter table public.safety_contacts enable row level security;
alter table public.scheduled_calls enable row level security;

-- RLS policies for user_profiles
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete their own profile"
  on public.user_profiles for delete
  using (auth.uid() = user_id);

-- RLS policies for safety_contacts
create policy "Users can view their own contacts"
  on public.safety_contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own contacts"
  on public.safety_contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own contacts"
  on public.safety_contacts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own contacts"
  on public.safety_contacts for delete
  using (auth.uid() = user_id);

-- RLS policies for scheduled_calls
create policy "Users can view their own scheduled calls"
  on public.scheduled_calls for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scheduled calls"
  on public.scheduled_calls for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own scheduled calls"
  on public.scheduled_calls for update
  using (auth.uid() = user_id);

create policy "Users can delete their own scheduled calls"
  on public.scheduled_calls for delete
  using (auth.uid() = user_id);

-- Indexes for better query performance
create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);
create index if not exists safety_contacts_user_id_idx on public.safety_contacts(user_id);
create index if not exists scheduled_calls_user_id_idx on public.scheduled_calls(user_id);
create index if not exists scheduled_calls_status_idx on public.scheduled_calls(status);
