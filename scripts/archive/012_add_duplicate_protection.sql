-- Additional duplicate protection and data integrity constraints

-- First, drop any existing constraints that might conflict
alter table public.badges drop constraint if exists positive_badge_points;
alter table public.profiles drop constraint if exists positive_points;
alter table public.profiles drop constraint if exists no_self_referral_profile;
alter table public.profiles drop constraint if exists non_empty_referral_code;
alter table public.votes drop constraint if exists positive_vote_count;
alter table public.votes drop constraint if exists non_empty_vote_title;
alter table public.activities drop constraint if exists non_zero_activity_points;
alter table public.referrals drop constraint if exists no_self_referral;
alter table public.badges drop constraint if exists non_empty_badge_name;

-- Now fix any existing invalid data

-- Fix any negative or NULL points in profiles
update public.profiles set points = 0 where points < 0 or points is null;

-- Fix any negative or NULL vote counts in votes
update public.votes set vote_count = 0 where vote_count < 0 or vote_count is null;

-- Fix any invalid badge points (set to 1 if NULL or <= 0)
update public.badges set points_required = 1 where points_required is null or points_required <= 0;

-- Fixed column name from 'type' to 'activity_type'
-- Fix any zero-point activities (set to 1 or -1 based on activity_type)
update public.activities set points = 1 where points = 0 and activity_type in ('referral', 'vote', 'badge_earned');

-- Fix any empty or NULL referral codes
update public.profiles 
set referral_code = gen_random_uuid()::text 
where referral_code is null or length(trim(referral_code)) = 0;

-- Fix any empty or NULL vote titles
update public.votes 
set title = 'Untitled Vote' 
where title is null or length(trim(title)) = 0;

-- Fix any empty or NULL badge names
update public.badges 
set name = 'Unnamed Badge' 
where name is null or length(trim(name)) = 0;

-- Now add constraints after data is clean

-- Ensure platform_statistics only has one row
create unique index if not exists platform_statistics_singleton_idx 
  on public.platform_statistics ((true));

-- Prevent self-referrals (user can't refer themselves)
alter table public.referrals 
  add constraint no_self_referral 
  check (referrer_id != referred_id);

-- Prevent self-referral in profiles
alter table public.profiles
  add constraint no_self_referral_profile
  check (id != referred_by);

-- Ensure email uniqueness is case-insensitive for supporters
create unique index if not exists supporters_email_lower_idx 
  on public.supporters (lower(email));

-- Drop the old email index since we're using case-insensitive now
drop index if exists supporters_email_idx;

-- Add constraint to prevent negative points
alter table public.profiles
  add constraint positive_points
  check (points >= 0);

-- Add constraint to prevent negative vote counts
alter table public.votes
  add constraint positive_vote_count
  check (vote_count >= 0);

-- Add constraint to ensure badge points are positive
alter table public.badges
  add constraint positive_badge_points
  check (points_required > 0);

-- Add constraint to ensure activity points are not zero
alter table public.activities
  add constraint non_zero_activity_points
  check (points != 0);

-- Ensure referral codes are not empty
alter table public.profiles
  add constraint non_empty_referral_code
  check (length(trim(referral_code)) > 0);

-- Ensure vote titles are not empty
alter table public.votes
  add constraint non_empty_vote_title
  check (length(trim(title)) > 0);

-- Ensure badge names are not empty
alter table public.badges
  add constraint non_empty_badge_name
  check (length(trim(name)) > 0);

-- Add function to normalize emails before insert/update on supporters
create or replace function normalize_supporter_email()
returns trigger as $$
begin
  new.email = lower(trim(new.email));
  return new;
end;
$$ language plpgsql;

-- Create trigger to normalize supporter emails
drop trigger if exists normalize_supporter_email_trigger on public.supporters;
create trigger normalize_supporter_email_trigger
  before insert or update on public.supporters
  for each row
  execute function normalize_supporter_email();

-- Add comments explaining the protections
comment on table public.referrals is 'Tracks member referrals. Prevents duplicates and self-referrals.';
comment on table public.supporters is 'Tracks supporter signups. Emails are case-insensitive unique.';
comment on table public.user_votes is 'Tracks user votes. Prevents duplicate votes on same petition.';
comment on table public.user_badges is 'Tracks earned badges. Prevents earning same badge twice.';
