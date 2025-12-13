-- Create function to increment user points safely
create or replace function increment_user_points(user_id uuid, points_to_add integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set points = points + points_to_add,
      updated_at = now()
  where id = user_id;
end;
$$;
