-- Add indexes for better query performance and prevent some duplicates
-- Note: We don't add a strict unique constraint on title+created_by as users might want to create similar votes over time

-- Add index on votes for better performance
create index if not exists idx_votes_created_by on public.votes(created_by);
create index if not exists idx_votes_status on public.votes(status);
create index if not exists idx_votes_created_at on public.votes(created_at desc);

-- Add composite index to help detect potential duplicates
create index if not exists idx_votes_title_creator on public.votes(title, created_by);

-- Add index on user_votes for better performance
create index if not exists idx_user_votes_user_id on public.user_votes(user_id);
create index if not exists idx_user_votes_vote_id on public.user_votes(vote_id);

-- Add index on activities for better performance
create index if not exists idx_activities_user_id on public.activities(user_id);
create index if not exists idx_activities_created_at on public.activities(created_at desc);

-- Add index on referrals for better performance
create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);
create index if not exists idx_referrals_referred_id on public.referrals(referred_id);
