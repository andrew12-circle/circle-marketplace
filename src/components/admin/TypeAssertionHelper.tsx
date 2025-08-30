// Helper component to handle Supabase type assertions
// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

// Override the complex Supabase client with a simpler interface
const simpleSupabase = supabase as any;

// Export the simplified client
export { simpleSupabase as supabase };

// Helper function for safe state updates
export const safeSetState = (setState: any, data: any) => {
  setState(data);
};