-- Create storage bucket for PDF documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pdf_documents',
  'pdf_documents',
  false,
  52428800, -- 50MB limit
  array['application/pdf']
);

-- Create documents table to track uploaded PDFs
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  storage_path text not null,
  file_size bigint,
  total_pages integer,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create clinical_extractions table to store all extraction data
create table public.clinical_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade not null,
  step_number integer not null,
  field_name text not null,
  extracted_text text not null,
  page_number integer not null,
  coordinates jsonb not null,
  method text not null default 'manual',
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.documents enable row level security;
alter table public.clinical_extractions enable row level security;

-- RLS Policies for documents
create policy "Users can view their own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- RLS Policies for clinical_extractions
create policy "Users can view extractions for their documents"
  on public.clinical_extractions for select
  using (
    exists (
      select 1 from public.documents
      where documents.id = clinical_extractions.document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can insert extractions for their documents"
  on public.clinical_extractions for insert
  with check (
    exists (
      select 1 from public.documents
      where documents.id = clinical_extractions.document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can delete extractions for their documents"
  on public.clinical_extractions for delete
  using (
    exists (
      select 1 from public.documents
      where documents.id = clinical_extractions.document_id
      and documents.user_id = auth.uid()
    )
  );

-- Storage policies for pdf_documents bucket
create policy "Users can upload their own PDFs"
  on storage.objects for insert
  with check (
    bucket_id = 'pdf_documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own PDFs"
  on storage.objects for select
  using (
    bucket_id = 'pdf_documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own PDFs"
  on storage.objects for delete
  using (
    bucket_id = 'pdf_documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for better performance
create index idx_documents_user_id on public.documents(user_id);
create index idx_documents_created_at on public.documents(created_at desc);
create index idx_extractions_document_id on public.clinical_extractions(document_id);
create index idx_extractions_page_number on public.clinical_extractions(page_number);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.documents
  for each row
  execute function public.handle_updated_at();