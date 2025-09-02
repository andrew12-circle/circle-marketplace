import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useAuthBoot } from '@/lib/auth-bootstrap';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function Welcome() {
  const { user, loading: authLoading } = useAuth();
  const { status: authStatus } = useAuthBoot();
  const { onboardingState, loading: onboardingLoading, needsOnboarding } = useOnboardingState();

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if onboarding already completed or dismissed, but only after auth is ready
  if (authStatus === 'ready' && !onboardingLoading && !needsOnboarding) {
    return <Navigate to="/" replace />;
  }

  // Show loading while checking auth and onboarding state
  if (authLoading || authStatus !== 'ready' || onboardingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return <OnboardingWizard />;
}