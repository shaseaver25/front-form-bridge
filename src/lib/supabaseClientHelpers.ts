import type { SupabaseClient } from '@supabase/supabase-js';

export async function invokeMicrosoftUserOAuthStart(
  supabase: SupabaseClient,
  payload: Record<string, unknown> = {}
): Promise<unknown> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    const err = new Error('auth_required');
    (err as Error & { code: string }).code = 'AUTH_REQUIRED';
    throw err;
  }

  const bodyPayload = {
    ...payload,
    origin: payload.origin || (typeof window !== 'undefined' ? window.location.origin : ''),
  };
  
  const result = await supabase.functions.invoke('microsoft-user-oauth-start', {
    method: 'POST',
    body: bodyPayload,
  });

  if (result.error) {
    throw result.error;
  }

  return result.data;
}