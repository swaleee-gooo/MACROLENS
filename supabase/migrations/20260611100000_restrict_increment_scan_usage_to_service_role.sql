-- Security hardening (Supabase advisor 0028/0029): the quota RPC must only be
-- callable by the Edge Functions (service role). Without this, any client with
-- the publishable key could inflate another user's counter via PostgREST and
-- lock them out of scanning for the hour.
-- Applied to production via the Supabase MCP on 2026-06-11.
revoke execute on function public.increment_scan_usage(uuid, timestamptz) from public;
revoke execute on function public.increment_scan_usage(uuid, timestamptz) from anon;
revoke execute on function public.increment_scan_usage(uuid, timestamptz) from authenticated;
grant execute on function public.increment_scan_usage(uuid, timestamptz) to service_role;
