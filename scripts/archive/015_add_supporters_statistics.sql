-- Add total_supporters column to platform_statistics
alter table platform_statistics
add column if not exists total_supporters integer not null default 0;

-- Update the column with current supporter count
update platform_statistics
set total_supporters = (select count(*) from supporters);

-- Create functions to track supporters separately
create or replace function increment_supporters()
returns trigger as $$
begin
  update platform_statistics set total_supporters = total_supporters + 1;
  return new;
end;
$$ language plpgsql;

create or replace function decrement_supporters()
returns trigger as $$
begin
  update platform_statistics set total_supporters = greatest(0, total_supporters - 1);
  return old;
end;
$$ language plpgsql;

-- Drop existing supporter triggers that update connections
drop trigger if exists on_supporter_insert on supporters;
drop trigger if exists on_supporter_delete on supporters;
drop trigger if exists on_supporters_change on supporters;

-- Create new triggers for supporters count
create trigger on_supporter_insert
  after insert on supporters
  for each row execute function increment_supporters();

create trigger on_supporter_delete
  after delete on supporters
  for each row execute function decrement_supporters();

create trigger on_supporters_change
  after insert or delete on supporters
  for each row execute function update_statistics_timestamp();

-- Update total_connections to only count referrals (member-to-member)
-- Note: Supporters are now tracked separately in total_supporters
update platform_statistics
set total_connections = (select count(*) from referrals);
