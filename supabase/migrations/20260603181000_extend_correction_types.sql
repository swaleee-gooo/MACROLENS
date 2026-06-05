alter table public.corrections drop constraint if exists corrections_type_check;

alter table public.corrections
  add constraint corrections_type_check
  check (type in ('portion_up', 'portion_down', 'portion_half', 'add_oil', 'add_sauce', 'add_cheese', 'remove_item'));
