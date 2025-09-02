import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { ArrowRight, X } from 'lucide-react';

export function OnboardingResumeBanner() {
  // TEMPORARILY DISABLED: Always hide onboarding banner
  return null;
}