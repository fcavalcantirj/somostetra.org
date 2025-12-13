-- Create supporters table for helpers/engaged people
create table if not exists public.supporters (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text not null,
  phone text,
  referred_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.supporters enable row level security;

-- Supporters policies
create policy "Everyone can view supporters count"
  on public.supporters for select
  using (true);

create policy "Anyone can insert supporters"
  on public.supporters for insert
  with check (true);

-- Create index for faster queries
create index if not exists supporters_referred_by_idx on public.supporters(referred_by);
create index if not exists supporters_email_idx on public.supporters(email);

-- Add supporter referral tracking to activities
-- This will be used to award points when someone refers a supporter
