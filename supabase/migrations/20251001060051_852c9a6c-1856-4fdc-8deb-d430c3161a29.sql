-- Fix security warning: Recreate function with search_path
drop trigger if exists set_updated_at on public.documents;
drop function if exists public.handle_updated_at() cascade;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.documents
  for each row
  execute function public.handle_updated_at();