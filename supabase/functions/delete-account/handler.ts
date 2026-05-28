type EnvReader = {
  get(name: string): string | undefined;
};

type Dependencies = {
  env?: EnvReader;
  fetchAdmin?: typeof fetch;
};

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function decodeBase64Url(value: string): string {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

function getUserIdFromAuthorizationHeader(authorization: string | null): string | null {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const [, payload] = match[1].split('.');
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as { sub?: unknown };
    return typeof parsed.sub === 'string' && parsed.sub.length > 0 ? parsed.sub : null;
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

export async function handleDeleteAccountRequest(request: Request, dependencies: Dependencies = {}): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const userId = getUserIdFromAuthorizationHeader(request.headers.get('authorization'));
  if (!userId) {
    return jsonResponse({ error: 'missing_or_invalid_authorization' }, 401);
  }

  const env = dependencies.env ?? Deno.env;
  const supabaseUrl = env.get('SUPABASE_URL');
  const serviceRoleKey = env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'delete_account_not_configured' }, 500);
  }

  const fetchAdmin = dependencies.fetchAdmin ?? fetch;
  const response = await fetchAdmin(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    return jsonResponse({ error: 'delete_account_failed' }, response.status);
  }

  return jsonResponse({ deleted: true });
}
