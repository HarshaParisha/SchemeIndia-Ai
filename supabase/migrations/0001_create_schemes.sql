create extension if not exists pg_trgm;

create table if not exists public.schemes (
  id text primary key,
  name text not null,
  ministry text not null,
  state text null,
  category text not null,
  description text not null,
  benefit text not null,
  eligibility jsonb not null default '{}'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  application_steps jsonb not null default '[]'::jsonb,
  official_link text not null,
  deadline text null,
  updated_at timestamptz null,
  created_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' ||
      coalesce(ministry, '') || ' ' ||
      coalesce(state, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(benefit, '')
    )
  ) stored
);

create index if not exists schemes_state_idx on public.schemes (state);
create index if not exists schemes_category_idx on public.schemes (category);
create index if not exists schemes_state_category_idx on public.schemes (state, category);
create index if not exists schemes_search_vector_idx on public.schemes using gin (search_vector);

alter table public.schemes enable row level security;

drop policy if exists "Public read schemes" on public.schemes;
create policy "Public read schemes" on public.schemes
  for select
  using (true);
