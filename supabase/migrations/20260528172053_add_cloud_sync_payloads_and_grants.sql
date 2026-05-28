alter table public.profiles
  add column if not exists targets jsonb,
  add column if not exists payload jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.meals
  add column if not exists client_id text,
  add column if not exists payload jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.meals
  drop constraint if exists meals_source_check;

alter table public.meals
  add constraint meals_source_check
  check (source in ('open_food_facts', 'nutrition_label_ocr', 'usda', 'estimated', 'mock'));

alter table public.food_items
  drop constraint if exists food_items_data_source_check;

alter table public.food_items
  add constraint food_items_data_source_check
  check (data_source in ('open_food_facts', 'nutrition_label_ocr', 'usda', 'estimated', 'mock'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'meals_user_client_id_key'
      and conrelid = 'public.meals'::regclass
  ) then
    alter table public.meals
      add constraint meals_user_client_id_key unique (user_id, client_id);
  end if;
end
$$;

create index if not exists profiles_updated_at_idx on public.profiles(updated_at desc);
create index if not exists meals_user_updated_at_idx on public.meals(user_id, updated_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.meals to authenticated;
grant select, insert, update, delete on public.food_items to authenticated;
grant select, insert, update, delete on public.corrections to authenticated;
