-- Function to generate unique referral code
create or replace function generate_referral_code()
returns text
language plpgsql
as $$
declare
  code text;
  exists boolean;
begin
  loop
    code := upper(substring(md5(random()::text) from 1 for 8));
    select exists(select 1 from public.profiles where referral_code = code) into exists;
    exit when not exists;
  end loop;
  return code;
end;
$$;

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, referral_code, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    generate_referral_code(),
    (new.raw_user_meta_data ->> 'referred_by')::uuid
  );
  
  -- Award points for signing up
  insert into public.activities (user_id, activity_type, points, description)
  values (new.id, 'signup', 10, 'Cadastro realizado');
  
  -- Update points
  update public.profiles set points = points + 10 where id = new.id;
  
  -- If referred by someone, create referral record and award points
  if (new.raw_user_meta_data ->> 'referred_by') is not null then
    insert into public.referrals (referrer_id, referred_id)
    values ((new.raw_user_meta_data ->> 'referred_by')::uuid, new.id);
    
    insert into public.activities (user_id, activity_type, points, description)
    values ((new.raw_user_meta_data ->> 'referred_by')::uuid, 'referral', 20, 'Indicou um novo membro');
    
    update public.profiles 
    set points = points + 20 
    where id = (new.raw_user_meta_data ->> 'referred_by')::uuid;
  end if;
  
  return new;
end;
$$;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update vote count
create or replace function update_vote_count()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.votes set vote_count = vote_count + 1 where id = new.vote_id;
    
    -- Award points for voting
    insert into public.activities (user_id, activity_type, points, description)
    values (new.user_id, 'vote', 5, 'Votou em uma pauta');
    
    update public.profiles set points = points + 5 where id = new.user_id;
  elsif TG_OP = 'DELETE' then
    update public.votes set vote_count = vote_count - 1 where id = old.vote_id;
    
    -- Remove points
    insert into public.activities (user_id, activity_type, points, description)
    values (old.user_id, 'vote_removed', -5, 'Removeu voto de uma pauta');
    
    update public.profiles set points = points - 5 where id = old.user_id;
  end if;
  return null;
end;
$$;

-- Trigger for vote count
drop trigger if exists on_user_vote_change on public.user_votes;
create trigger on_user_vote_change
  after insert or delete on public.user_votes
  for each row
  execute function update_vote_count();
