import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthBoot } from "@/lib/auth-bootstrap";
import { useOnboardingState } from "@/hooks/useOnboardingState";

export function useFirstLoginGate() {
  const { user } = useAuth();
  const { status: authStatus } = useAuthBoot();
  const { needsOnboarding, completeOnboarding: completeOnboardingState } = useOnboardingState();
  
  // TEMPORARILY DISABLED: Always skip onboarding
  const showOnboarding = false;

  const completeOnboarding = async () => {
    try {
      await completeOnboardingState();
      // Also persist to localStorage as fallback
      localStorage.setItem("onboarded", "true");
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Fallback to localStorage only
      localStorage.setItem("onboarded", "true");
    }
  };

  return { 
    showOnboarding: !!showOnboarding, 
    completeOnboarding 
  };
}