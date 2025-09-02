// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthBoot } from '@/lib/auth-bootstrap';

interface OnboardingState {
  current_step: string;
  steps: Record<string, boolean>;
  is_completed: boolean;
  dismissed: boolean;
}

export function useOnboardingState() {
  const { user } = useAuth();
  const { status: authStatus } = useAuthBoot();
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOnboardingState = async () => {
    if (!user?.id || authStatus !== 'ready') return;
    
    try {
      const { data, error } = await supabase
        .from('user_onboarding_states')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setOnboardingState({
          current_step: data.current_step,
          steps: (data.steps as Record<string, boolean>) || {},
          is_completed: data.is_completed,
          dismissed: data.dismissed
        });
      }
    } catch (error) {
      console.error('Error fetching onboarding state:', error);
    }
  };

  const updateOnboardingState = async (updates: Partial<OnboardingState>) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Create safe base state for new users
      const baseState = onboardingState || {
        current_step: 'welcome',
        steps: {},
        is_completed: false,
        dismissed: false
      };
      const updatedState = { ...baseState, ...updates };
      
      const { error } = await supabase
        .from('user_onboarding_states')
        .upsert({
          user_id: user.id,
          current_step: updatedState.current_step,
          steps: updatedState.steps,
          is_completed: updatedState.is_completed,
          dismissed: updatedState.dismissed,
          last_seen_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setOnboardingState(updatedState);
    } catch (error) {
      console.error('Error updating onboarding state:', error);
    } finally {
      setLoading(false);
    }
  };

  const markStepComplete = async (step: string) => {
    const currentSteps = onboardingState?.steps || {};
    const newSteps = { ...currentSteps, [step]: true };
    await updateOnboardingState({ steps: newSteps });
  };

  const moveToStep = async (step: string) => {
    console.log('useOnboardingState: moveToStep called', { step, currentState: onboardingState });
    await updateOnboardingState({ current_step: step });
  };

  const completeOnboarding = async () => {
    await updateOnboardingState({ 
      is_completed: true, 
      current_step: 'completed' 
    });
    
    // Also update profile
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', user?.id);
  };

  const dismissOnboarding = async () => {
    await updateOnboardingState({ 
      dismissed: true,
      is_completed: true 
    });
  };

  useEffect(() => {
    if (user?.id && authStatus === 'ready') {
      fetchOnboardingState();
    }
  }, [user?.id, authStatus]);

  // Fix: User needs onboarding if authenticated but no completed onboarding state exists
  const needsOnboarding = user && authStatus === 'ready' && 
    (!onboardingState || (!onboardingState.is_completed && !onboardingState.dismissed));

  return {
    onboardingState,
    loading,
    needsOnboarding,
    updateOnboardingState,
    markStepComplete,
    moveToStep,
    completeOnboarding,
    dismissOnboarding,
    refetch: fetchOnboardingState
  };
}