create table if not exists public.meal_analysis_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  meal_id text not null,
  model_id text not null,
  provider text not null,
  image_count integer not null check (image_count >= 0),
  scene_payload jsonb not null default '{}'::jsonb,
  token_usage jsonb,
  latency_ms integer not null check (latency_ms >= 0),
  cost_estimate numeric(10, 6) not null default 0 check (cost_estimate >= 0),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create table if not exists public.meal_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  meal_id text not null,
  item_id text not null,
  food_label text not null,
  field text not null,
  previous_value jsonb not null,
  next_value jsonb not null,
  correction_type text not null,
  source_model_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create table if not exists public.portion_calibrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  food_label text not null,
  container_key text not null,
  estimated_grams numeric(8, 1) not null check (estimated_grams >= 0),
  verified_grams numeric(8, 1) not null check (verified_grams >= 0),
  residual_grams numeric(8, 1) not null,
  source text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create table if not exists public.personal_food_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  graph_key text not null,
  graph_type text not null,
  stats_payload jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, graph_key, graph_type)
);

alter table public.meal_analysis_events enable row level security;
alter table public.meal_corrections enable row level security;
alter table public.portion_calibrations enable row level security;
alter table public.personal_food_stats enable row level security;

create policy "Users manage their own meal analysis events"
on public.meal_analysis_events for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage their own meal corrections"
on public.meal_corrections for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage their own portion calibrations"
on public.portion_calibrations for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage their own personal food stats"
on public.personal_food_stats for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists meal_analysis_events_user_created_at_idx on public.meal_analysis_events(user_id, created_at desc);
create index if not exists meal_corrections_user_created_at_idx on public.meal_corrections(user_id, created_at desc);
create index if not exists portion_calibrations_user_created_at_idx on public.portion_calibrations(user_id, created_at desc);
create index if not exists personal_food_stats_user_updated_at_idx on public.personal_food_stats(user_id, updated_at desc);

grant select, insert, update, delete on public.meal_analysis_events to authenticated;
grant select, insert, update, delete on public.meal_corrections to authenticated;
grant select, insert, update, delete on public.portion_calibrations to authenticated;
grant select, insert, update, delete on public.personal_food_stats to authenticated;
