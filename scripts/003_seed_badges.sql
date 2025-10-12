-- Insert default badges
insert into public.badges (name, description, icon, points_required) values
  ('Primeiro Passo', 'Completou o cadastro', '🎯', 0),
  ('Engajado', 'Alcançou 50 pontos', '⭐', 50),
  ('Influenciador', 'Indicou 5 pessoas', '🌟', 100),
  ('Ativista', 'Votou em 10 pautas', '🗳️', 150),
  ('Líder Comunitário', 'Alcançou 500 pontos', '👑', 500)
on conflict (name) do nothing;
