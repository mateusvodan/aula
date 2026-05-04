-- FunisQuiz / XQuiz-like SaaS schema + RLS
-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (mirror auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id);

create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

create table public.funnels (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  published boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index funnels_user_id_idx on public.funnels (user_id);

alter table public.funnels enable row level security;

create policy funnels_owner_all
  on public.funnels for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anonymous / public read published funnels (runtime /q/[slug])
create policy funnels_public_read
  on public.funnels for select
  using (published = true);

create table public.blocks (
  id uuid primary key default gen_random_uuid (),
  funnel_id uuid not null references public.funnels (id) on delete cascade,
  type text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  position jsonb not null default '{"x":0,"y":0}'::jsonb,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index blocks_funnel_id_idx on public.blocks (funnel_id);

alter table public.blocks enable row level security;

create policy blocks_owner_via_funnel
  on public.blocks for all
  using (
    exists (
      select 1 from public.funnels f
      where f.id = blocks.funnel_id and f.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.funnels f
      where f.id = blocks.funnel_id and f.user_id = auth.uid()
    )
  );

create policy blocks_public_read
  on public.blocks for select
  using (
    exists (
      select 1 from public.funnels f
      where f.id = blocks.funnel_id and f.published = true
    )
  );

create table public.connections (
  id uuid primary key default gen_random_uuid (),
  funnel_id uuid not null references public.funnels (id) on delete cascade,
  from_block_id uuid not null references public.blocks (id) on delete cascade,
  to_block_id uuid not null references public.blocks (id) on delete cascade,
  condition jsonb not null default '{"kind":"default"}'::jsonb,
  created_at timestamptz not null default now (),
  constraint connections_distinct_blocks check (from_block_id <> to_block_id)
);

create index connections_funnel_id_idx on public.connections (funnel_id);

alter table public.connections enable row level security;

create policy connections_owner_via_funnel
  on public.connections for all
  using (
    exists (
      select 1 from public.funnels f
      where f.id = connections.funnel_id and f.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.funnels f
      where f.id = connections.funnel_id and f.user_id = auth.uid()
    )
  );

create policy connections_public_read
  on public.connections for select
  using (
    exists (
      select 1 from public.funnels f
      where f.id = connections.funnel_id and f.published = true
    )
  );

create table public.leads (
  id uuid primary key default gen_random_uuid (),
  funnel_id uuid not null references public.funnels (id) on delete cascade,
  name text,
  email text,
  phone text,
  answers jsonb not null default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now ()
);

create index leads_funnel_created_idx on public.leads (funnel_id, created_at desc);

alter table public.leads enable row level security;

create policy leads_owner_select
  on public.leads for select
  using (
    exists (
      select 1 from public.funnels f
      where f.id = leads.funnel_id and f.user_id = auth.uid()
    )
  );

create policy leads_public_insert
  on public.leads for insert
  with check (
    exists (
      select 1 from public.funnels f
      where f.id = funnel_id and f.published = true
    )
  );

create table public.analytics_events (
  id uuid primary key default gen_random_uuid (),
  funnel_id uuid not null references public.funnels (id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now ()
);

create index analytics_funnel_created_idx on public.analytics_events (funnel_id, created_at desc);

alter table public.analytics_events enable row level security;

create policy analytics_owner_select
  on public.analytics_events for select
  using (
    exists (
      select 1 from public.funnels f
      where f.id = analytics_events.funnel_id and f.user_id = auth.uid()
    )
  );

create policy analytics_public_insert
  on public.analytics_events for insert
  with check (
    exists (
      select 1 from public.funnels f
      where f.id = funnel_id and f.published = true
    )
  );
