-- Extensões
create extension if not exists "pgcrypto";

-- Enums
create type public.quiz_status as enum ('draft', 'published');
create type public.step_type as enum ('question', 'input', 'content', 'result');
create type public.domain_status as enum ('pending', 'active');
create type public.plan_type as enum ('free', 'pro', 'premium');

-- Perfis (espelho de auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  plan public.plan_type not null default 'free',
  created_at timestamptz not null default now()
);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain text not null,
  status public.domain_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (user_id, domain)
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null,
  status public.quiz_status not null default 'draft',
  domain_id uuid references public.domains (id) on delete set null,
  theme jsonb default '{}'::jsonb,
  facebook_pixel_id text,
  google_analytics_id text,
  google_tag_manager_id text,
  tiktok_pixel_id text,
  webhook_url text,
  created_at timestamptz not null default now(),
  unique (slug)
);

create index idx_quizzes_user on public.quizzes (user_id);
create index idx_quizzes_status on public.quizzes (status);

create table public.steps (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  type public.step_type not null,
  order_index int not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create index idx_steps_quiz_order on public.steps (quiz_id, order_index);

create table public.options (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.steps (id) on delete cascade,
  label text not null,
  value text not null,
  next_step_id uuid references public.steps (id) on delete set null,
  order_index int not null default 0
);

create index idx_options_step on public.options (step_id);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  name text not null,
  conditions jsonb not null default '{}'::jsonb,
  redirect_url text,
  order_index int not null default 0
);

create index idx_results_quiz on public.results (quiz_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  session_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_leads_quiz_created on public.leads (quiz_id, created_at desc);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  step_id uuid not null references public.steps (id) on delete cascade,
  answer jsonb not null,
  unique (lead_id, step_id)
);

create index idx_responses_lead on public.responses (lead_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  type text not null,
  metadata jsonb not null default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now()
);

create index idx_events_quiz_type_created on public.events (quiz_id, type, created_at desc);

-- Trigger: criar profile ao registrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.domains enable row level security;
alter table public.quizzes enable row level security;
alter table public.steps enable row level security;
alter table public.options enable row level security;
alter table public.results enable row level security;
alter table public.leads enable row level security;
alter table public.responses enable row level security;
alter table public.events enable row level security;

-- Políticas: cliente Supabase autenticado acessa apenas próprios dados
create policy "profiles_self_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);

create policy "domains_owner_all" on public.domains for all using (auth.uid() = user_id);

create policy "quizzes_owner_select" on public.quizzes for select using (auth.uid() = user_id);
create policy "quizzes_owner_insert" on public.quizzes for insert with check (auth.uid() = user_id);
create policy "quizzes_owner_update" on public.quizzes for update using (auth.uid() = user_id);
create policy "quizzes_owner_delete" on public.quizzes for delete using (auth.uid() = user_id);

create policy "steps_via_quiz" on public.steps for all using (
  exists (select 1 from public.quizzes q where q.id = steps.quiz_id and q.user_id = auth.uid())
);

create policy "options_via_step" on public.options for all using (
  exists (
    select 1 from public.steps s
    join public.quizzes q on q.id = s.quiz_id
    where s.id = options.step_id and q.user_id = auth.uid()
  )
);

create policy "results_via_quiz" on public.results for all using (
  exists (select 1 from public.quizzes q where q.id = results.quiz_id and q.user_id = auth.uid())
);

create policy "leads_via_quiz_owner" on public.leads for all using (
  exists (select 1 from public.quizzes q where q.id = leads.quiz_id and q.user_id = auth.uid())
);

create policy "responses_via_lead_owner" on public.responses for all using (
  exists (
    select 1 from public.leads l
    join public.quizzes q on q.id = l.quiz_id
    where l.id = responses.lead_id and q.user_id = auth.uid()
  )
);

create policy "events_via_quiz_owner" on public.events for all using (
  exists (select 1 from public.quizzes q where q.id = events.quiz_id and q.user_id = auth.uid())
);

-- Storage: bucket para assets de quiz (criar também no Dashboard se preferir UI)
insert into storage.buckets (id, name, public)
values ('quiz-assets', 'quiz-assets', true)
on conflict (id) do nothing;

create policy "quiz_assets_authenticated_all"
on storage.objects for all to authenticated
using (bucket_id = 'quiz-assets')
with check (bucket_id = 'quiz-assets');

create policy "quiz_assets_public_read"
on storage.objects for select to public
using (bucket_id = 'quiz-assets');
