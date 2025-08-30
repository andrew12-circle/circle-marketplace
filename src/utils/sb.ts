import { supabase, getFreshSession } from '@/integrations/supabase/client';

const isAuthy = (msg?: string): boolean => !!msg && /(jwt|token|auth|invalid)/i.test(msg);

export async function sbInvoke(
  name: string,
  opts?: { body?: any }
): Promise<{ data: any; error: any }> {
  // call with current access token (if any)
  const s1 = await getFreshSession();
  const h1 = s1?.access_token ? { Authorization: `Bearer ${s1.access_token}` } : {};
  const result = await supabase.functions.invoke(name, { ...opts, headers: h1 });

  // On 400/invalid token → refresh once and retry
  if (result.error && ((result.error.status === 400) || isAuthy(result.error.message))) {
    await supabase.auth.refreshSession().catch(() => {});
    const s2 = await getFreshSession();
    const h2 = s2?.access_token ? { Authorization: `Bearer ${s2.access_token}` } : {};
    const retryResult = await supabase.functions.invoke(name, { ...opts, headers: { ...h1, ...h2 } });
    return { data: retryResult.data, error: retryResult.error };
  }
  
  return { data: result.data, error: result.error };
}