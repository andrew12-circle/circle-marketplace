import { supabase } from '@/integrations/supabase/client';

export interface QBOConnection {
  id: string;
  org_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  scope?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export async function ensureFreshToken(connection: QBOConnection): Promise<string> {
  const expiresAt = new Date(connection.expires_at);
  const now = new Date();
  const twoMinutes = 2 * 60 * 1000;

  // If token expires within 2 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < twoMinutes) {
    console.log('QBO token needs refresh, refreshing...', { 
      expires_at: connection.expires_at,
      now: now.toISOString() 
    });

    const oauthBase = 'https://oauth.platform.intuit.com'; // Use environment in production
    
    // Get environment variables from edge function
    const { data: refreshResult, error } = await supabase.functions.invoke('qbo-refresh-token', {
      body: {
        refresh_token: connection.refresh_token,
        org_id: connection.org_id,
        realm_id: connection.realm_id,
      }
    });

    if (error) {
      console.error('Failed to refresh QBO token:', error);
      throw new Error('Failed to refresh QBO token');
    }

    return refreshResult.access_token;
  }

  return connection.access_token;
}

export async function getConnectionForOrg(orgId: string): Promise<QBOConnection | null> {
  const { data, error } = await supabase
    .from('qbo_connections')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No connection found
      return null;
    }
    console.error('Error fetching QBO connection:', error);
    throw error;
  }

  return data as QBOConnection;
}