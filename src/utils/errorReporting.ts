import { supabase } from '@/integrations/supabase/client';

interface ClientErrorPayload {
  error_type?: 'runtime' | 'csp_violation' | 'network' | 'other';
  message?: string;
  stack?: string;
  url?: string;
  component?: string;
  section?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export async function reportClientError(payload: ClientErrorPayload) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id ?? null;

    await (supabase.from as any)('client_errors').insert({
      user_id,
      url: payload.url ?? (typeof window !== 'undefined' ? window.location.href : undefined),
      component: payload.component,
      section: payload.section,
      error_type: payload.error_type ?? 'runtime',
      message: payload.message?.slice(0, 1000),
      stack: payload.stack?.slice(0, 4000),
      user_agent: payload.user_agent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
      metadata: payload.metadata ?? {}
    });
  } catch (e) {
    // Fail silently to avoid recursive error loops
    console.debug('client error reporting skipped:', e);
  }
}
