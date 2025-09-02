import { supabase } from '@/integrations/supabase/client';
import { create } from 'zustand';

type AuthState = {
  status: 'unknown' | 'no-session' | 'ready';
  userId: string | null;
  set: (state: Partial<AuthState>) => void;
};

export const useAuthBoot = create<AuthState>((set) => ({
  status: 'unknown',
  userId: null,
  set: (state) => set(state)
}));

export async function bootstrapAuth() {
  const { set } = useAuthBoot.getState();
  
  // Set up auth state listener FIRST
  supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user?.id ?? null;
    set({ 
      status: userId ? 'ready' : 'no-session', 
      userId 
    });
  });

  // THEN check for existing session
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;
  
  set({ 
    status: userId ? 'ready' : 'no-session', 
    userId 
  });
}