type MacroLensUser = { id: string };
type MacroLensSession = { access_token?: string; user?: MacroLensUser } | null;

type JsonPayload = Record<string, unknown> | null;

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

          const body = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
          const session = (body.session ?? (body.access_token || body.user ? body : null)) as MacroLensSession;
          const user = ((body.user as MacroLensUser | undefined) ?? session?.user ?? null) as MacroLensUser | null;
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
