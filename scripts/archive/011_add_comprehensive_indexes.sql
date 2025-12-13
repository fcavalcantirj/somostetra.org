-- Add comprehensive indexes for optimal query performance

-- Profiles indexes
create index if not exists idx_profiles_email on public.profiles(id); -- id is already indexed as primary key, but adding for clarity
create index if not exists idx_profiles_referral_code on public.profiles(referral_code);
create index if not exists idx_profiles_referred_by on public.profiles(referred_by);
create index if not exists idx_profiles_points on public.profiles(points desc); -- For leaderboard queries
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

-- User badges indexes
create index if not exists idx_user_badges_user_id on public.user_badges(user_id);
create index if not exists idx_user_badges_badge_id on public.user_badges(badge_id);
create index if not exists idx_user_badges_earned_at on public.user_badges(earned_at desc);

-- Badges indexes
create index if not exists idx_badges_points_required on public.badges(points_required);
create index if not exists idx_badges_name on public.badges(name);

-- Votes indexes (additional to existing ones)
create index if not exists idx_votes_category on public.votes(category);
create index if not exists idx_votes_vote_count on public.votes(vote_count desc); -- For popular votes
create index if not exists idx_votes_status_created_at on public.votes(status, created_at desc); -- Composite for filtered lists

-- Supporters indexes (additional to existing ones)
create index if not exists idx_supporters_created_at on public.supporters(created_at desc);

-- Activities indexes (additional to existing ones)
create index if not exists idx_activities_activity_type on public.activities(activity_type);
create index if not exists idx_activities_user_type on public.activities(user_id, activity_type); -- Composite for user activity filtering

-- Referrals indexes (additional to existing ones)
create index if not exists idx_referrals_created_at on public.referrals(created_at desc);

-- Add comments for documentation
comment on index idx_profiles_referral_code is 'Fast lookup for referral link clicks';
comment on index idx_profiles_points is 'Optimizes leaderboard queries';
comment on index idx_user_badges_user_id is 'Fast user badge lookups';
comment on index idx_votes_category is 'Enables fast category filtering';
comment on index idx_votes_status_created_at is 'Optimizes active votes list';
