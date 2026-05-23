type SessionLike = { user: { id: string } } | null;

type SupabaseAuthLike = {
  getSession(): Promise<{ data: { session: SessionLike }; error: unknown }>;
  signInAnonymously(): Promise<{ data: { session: SessionLike; user: { id: string } | null }; error: unknown }>;
};

export async function ensureAnonymousUserId(auth: SupabaseAuthLike): Promise<string> {
  const existingSession = await auth.getSession();
  if (existingSession.error) {
    throw new Error('auth_session_lookup_failed');
  }

  if (existingSession.data.session?.user.id) {
    return existingSession.data.session.user.id;
  }

  const anonymousSession = await auth.signInAnonymously();
  if (anonymousSession.error) {
    throw new Error('anonymous_auth_failed');
  }

  const userId = anonymousSession.data.session?.user.id ?? anonymousSession.data.user?.id;
  if (!userId) {
    throw new Error('anonymous_user_missing');
  }

  return userId;
}
