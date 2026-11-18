create table if not exists public.plant_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.plant_favorites enable row level security;

revoke all on public.plant_favorites from anon;
grant select, insert, delete on public.plant_favorites to authenticated;

drop policy if exists "Users can read their own favorites"
  on public.plant_favorites;
drop policy if exists "Users can add their own favorites"
  on public.plant_favorites;
drop policy if exists "Users can remove their own favorites"
  on public.plant_favorites;

create policy "Users can read their own favorites"
  on public.plant_favorites
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own favorites"
  on public.plant_favorites
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can remove their own favorites"
  on public.plant_favorites
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
