-- Restrict vote creation to admins only at database level

-- Drop existing insert policy if it exists
drop policy if exists "Users can create votes" on public.votes;

-- Create new policy: only admins can insert votes
create policy "Only admins can create votes"
  on public.votes
  for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Ensure admins can update their own votes
drop policy if exists "Users can update own votes" on public.votes;
create policy "Admins can update votes"
  on public.votes
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Ensure admins can delete votes
drop policy if exists "Users can delete own votes" on public.votes;
create policy "Admins can delete votes"
  on public.votes
  for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );
