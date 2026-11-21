create table if not exists public.community_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  object_path text not null unique,
  caption text not null check (char_length(btrim(caption)) between 1 and 180),
  created_at timestamptz not null default now()
);

alter table public.community_photos enable row level security;

revoke all on public.community_photos from anon, authenticated;
grant select (id, object_path, caption, created_at)
  on public.community_photos to anon, authenticated;
grant insert (user_id, object_path, caption)
  on public.community_photos to authenticated;

drop policy if exists "Anyone can view community photos"
  on public.community_photos;
drop policy if exists "Signed-in users can add their own community photos"
  on public.community_photos;

create policy "Anyone can view community photos"
  on public.community_photos
  for select
  to anon, authenticated
  using (true);

create policy "Signed-in users can add their own community photos"
  on public.community_photos
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and split_part(object_path, '/', 1) = (select auth.uid()::text)
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'community-finds',
  'community-finds',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view community find photos"
  on storage.objects;
drop policy if exists "Signed-in users can upload their own community photos"
  on storage.objects;
drop policy if exists "Signed-in users can remove their own community photos"
  on storage.objects;

create policy "Anyone can view community find photos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'community-finds');

create policy "Signed-in users can upload their own community photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-finds'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Signed-in users can remove their own community photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'community-finds'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

notify pgrst, 'reload schema';
