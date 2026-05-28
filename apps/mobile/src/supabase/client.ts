export type MacroLensUser = { id: string; email?: string | null };
export type MacroLensSession = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user?: MacroLensUser;
} | null;

type JsonPayload = Record<string, unknown> | null;
type OAuthProvider = 'apple' | 'google';

type PasswordCredentials = {
  email: string;
  password: string;
};

type RedirectOptions = {
  redirectTo?: string;
};

type FunctionInvokeOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  signal?: AbortSignal;
};

type SupabaseRequestError = {
  status: number;
  message: string;
  payload: unknown;
  context: {
    json(): Promise<unknown>;
    text(): Promise<string>;
  };
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function encodeStoragePath(bucket: string, path: string): string {
  return [bucket, ...path.split('/').filter(Boolean)].map(encodeURIComponent).join('/');
}

async function readResponse(response: Response): Promise<{ payload: unknown; text: string }> {
  const text = await response.text();
  if (!text) {
    return { payload: null, text };
  }

  try {
    return { payload: JSON.parse(text) as JsonPayload, text };
  } catch {
    return { payload: text, text };
  }
}

function buildRequestError(response: Response, payload: unknown, text: string): SupabaseRequestError {
  const message =
    typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : `supabase_request_failed_${response.status}`;

  return {
    status: response.status,
    message,
    payload,
    context: {
      json: async () => payload,
      text: async () => text,
    },
  };
}

function parseSessionPayload(payload: unknown): { session: MacroLensSession; user: MacroLensUser | null } {
  const body = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
  const session = (body.session ?? (body.access_token || body.user ? body : null)) as MacroLensSession;
  const user = ((body.user as MacroLensUser | undefined) ?? session?.user ?? null) as MacroLensUser | null;

  if (session && !session.user && user) {
    session.user = user;
  }

  return { session, user };
}

function queryStringFromParts(parts: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(parts).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, value);
    }
  });
  return params.toString();
}

export function createMacroLensSupabaseClient(supabaseUrl: string, supabaseAnonKey: string, fetcher: typeof fetch = fetch) {
  const baseUrl = trimTrailingSlash(supabaseUrl);
  let currentSession: MacroLensSession = null;

  function authToken(): string {
    return currentSession?.access_token ?? supabaseAnonKey;
  }

  function headers(contentType?: string): Record<string, string> {
    return {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${authToken()}`,
      ...(contentType ? { 'Content-Type': contentType } : {}),
    };
  }

  return {
    auth: {
      async getSession() {
        return {
          data: { session: currentSession },
          error: null,
        };
      },
      setSession(session: MacroLensSession) {
        currentSession = session;
        return { data: { session }, error: null };
      },
      async signInAnonymously() {
        try {
          const response = await fetcher(`${baseUrl}/auth/v1/signup`, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: {},
              gotrue_meta_security: {},
            }),
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return {
              data: { session: null, user: null },
              error: buildRequestError(response, payload, text),
            };
          }

          const { session, user } = parseSessionPayload(payload);
          currentSession = session;

          return {
            data: { session, user },
            error: null,
          };
        } catch (error) {
          return {
            data: { session: null, user: null },
            error,
          };
        }
      },
      async signUpWithPassword(credentials: PasswordCredentials) {
        try {
          const response = await fetcher(`${baseUrl}/auth/v1/signup`, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email.trim(),
              password: credentials.password,
            }),
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return { data: { session: null, user: null }, error: buildRequestError(response, payload, text) };
          }

          const { session, user } = parseSessionPayload(payload);
          currentSession = session;
          return { data: { session, user }, error: null };
        } catch (error) {
          return { data: { session: null, user: null }, error };
        }
      },
      async signInWithPassword(credentials: PasswordCredentials) {
        try {
          const response = await fetcher(`${baseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email.trim(),
              password: credentials.password,
            }),
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return { data: { session: null, user: null }, error: buildRequestError(response, payload, text) };
          }

          const { session, user } = parseSessionPayload(payload);
          currentSession = session;
          return { data: { session, user }, error: null };
        } catch (error) {
          return { data: { session: null, user: null }, error };
        }
      },
      async refreshSession(refreshToken: string) {
        try {
          const response = await fetcher(`${baseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return { data: { session: null, user: null }, error: buildRequestError(response, payload, text) };
          }

          const { session, user } = parseSessionPayload(payload);
          currentSession = session;
          return { data: { session, user }, error: null };
        } catch (error) {
          return { data: { session: null, user: null }, error };
        }
      },
      async resetPasswordForEmail(email: string, options: RedirectOptions = {}) {
        try {
          const response = await fetcher(`${baseUrl}/auth/v1/recover`, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email.trim(),
              ...(options.redirectTo ? { redirect_to: options.redirectTo } : {}),
            }),
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return { data: payload, error: buildRequestError(response, payload, text) };
          }

          return { data: payload, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      async signOut() {
        try {
          const response = await fetcher(`${baseUrl}/auth/v1/logout`, {
            method: 'POST',
            headers: headers('application/json'),
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return { data: payload, error: buildRequestError(response, payload, text) };
          }

          currentSession = null;
          return { data: payload, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      async getUser() {
        try {
          const response = await fetcher(`${baseUrl}/auth/v1/user`, {
            method: 'GET',
            headers: headers('application/json'),
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return { data: { user: null }, error: buildRequestError(response, payload, text) };
          }

          const user = typeof payload === 'object' && payload !== null ? (payload as MacroLensUser) : null;
          if (currentSession && user?.id) {
            currentSession.user = user;
          }

          return { data: { user }, error: null };
        } catch (error) {
          return { data: { user: null }, error };
        }
      },
      getOAuthUrl(provider: OAuthProvider, redirectTo: string) {
        return `${baseUrl}/auth/v1/authorize?${queryStringFromParts({ provider, redirect_to: redirectTo })}`;
      },
    },
    rest: {
      async get(table: string, query = '') {
        try {
          const suffix = query.length > 0 ? `?${query}` : '';
          const response = await fetcher(`${baseUrl}/rest/v1/${encodeURIComponent(table)}${suffix}`, {
            method: 'GET',
            headers: headers('application/json'),
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return { data: payload, error: buildRequestError(response, payload, text) };
          }

          return { data: payload, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      async upsert(table: string, body: unknown, options: { onConflict?: string } = {}) {
        try {
          const suffix = options.onConflict ? `?on_conflict=${encodeURIComponent(options.onConflict)}` : '';
          const response = await fetcher(`${baseUrl}/rest/v1/${encodeURIComponent(table)}${suffix}`, {
            method: 'POST',
            headers: {
              ...headers('application/json'),
              Prefer: 'resolution=merge-duplicates,return=representation',
            },
            body: JSON.stringify(body),
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return { data: payload, error: buildRequestError(response, payload, text) };
          }

          return { data: payload, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      async delete(table: string, query: string) {
        try {
          const suffix = query.length > 0 ? `?${query}` : '';
          const response = await fetcher(`${baseUrl}/rest/v1/${encodeURIComponent(table)}${suffix}`, {
            method: 'DELETE',
            headers: {
              ...headers('application/json'),
              Prefer: 'return=minimal',
            },
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return { data: payload, error: buildRequestError(response, payload, text) };
          }

          return { data: payload, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, body: ArrayBuffer, options: { contentType: string; upsert: boolean }) {
            try {
              const cleanPath = path.split('/').filter(Boolean).join('/');
              const response = await fetcher(`${baseUrl}/storage/v1/object/${encodeStoragePath(bucket, cleanPath)}`, {
                method: 'POST',
                headers: {
                  ...headers(options.contentType),
                  'cache-control': 'max-age=3600',
                  'x-upsert': String(options.upsert),
                },
                body,
              });
              const { payload, text } = await readResponse(response);

              if (!response.ok) {
                return { data: null, error: buildRequestError(response, payload, text) };
              }

              const responseBody = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};

              return {
                data: {
                  id: typeof responseBody.Id === 'string' ? responseBody.Id : typeof responseBody.id === 'string' ? responseBody.id : '',
                  path: cleanPath,
                  fullPath:
                    typeof responseBody.Key === 'string'
                      ? responseBody.Key
                      : typeof responseBody.fullPath === 'string'
                        ? responseBody.fullPath
                        : `${bucket}/${cleanPath}`,
                },
                error: null,
              };
            } catch (error) {
              return { data: null, error };
            }
          },
          async createSignedUrl(path: string, expiresIn: number) {
            try {
              const response = await fetcher(`${baseUrl}/storage/v1/object/sign/${encodeStoragePath(bucket, path)}`, {
                method: 'POST',
                headers: headers('application/json'),
                body: JSON.stringify({ expiresIn }),
              });
              const { payload, text } = await readResponse(response);

              if (!response.ok) {
                return { data: null, error: buildRequestError(response, payload, text) };
              }

              const responseBody = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
              const signedPath = responseBody.signedURL ?? responseBody.signedUrl;

              if (typeof signedPath !== 'string') {
                return { data: null, error: new Error('signed_url_missing') };
              }

              return {
                data: {
                  signedUrl: signedPath.startsWith('http') ? signedPath : encodeURI(`${baseUrl}/storage/v1${signedPath}`),
                },
                error: null,
              };
            } catch (error) {
              return { data: null, error };
            }
          },
        };
      },
    },
    functions: {
      async invoke(name: string, options: FunctionInvokeOptions = {}) {
        try {
          const response = await fetcher(`${baseUrl}/functions/v1/${encodeURIComponent(name)}`, {
            method: options.method ?? 'POST',
            headers: {
              ...headers('application/json'),
              ...(options.headers ?? {}),
            },
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
            signal: options.signal,
          });
          const { payload, text } = await readResponse(response);

          if (!response.ok) {
            return {
              data: payload,
              error: buildRequestError(response, payload, text),
            };
          }

          return { data: payload, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
    },
  };
}
