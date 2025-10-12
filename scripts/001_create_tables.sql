-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  points integer default 0,
  referral_code text unique not null,
  referred_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Referrals tracking table
create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(referrer_id, referred_id)
);

-- Votes/Petitions table
create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null,
  status text default 'active' check (status in ('active', 'closed', 'completed')),
  vote_count integer default 0,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- User votes tracking
create table if not exists public.user_votes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  vote_id uuid references public.votes(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(user_id, vote_id)
);

-- Badges table
create table if not exists public.badges (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text not null,
  icon text not null,
  points_required integer not null,
  created_at timestamp with time zone default now()
);

-- User badges (earned badges)
create table if not exists public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  earned_at timestamp with time zone default now(),
  unique(user_id, badge_id)
);

-- Activities table (for point tracking)
create table if not exists public.activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type text not null,
  points integer not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.referrals enable row level security;
alter table public.votes enable row level security;
alter table public.user_votes enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.activities enable row level security;

-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Referrals policies
create policy "Users can view all referrals"
  on public.referrals for select
  using (true);

create policy "Users can insert referrals"
  on public.referrals for insert
  with check (auth.uid() = referrer_id);

-- Votes policies
create policy "Users can view all votes"
  on public.votes for select
  using (true);

create policy "Users can create votes"
  on public.votes for insert
  with check (auth.uid() = created_by);

create policy "Users can update own votes"
  on public.votes for update
  using (auth.uid() = created_by);

-- User votes policies
create policy "Users can view all user votes"
  on public.user_votes for select
  using (true);

create policy "Users can insert own votes"
  on public.user_votes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own votes"
  on public.user_votes for delete
  using (auth.uid() = user_id);

-- Badges policies
create policy "Everyone can view badges"
  on public.badges for select
  using (true);

-- User badges policies
create policy "Users can view all user badges"
  on public.user_badges for select
  using (true);

-- Activities policies
create policy "Users can view own activities"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "Users can insert own activities"
  on public.activities for insert
  with check (auth.uid() = user_id);
