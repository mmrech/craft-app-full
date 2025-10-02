-- Make the system work without authentication for single-user setup
-- Update RLS policies to allow public access

-- Drop existing restrictive policies
drop policy if exists "Users can view their own documents" on public.documents;
drop policy if exists "Users can insert their own documents" on public.documents;
drop policy if exists "Users can update their own documents" on public.documents;
drop policy if exists "Users can delete their own documents" on public.documents;

drop policy if exists "Users can view extractions for their documents" on public.clinical_extractions;
drop policy if exists "Users can insert extractions for their documents" on public.clinical_extractions;
drop policy if exists "Users can delete extractions for their documents" on public.clinical_extractions;

drop policy if exists "Users can upload their own PDFs" on storage.objects;
drop policy if exists "Users can view their own PDFs" on storage.objects;
drop policy if exists "Users can delete their own PDFs" on storage.objects;

-- Create public policies for single-user access
create policy "Public can view all documents"
  on public.documents for select
  using (true);

create policy "Public can insert documents"
  on public.documents for insert
  with check (true);

create policy "Public can update documents"
  on public.documents for update
  using (true);

create policy "Public can delete documents"
  on public.documents for delete
  using (true);

-- Public extraction policies
create policy "Public can view all extractions"
  on public.clinical_extractions for select
  using (true);

create policy "Public can insert extractions"
  on public.clinical_extractions for insert
  with check (true);

create policy "Public can delete extractions"
  on public.clinical_extractions for delete
  using (true);

-- Public storage policies
create policy "Public can upload PDFs"
  on storage.objects for insert
  with check (bucket_id = 'pdf_documents');

create policy "Public can view PDFs"
  on storage.objects for select
  using (bucket_id = 'pdf_documents');

create policy "Public can delete PDFs"
  on storage.objects for delete
  using (bucket_id = 'pdf_documents');

-- Make user_id nullable since we're not using auth
alter table public.documents alter column user_id drop not null;