-- Create platform statistics table
create table if not exists platform_statistics (
  id uuid primary key default gen_random_uuid(),
  total_members integer not null default 0,
  total_votes integer not null default 0,
  total_connections integer not null default 0,
  last_updated timestamp with time zone default now()
);

-- Insert initial row with current counts
insert into platform_statistics (total_members, total_votes, total_connections)
select 
  (select count(*) from profiles),
  (select count(*) from votes),
  (select count(*) from referrals) + (select count(*) from supporters);

-- Function to update statistics timestamp
create or replace function update_statistics_timestamp()
returns trigger as $$
begin
  update platform_statistics set last_updated = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for profiles (members)
create or replace function increment_members()
returns trigger as $$
begin
  update platform_statistics set total_members = total_members + 1;
  return new;
end;
$$ language plpgsql;

create or replace function decrement_members()
returns trigger as $$
begin
  update platform_statistics set total_members = greatest(0, total_members - 1);
  return old;
end;
$$ language plpgsql;

create trigger on_profile_insert
  after insert on profiles
  for each row execute function increment_members();

create trigger on_profile_delete
  after delete on profiles
  for each row execute function decrement_members();

-- Trigger for votes
create or replace function increment_votes()
returns trigger as $$
begin
  update platform_statistics set total_votes = total_votes + 1;
  return new;
end;
$$ language plpgsql;

create or replace function decrement_votes()
returns trigger as $$
begin
  update platform_statistics set total_votes = greatest(0, total_votes - 1);
  return old;
end;
$$ language plpgsql;

create trigger on_vote_insert
  after insert on votes
  for each row execute function increment_votes();

create trigger on_vote_delete
  after delete on votes
  for each row execute function decrement_votes();

-- Trigger for referrals (connections)
create or replace function increment_connections()
returns trigger as $$
begin
  update platform_statistics set total_connections = total_connections + 1;
  return new;
end;
$$ language plpgsql;

create or replace function decrement_connections()
returns trigger as $$
begin
  update platform_statistics set total_connections = greatest(0, total_connections - 1);
  return old;
end;
$$ language plpgsql;

create trigger on_referral_insert
  after insert on referrals
  for each row execute function increment_connections();

create trigger on_referral_delete
  after delete on referrals
  for each row execute function decrement_connections();

-- Trigger for supporters (connections)
create trigger on_supporter_insert
  after insert on supporters
  for each row execute function increment_connections();

create trigger on_supporter_delete
  after delete on supporters
  for each row execute function decrement_connections();

-- Add timestamp update triggers
create trigger on_members_change
  after insert or delete on profiles
  for each row execute function update_statistics_timestamp();

create trigger on_votes_change
  after insert or delete on votes
  for each row execute function update_statistics_timestamp();

create trigger on_referrals_change
  after insert or delete on referrals
  for each row execute function update_statistics_timestamp();

create trigger on_supporters_change
  after insert or delete on supporters
  for each row execute function update_statistics_timestamp();

-- Enable RLS
alter table platform_statistics enable row level security;

-- Allow public read access to statistics
create policy "Anyone can view statistics"
  on platform_statistics for select
  to public
  using (true);
