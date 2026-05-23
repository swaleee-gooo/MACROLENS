create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  goal text not null check (goal in ('lose_fat', 'build_muscle', 'maintain', 'understand_eating')),
  age_range text not null,
  sex text not null check (sex in ('female', 'male', 'prefer_not_to_say')),
  height_cm integer not null check (height_cm between 80 and 260),
  weight_kg numeric(5, 1) not null check (weight_kg between 25 and 350),
  activity_level text not null check (activity_level in ('low', 'moderate', 'high')),
  target_weight_kg numeric(5, 1),
  protein_target_g integer not null check (protein_target_g between 30 and 350),
  calorie_target integer not null check (calorie_target between 800 and 6000),
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  captured_at timestamptz not null,
  meal_name text not null,
  calories_estimate integer not null check (calories_estimate >= 0),
  calories_low integer not null check (calories_low >= 0),
  calories_high integer not null check (calories_high >= calories_low),
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  carbs_g numeric(6, 1) not null check (carbs_g >= 0),
  fat_g numeric(6, 1) not null check (fat_g >= 0),
  fiber_g numeric(6, 1) not null check (fiber_g >= 0),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  notes text not null default '',
  source text not null check (source in ('open_food_facts', 'usda', 'estimated', 'mock')),
  created_at timestamptz not null default now()
);

create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  canonical_food_name text not null,
  estimated_quantity numeric(8, 1) not null check (estimated_quantity > 0),
  unit text not null,
  calories integer not null check (calories >= 0),
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  carbs_g numeric(6, 1) not null check (carbs_g >= 0),
  fat_g numeric(6, 1) not null check (fat_g >= 0),
  fiber_g numeric(6, 1) not null check (fiber_g >= 0),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  data_source text not null check (data_source in ('open_food_facts', 'usda', 'estimated', 'mock')),
  source_food_id text
);

create table public.corrections (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  type text not null check (type in ('portion_up', 'portion_down', 'add_oil', 'add_sauce', 'remove_item')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.food_items enable row level security;
alter table public.corrections enable row level security;

create policy "Users manage their own profile"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users manage their own meals"
on public.meals for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users read meal items through their meals"
on public.food_items for select
using (exists (select 1 from public.meals where meals.id = food_items.meal_id and meals.user_id = auth.uid()));

create policy "Users insert meal items through their meals"
on public.food_items for insert
with check (exists (select 1 from public.meals where meals.id = food_items.meal_id and meals.user_id = auth.uid()));

create policy "Users update meal items through their meals"
on public.food_items for update
using (exists (select 1 from public.meals where meals.id = food_items.meal_id and meals.user_id = auth.uid()))
with check (exists (select 1 from public.meals where meals.id = food_items.meal_id and meals.user_id = auth.uid()));

create policy "Users delete meal items through their meals"
on public.food_items for delete
using (exists (select 1 from public.meals where meals.id = food_items.meal_id and meals.user_id = auth.uid()));

create policy "Users manage corrections through their meals"
on public.corrections for all
using (exists (select 1 from public.meals where meals.id = corrections.meal_id and meals.user_id = auth.uid()))
with check (exists (select 1 from public.meals where meals.id = corrections.meal_id and meals.user_id = auth.uid()));

create index meals_user_captured_at_idx on public.meals(user_id, captured_at desc);
create index food_items_meal_id_idx on public.food_items(meal_id);
create index corrections_meal_id_idx on public.corrections(meal_id);
