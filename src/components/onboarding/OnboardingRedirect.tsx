import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useAuth } from '@/contexts/AuthContext';

export function OnboardingRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { needsOnboarding, onboardingState } = useOnboardingState();

  useEffect(() => {
    // Only redirect if user is authenticated and needs onboarding
    if (user && needsOnboarding && location.pathname !== '/welcome' && location.pathname !== '/auth') {
      // Don't redirect if they're already on certain pages
      const allowedPaths = ['/welcome', '/auth', '/profile-settings'];
      if (!allowedPaths.includes(location.pathname)) {
        navigate('/welcome');
      }
    }
  }, [user, needsOnboarding, location.pathname, navigate]);

  return null;
}