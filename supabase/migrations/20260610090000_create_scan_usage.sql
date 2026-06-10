-- S5 backend hardening: per-user hourly scan quota storage.
-- The window_start is computed in TS (UTC hour start) by the Edge Functions and
-- passed as a parameter; no date_trunc happens in SQL.

create table public.scan_usage (
  user_id uuid not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (user_id, window_start)
);

alter table public.scan_usage enable row level security;
-- No policies on purpose: service-role access only (Edge Functions write, the client never reads).

create or replace function public.increment_scan_usage(p_user_id uuid, p_window timestamptz)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.scan_usage (user_id, window_start, request_count)
  values (p_user_id, p_window, 1)
  on conflict (user_id, window_start) do update set request_count = scan_usage.request_count + 1
  returning request_count;
$$;
