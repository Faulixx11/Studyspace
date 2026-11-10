-- StudySpace Cloud Sync setup
-- Run this entire script once in the Supabase SQL Editor.
-- Private data: each authenticated user can access only their own backup and files.
create table if not exists public.studyspace_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.studyspace_backups enable row level security;
drop policy if exists "Users can read their own StudySpace backup" on public.studyspace_backups;
create policy "Users can read their own StudySpace backup" on public.studyspace_backups for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert their own StudySpace backup" on public.studyspace_backups;
create policy "Users can insert their own StudySpace backup" on public.studyspace_backups for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own StudySpace backup" on public.studyspace_backups;
create policy "Users can update their own StudySpace backup" on public.studyspace_backups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
insert into storage.buckets (id, name, public, file_size_limit) values ('studyspace-files', 'studyspace-files', false, 52428800) on conflict (id) do update set public = false;
drop policy if exists "StudySpace users can read their own files" on storage.objects;
create policy "StudySpace users can read their own files" on storage.objects for select to authenticated using (bucket_id = 'studyspace-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "StudySpace users can upload their own files" on storage.objects;
create policy "StudySpace users can upload their own files" on storage.objects for insert to authenticated with check (bucket_id = 'studyspace-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "StudySpace users can update their own files" on storage.objects;
create policy "StudySpace users can update their own files" on storage.objects for update to authenticated using (bucket_id = 'studyspace-files' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'studyspace-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "StudySpace users can delete their own files" on storage.objects;
create policy "StudySpace users can delete their own files" on storage.objects for delete to authenticated using (bucket_id = 'studyspace-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
